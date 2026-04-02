from django.db import models
from apps.common.models import TimeStampedModel

class ShopifyStore(TimeStampedModel):
    """Configuration for a Shopify channel integration."""
    tenant = models.ForeignKey(
        'accounts.Tenant',
        on_delete=models.CASCADE,
        related_name='shopify_stores'
    )
    shop_domain = models.CharField(max_length=255, unique=True)
    access_token = models.CharField(max_length=255)
    webhook_secret = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    installed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.shop_domain


class AmazonStore(TimeStampedModel):
    """Configuration for an Amazon Selling Partner API integration."""
    tenant = models.ForeignKey(
        'accounts.Tenant',
        on_delete=models.CASCADE,
        related_name='amazon_stores'
    )
    marketplace_id = models.CharField(max_length=50) # e.g. ATVPDKIKX0DER for US
    seller_id = models.CharField(max_length=50)
    refresh_token = models.TextField() # Encrypt this in production
    is_active = models.BooleanField(default=True)
    sync_inventory = models.BooleanField(default=True)
    sync_orders = models.BooleanField(default=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Amazon Seller {self.seller_id} ({self.marketplace_id})"


class ChannelProductMapping(TimeStampedModel):
    """Maps a local product to an external channel product."""
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='channel_mappings'
    )
    channel = models.CharField(
        max_length=20,
        choices=[('shopify', 'Shopify'), ('amazon', 'Amazon')]
    )
    external_id = models.CharField(
        max_length=100,
        help_text="Shopify product_id or Amazon ASIN"
    )
    external_variant_id = models.CharField(max_length=100, blank=True)
    external_inventory_item_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="For inventory level sync"
    )
    last_synced = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('product', 'channel')

    def __str__(self):
        return f"{self.product.sku} <-> {self.channel} ({self.external_id})"
