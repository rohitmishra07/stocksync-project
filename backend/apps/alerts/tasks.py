"""Celery tasks for alert generation."""

import logging

from celery import shared_task
from django.db.models import F

logger = logging.getLogger(__name__)


@shared_task
def check_low_stock_levels():
    """Check all tenants for low stock items and create alerts."""
    from apps.accounts.models import Tenant
    from apps.inventory.models import StockLevel
    from .models import Alert, AlertSettings

    # Mock Twilio Client
    class MockTwilioClient:
        def messages(self):
            return self

        def create(self, **kwargs):
            print(f"[TWILIO MOCK] Sending WhatsApp to {kwargs.get('to')}: {kwargs.get('body')}")
            return True

    twilio_client = MockTwilioClient()

    for tenant in Tenant.objects.filter(is_active=True):
        low_stock_items = StockLevel.objects.filter(
            location__tenant=tenant,
            quantity__lte=F("variant__product__low_stock_threshold"),
            variant__is_active=True,
            variant__product__is_active=True,
        ).select_related("variant__product", "location")

        for stock in low_stock_items:
            product = stock.variant.product

            # Skip if we already have an unread alert for this
            existing = Alert.objects.filter(
                tenant=tenant,
                alert_type="low_stock" if stock.quantity > 0 else "out_of_stock",
                related_object_id=stock.variant.id,
                is_read=False,
                is_dismissed=False,
            ).exists()

            if not existing:
                alert_type = "out_of_stock" if stock.quantity == 0 else "low_stock"
                severity = "critical" if stock.quantity == 0 else "warning"

                alert = Alert.objects.create(
                    tenant=tenant,
                    alert_type=alert_type,
                    severity=severity,
                    title=f"{'Out of stock' if stock.quantity == 0 else 'Low stock'}: {product.name}",
                    message=(
                        f"{product.name} (SKU: {stock.variant.sku}) at "
                        f"{stock.location.name} has {stock.quantity} units "
                        f"(threshold: {product.low_stock_threshold})."
                    ),
                    related_object_type="product_variant",
                    related_object_id=stock.variant.id,
                )

                settings = AlertSettings.objects.filter(tenant=tenant).first()
                if settings and settings.whatsapp_alerts_enabled and settings.whatsapp_number:
                    twilio_client.messages().create(
                        body=f"StockSync Alert: {alert.title} - {alert.message}",
                        from_="whatsapp:+14155238886",
                        to=f"whatsapp:{settings.whatsapp_number}"
                    )

    logger.info("Low stock check completed.")
