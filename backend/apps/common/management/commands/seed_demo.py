"""Populate the database with realistic demo data."""

import random
from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.accounts.models import Tenant, User
from apps.inventory.models import Location, StockLevel
from apps.inventory.services import adjust_stock
from apps.orders.models import Order, OrderItem, Supplier, PurchaseOrder, PurchaseOrderLine
from apps.products.models import Category, Product, ProductVariant, Bundle, BundleComponent
from apps.analytics.forecasting import recalculate_all_forecasts
from apps.billing.models import Plan, TenantSubscription


PRODUCT_DATA = [
    {"name": "Wireless Bluetooth Mouse", "sku": "MOUSE-BT-001", "cost": 8.50, "price": 24.99, "cat": "Electronics", "hsn": "84716060"},
    {"name": "USB-C Hub 7-in-1", "sku": "HUB-USB-001", "cost": 15.00, "price": 39.99, "cat": "Electronics", "hsn": "84718000"},
    {"name": "Mechanical Keyboard", "sku": "KB-MECH-001", "cost": 35.00, "price": 79.99, "cat": "Electronics", "hsn": "84716010"},
    {"name": "Laptop Stand Aluminum", "sku": "STAND-AL-001", "cost": 12.00, "price": 34.99, "cat": "Electronics", "hsn": "84733099"},
    {"name": "Webcam 1080p HD", "sku": "CAM-HD-001", "cost": 18.00, "price": 49.99, "cat": "Electronics", "hsn": "85258010"},
    {"name": "Noise Cancelling Headphones", "sku": "HP-NC-001", "cost": 45.00, "price": 129.99, "cat": "Electronics", "hsn": "85183000"},
    {"name": "Phone Case - iPhone 15", "sku": "CASE-IP15-001", "cost": 3.00, "price": 14.99, "cat": "Accessories", "hsn": "39269099"},
    {"name": "Screen Protector Pack (3)", "sku": "SP-3PK-001", "cost": 1.50, "price": 9.99, "cat": "Accessories", "hsn": "70071900"},
    {"name": "Charging Cable USB-C 6ft", "sku": "CBL-USBC-001", "cost": 2.00, "price": 12.99, "cat": "Accessories", "hsn": "85444299"},
    {"name": "Power Bank 10000mAh", "sku": "PB-10K-001", "cost": 10.00, "price": 29.99, "cat": "Accessories", "hsn": "85076000"},
    {"name": "Desk Organizer Wood", "sku": "ORG-WOOD-001", "cost": 8.00, "price": 22.99, "cat": "Office", "hsn": "44219990"},
    {"name": "Ergonomic Mouse Pad", "sku": "PAD-ERGO-001", "cost": 4.00, "price": 16.99, "cat": "Office", "hsn": "40161000"},
    {"name": "Monitor Light Bar", "sku": "LIGHT-MON-001", "cost": 20.00, "price": 54.99, "cat": "Office", "hsn": "94052000"},
    {"name": "Cable Management Kit", "sku": "CBL-KIT-001", "cost": 5.00, "price": 18.99, "cat": "Office", "hsn": "39269099"},
    {"name": "Portable SSD 500GB", "sku": "SSD-500-001", "cost": 30.00, "price": 69.99, "cat": "Storage", "hsn": "84717020"},
]

CUSTOMER_NAMES = [
    "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince",
    "Eve Martinez", "Frank Wilson", "Grace Lee", "Henry Taylor",
    "Ivy Chen", "Jack Anderson", "Karen White", "Leo Garcia",
]


class Command(BaseCommand):
    help = "Seed the database with demo data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        # Create tenant
        tenant, _ = Tenant.objects.get_or_create(
            slug="demo-store",
            defaults={
                "name": "Demo Store",
                "plan": "pro",
                "settings": {"currency": "USD", "timezone": "UTC"},
            },
        )

        # Create owner
        owner, created = User.objects.get_or_create(
            email="demo@stocksync.dev",
            defaults={
                "tenant": tenant,
                "role": "owner",
                "first_name": "Demo",
                "last_name": "User",
            },
        )
        if created:
            owner.set_password("demo1234")
            owner.save()

        # Create Plan & Subscription
        plan, _ = Plan.objects.get_or_create(
            name="pro",
            defaults={
                "display_name": "Pro Plan",
                "price_monthly_inr": Decimal("4999.00"),
                "price_monthly_usd": Decimal("59.00"),
                "max_skus": -1,
                "max_channels": 10,
                "max_locations": 10,
                "max_users": 20,
                "has_forecasting": True,
                "has_gst_reports": True,
                "has_whatsapp_alerts": True,
                "has_bundles": True,
                "has_api_access": True,
            }
        )
        TenantSubscription.objects.get_or_create(
            tenant=tenant,
            defaults={"plan": plan, "status": "active"}
        )

        # Create locations
        warehouse, _ = Location.objects.get_or_create(
            tenant=tenant, name="Main Warehouse",
            defaults={"is_default": True, "address": {"city": "Austin", "state": "TX"}},
        )
        store, _ = Location.objects.get_or_create(
            tenant=tenant, name="Retail Store",
            defaults={"address": {"city": "Austin", "state": "TX"}},
        )

        # Create categories
        categories = {}
        for cat_name in set(p["cat"] for p in PRODUCT_DATA):
            cat, _ = Category.objects.get_or_create(
                tenant=tenant, name=cat_name
            )
            categories[cat_name] = cat

        # Create products and stock
        variants = []
        for pd in PRODUCT_DATA:
            product, created = Product.objects.get_or_create(
                tenant=tenant, sku=pd["sku"],
                defaults={
                    "name": pd["name"],
                    "slug": pd["sku"].lower(),
                    "category": categories[pd["cat"]],
                    "cost_price": Decimal(str(pd["cost"])),
                    "selling_price": Decimal(str(pd["price"])),
                    "low_stock_threshold": 10,
                    "hsn_code": pd["hsn"],
                    "gst_rate": random.choice([12.0, 18.0, 28.0]),
                },
            )
            if created:
                variant = ProductVariant.objects.create(
                    tenant=tenant,
                    product=product,
                    sku=product.sku,
                    name="Default",
                    cost_price=product.cost_price,
                    selling_price=product.selling_price,
                )
                # Add stock
                wh_qty = random.randint(20, 200)
                st_qty = random.randint(5, 50)
                adjust_stock(variant, warehouse, wh_qty, user=owner, notes="Initial stock")
                adjust_stock(variant, store, st_qty, user=owner, notes="Initial stock")
                variants.append(variant)

        if not variants:
            variants = list(ProductVariant.objects.filter(product__tenant=tenant))

        # Create orders
        channels = ["manual", "shopify", "amazon"]
        statuses = ["pending", "confirmed", "processing", "shipped", "delivered"]
        for i in range(25):
            order = Order.objects.create(
                tenant=tenant,
                channel=random.choice(channels),
                status=random.choice(statuses),
                customer_name=random.choice(CUSTOMER_NAMES),
                customer_email=f"customer{i}@example.com",
                currency="USD",
            )
            # Add 1-4 items
            for _ in range(random.randint(1, 4)):
                v = random.choice(variants)
                qty = random.randint(1, 5)
                OrderItem.objects.create(
                    order=order,
                    variant=v,
                    sku=v.sku,
                    name=v.product.name,
                    quantity=qty,
                    unit_price=v.effective_selling_price,
                )
            order.recalculate_totals()

        # Create Suppliers
        suppliers = []
        for name in ["Logitech Global", "Apple Inc.", "Office Max", "IKEA B2B"]:
            supplier, _ = Supplier.objects.get_or_create(
                tenant=tenant, name=name,
                defaults={
                    "email": f"sales@{''.join(name.lower().split())}.com",
                    "lead_days": random.randint(3, 14),
                    "phone": f"+1-{random.randint(100, 999)}-0000"
                }
            )
            suppliers.append(supplier)

        # Create Bundles
        office_bundle, created = Bundle.objects.get_or_create(
            tenant=tenant, sku="BUNDLE-OFFICE-LITE",
            defaults={"name": "Home Office Starter Kit", "price": Decimal("129.99")}
        )
        if created:
            items = Product.objects.filter(category=categories["Office"])[:2]
            for p in items:
                BundleComponent.objects.create(bundle=office_bundle, product=p, quantity=1)
        
        gaming_bundle, created = Bundle.objects.get_or_create(
            tenant=tenant, sku="BUNDLE-GAMING-PREMIUM",
            defaults={"name": "Ultima Gaming Gear Set", "price": Decimal("199.99")}
        )
        if created:
            items = Product.objects.filter(category=categories["Electronics"])[:3]
            for p in items:
                BundleComponent.objects.create(bundle=gaming_bundle, product=p, quantity=1)

        # Create Purchase Orders
        for i in range(3):
            po = PurchaseOrder.objects.create(
                tenant=tenant,
                supplier=random.choice(suppliers),
                status=random.choice(["draft", "sent", "confirmed"]),
                notes=f"Auto-generated restock for Q2 - Batch {i+1}"
            )
            # Add 2-5 items to PO
            for p in Product.objects.filter(tenant=tenant).order_by("?")[:random.randint(2, 5)]:
                PurchaseOrderLine.objects.create(
                    purchase_order=po,
                    product=p,
                    quantity_ordered=random.randint(50, 200),
                    unit_cost=p.cost_price
                )

        # Recalculate all forecasts
        recalculate_all_forecasts()

        self.stdout.write(self.style.SUCCESS(
            f"Done! Created {len(PRODUCT_DATA)} products, "
            f"25 orders, 2 bundles, and 3 POs for tenant '{tenant.name}'. "
            f"Intelligence engine triggered!"
        ))
