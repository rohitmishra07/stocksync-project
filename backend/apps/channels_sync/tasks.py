import logging
import httpx
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from django.db import transaction

from apps.accounts.models import Tenant
from apps.products.models import Product, ProductVariant
from apps.inventory.models import StockLevel, Location
from apps.alerts.models import Alert
from .models import ShopifyStore, AmazonStore, ChannelProductMapping
from .amazon_client import AmazonSPAPIClient

logger = logging.getLogger(__name__)

@shared_task
def initial_shopify_sync(store_id):
    """
    Fetches all products from Shopify and creates/updates local mappings.
    Handles pagination via Shopify's Link header.
    """
    try:
        store = ShopifyStore.objects.get(id=store_id)
    except ShopifyStore.DoesNotExist:
        logger.error(f"Store {store_id} not found for initial sync")
        return

    headers = {"X-Shopify-Access-Token": store.access_token}
    url = f"https://{store.shop_domain}/admin/api/2025-04/products.json?limit=250"
    
    while url:
        with httpx.Client() as client:
            try:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
            except Exception as e:
                logger.error(f"Failed to fetch Shopify products for {store.shop_domain}: {str(e)}")
                break

            products = data.get('products', [])
            for shopify_product in products:
                _sync_single_shopify_product(store.tenant, shopify_product)

            # Pagination
            link_header = response.headers.get('Link')
            url = None
            if link_header:
                # Find 'next' relation
                # Example: <...>; rel="next"
                for link in link_header.split(','):
                    if 'rel="next"' in link:
                        url = link.split(';')[0].strip('< >')
                        break


def _sync_single_shopify_product(tenant, shopify_product):
    """Helper to sync a single Shopify product and its variants."""
    external_id = str(shopify_product['id'])
    
    with transaction.atomic():
        # Just use the first variant's SKU for the main Product for now if SKU is missing on product level
        # Actually StockSync models have SKU on both Product and ProductVariant
        
        # Determine if we already have a mapping for this product
        # (Though unique constraint is on product, channel)
        
        for variant in shopify_product.get('variants', []):
            sku = variant.get('sku')
            if not sku:
                continue
            
            # 1. Create/Update Product (StockSync pattern usually has a base product)
            # Find product by mapping or SKU
            product, _ = Product.objects.update_or_create(
                tenant=tenant,
                sku=sku, # Assume SKU is unique per tenant across all products
                defaults={
                    'name': shopify_product['title'],
                    'slug': shopify_product.get('handle', ''),
                    'description': shopify_product.get('body_html', ''),
                }
            )

            # 2. Create/Update Variant
            local_variant, _ = ProductVariant.objects.update_or_create(
                tenant=tenant,
                sku=sku,
                defaults={
                    'product': product,
                    'name': variant.get('title') or "Default",
                    'cost_price': variant.get('cost') or None, # Shopify cost may need separate API call but we'll try
                    'selling_price': variant.get('price'),
                }
            )

            # 3. Create Mapping
            ChannelProductMapping.objects.update_or_create(
                product=product,
                channel='shopify',
                defaults={
                    'external_id': external_id,
                    'external_variant_id': str(variant['id']),
                    'external_inventory_item_id': str(variant['inventory_item_id']),
                    'last_synced': timezone.now()
                }
            )


@shared_task
def sync_shopify_order(store_id, data):
    """Placeholder or implementation for Shopify order sync."""
    # This would involve creating an Order record in apps.orders.models
    # For now we'll just log it
    logger.info(f"Syncing Shopify order {data.get('id')} for store {store_id}")
    pass


@shared_task
def process_shopify_webhook(event, shop_domain, data):
    """
    Processes incoming webhooks from Shopify.
    """
    try:
        store = ShopifyStore.objects.get(shop_domain=shop_domain, is_active=True)
    except ShopifyStore.DoesNotExist:
        logger.warning(f"Active store not found for {shop_domain}")
        return

    if event == "inventory_levels_update":
        inventory_item_id = str(data.get('inventory_item_id'))
        new_quantity = data.get('available') # inventory_levels uses 'available'
        
        mappings = ChannelProductMapping.objects.filter(
            external_inventory_item_id=inventory_item_id,
            channel='shopify'
        )
        for mapping in mappings:
            # Update all variants linked to this inventory item (usually just one)
            variants = ProductVariant.objects.filter(product=mapping.product)
            for v in variants:
                StockLevel.objects.update_or_create(
                    variant=v,
                    location=Location.objects.filter(tenant=store.tenant, is_default=True).first(),
                    defaults={'quantity': new_quantity}
                )
                check_low_stock_alert.delay(mapping.product_id)

    elif event == "orders_create":
        sync_shopify_order.delay(store.id, data)

    elif event == "products_update":
        # Simply re-sync this product
        _sync_single_shopify_product(store.tenant, data)


@shared_task
def sync_all_shopify_stores():
    """Periodic task to sync all active Shopify stores."""
    for store in ShopifyStore.objects.filter(is_active=True):
        initial_shopify_sync.delay(store.id)


@shared_task
def check_low_stock_alert(product_id):
    """Checks if any variants of the product are below the reorder point."""
    try:
        product = Product.objects.get(id=product_id)
        # Sum quantity across all variants/locations
        total_qty = product.total_stock
        
        if total_qty < product.low_stock_threshold:
            Alert.objects.get_or_create(
                tenant=product.tenant,
                alert_type='low_stock',
                title=f"Low Stock Alert: {product.name}",
                defaults={
                    'severity': 'warning',
                    'message': f"Available stock ({total_qty}) is below the threshold ({product.low_stock_threshold}).",
                    'related_object_type': 'Product',
                    'related_object_id': product.id
                }
            )
    except Exception as e:
        logger.error(f"Error checking low stock alert for {product_id}: {str(e)}")

@shared_task
def sync_all_amazon_stores():
    """Periodic task to sync all active Amazon stores."""
    for store in AmazonStore.objects.filter(is_active=True):
        initial_amazon_sync.delay(store.id)


@shared_task
def initial_amazon_sync(store_id):
    """Fetches all inventory items from Amazon and maps them to local products."""
    try:
        store = AmazonStore.objects.get(id=store_id)
    except AmazonStore.DoesNotExist:
        logger.error(f"Amazon Store {store_id} not found for sync")
        return

    # Use the Amazon Client to fetch inventory
    client = AmazonSPAPIClient(store.refresh_token)
    inventory = client.get_inventory(store.marketplace_id)
    
    for item in inventory:
        sku = item.get("sku")
        if not sku:
            continue
            
        # 1. Find product by SKU
        product = Product.objects.filter(tenant=store.tenant, sku=sku).first()
        if not product:
            # If not found, create a new product from the Amazon name
            product = Product.objects.create(
                tenant=store.tenant,
                sku=sku,
                name=item.get("name") or f"Amazon Product {sku}",
                description="Imported from Amazon SP-API"
            )

        # 2. Find variant (or create one)
        variant, _ = ProductVariant.objects.get_or_create(
            tenant=store.tenant,
            sku=sku,
            defaults={"product": product, "name": "Default"}
        )

        # 3. Create/Update Mapping
        ChannelProductMapping.objects.update_or_create(
            product=product,
            channel='amazon',
            defaults={
                'external_id': item.get("asin"),
                'external_variant_id': item.get("asin"), # Use ASIN as variant id too for now
                'last_synced': timezone.now()
            }
        )

        # 4. Sync Stock Level
        # Find default location
        location = Location.objects.filter(tenant=store.tenant, is_default=True).first()
        if location:
            StockLevel.objects.update_or_create(
                variant=variant,
                location=location,
                defaults={'quantity': item.get("quantity", 0)}
            )
            
    store.last_sync_at = timezone.now()
    store.save(update_fields=['last_sync_at'])
