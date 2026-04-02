from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import Tenant
from apps.products.models import Product, Category
from apps.inventory.models import StockLevel, StockMovement, Location
from apps.orders.models import Order, OrderItem, Supplier, PurchaseOrder
from apps.analytics.models import ForecastResult

class Command(BaseCommand):
    help = 'Wipes all tenant-specific data to provide a clean slate for the user.'

    def add_arguments(self, parser):
        parser.add_argument('--tenant_slug', type=str, help='The slug of the tenant to wipe')

    def handle(self, *args, **options):
        tenant_slug = options.get('tenant_slug')
        if not tenant_slug:
            self.stdout.write(self.style.ERROR('Please provide a --tenant_slug'))
            return

        try:
            tenant = Tenant.objects.get(slug=tenant_slug)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Tenant with slug "{tenant_slug}" not found'))
            return

        self.stdout.write(self.style.WARNING(f'Wiping data for tenant: {tenant.name} ({tenant_slug})...'))

        with transaction.atomic():
            # The order matters to avoid protected relation errors if any
            # (Though most are CASCADE, let's be explicit)
            
            # Orders
            OrderItem.objects.filter(order__tenant=tenant).delete()
            Order.objects.filter(tenant=tenant).delete()
            
            # Inventory
            StockMovement.objects.filter(variant__product__tenant=tenant).delete()
            StockLevel.objects.filter(variant__product__tenant=tenant).delete()
            Product.objects.filter(tenant=tenant).delete()
            Category.objects.filter(tenant=tenant).delete()
            Location.objects.filter(tenant=tenant).delete()
            
            # Procurement
            PurchaseOrder.objects.filter(supplier__tenant=tenant).delete()
            Supplier.objects.filter(tenant=tenant).delete()
            
            # Analytics
            ForecastResult.objects.filter(product__tenant=tenant).delete()

        self.stdout.write(self.style.SUCCESS(f'Successfully wiped all records for {tenant_slug}. System is now clean.'))
