from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.billing.models import Plan, TenantSubscription
from apps.accounts.models import Tenant

class Command(BaseCommand):
    help = 'Seeds pricing plans and configures demo subscription'

    def handle(self, *args, **options):
        # 1. Seed Plans
        starter, _ = Plan.objects.get_or_create(
            name='starter',
            defaults={
                'display_name': 'Starter',
                'price_monthly_usd': 49.00,
                'price_monthly_inr': 4000.00,
                'max_skus': 500,
                'max_channels': 1,
                'max_locations': 1,
                'max_users': 2,
                'has_forecasting': False,
                'has_gst_reports': False,
                'has_whatsapp_alerts': False,
                'has_bundles': False,
                'has_api_access': False,
            }
        )
        
        growth, _ = Plan.objects.get_or_create(
            name='growth',
            defaults={
                'display_name': 'Growth',
                'price_monthly_usd': 99.00,
                'price_monthly_inr': 8000.00,
                'max_skus': 2000,
                'max_channels': 3,
                'max_locations': 3,
                'max_users': 5,
                'has_forecasting': True,
                'has_gst_reports': True,
                'has_whatsapp_alerts': False,
                'has_bundles': True,
                'has_api_access': False,
            }
        )
        
        pro, _ = Plan.objects.get_or_create(
            name='pro',
            defaults={
                'display_name': 'Pro',
                'price_monthly_usd': 149.00,
                'price_monthly_inr': 12000.00,
                'max_skus': -1,
                'max_channels': -1,
                'max_locations': -1,
                'max_users': -1,
                'has_forecasting': True,
                'has_gst_reports': True,
                'has_whatsapp_alerts': True,
                'has_bundles': True,
                'has_api_access': True,
            }
        )

        self.stdout.write(self.style.SUCCESS("Plans seeded successfully."))

        # 2. Seed Subscription for Demo Store
        demo_tenant = Tenant.objects.filter(name="Demo Store").first()
        if demo_tenant:
            sub, created = TenantSubscription.objects.get_or_create(
                tenant=demo_tenant,
                defaults={
                    'plan': growth,
                    'status': 'trialing',
                    'trial_ends_at': timezone.now() + timedelta(days=14)
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created 14-day trial Growth subscription for {demo_tenant.name}."))
            else:
                self.stdout.write(self.style.SUCCESS(f"Subscription already exists for {demo_tenant.name}."))
        else:
            self.stdout.write(self.style.WARNING("Cannot seed subscription: 'Demo Store' tenant not found."))
