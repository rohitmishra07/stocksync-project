"""Alert and notification models."""

import uuid

from django.db import models

from apps.common.models import TenantModel


class Alert(TenantModel):
    """System-generated alerts for the tenant."""

    ALERT_TYPES = [
        ("low_stock", "Low Stock"),
        ("out_of_stock", "Out of Stock"),
        ("order_received", "Order Received"),
        ("sync_failure", "Sync Failure"),
        ("po_overdue", "PO Overdue"),
    ]

    SEVERITY_CHOICES = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("critical", "Critical"),
    ]

    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES, db_index=True)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="info")
    title = models.CharField(max_length=500)
    message = models.TextField()
    related_object_type = models.CharField(max_length=50, blank=True, default="")
    related_object_id = models.UUIDField(null=True, blank=True)
    product = models.ForeignKey(
        "products.Product", on_delete=models.SET_NULL, null=True, blank=True
    )
    is_read = models.BooleanField(default=False, db_index=True)
    is_dismissed = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    sent_via = models.CharField(
        max_length=20,
        choices=[("email", "Email"), ("whatsapp", "WhatsApp"), ("in_app", "In-App")],
        default="in_app",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.severity}] {self.title}"


class AlertSettings(TenantModel):
    """Alert preferences per tenant."""

    tenant = models.OneToOneField(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="alert_settings"
    )
    email_alerts_enabled = models.BooleanField(default=True)
    whatsapp_alerts_enabled = models.BooleanField(default=False)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    low_stock_threshold_override = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "alert settings"
