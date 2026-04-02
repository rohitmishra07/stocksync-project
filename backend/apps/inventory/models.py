"""Inventory models — stock levels, movements, locations."""

from django.conf import settings
from django.db import models

from apps.common.models import TenantModel, TimeStampedModel


class Location(TenantModel):
    """Warehouse or store location."""

    name = models.CharField(max_length=255)
    address = models.JSONField(default=dict, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-is_default", "name"]
        unique_together = [("tenant", "name")]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one default per tenant
        if self.is_default:
            Location.objects.filter(tenant=self.tenant, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class StockLevel(TimeStampedModel):
    """Current stock quantity for a variant at a location."""

    id = models.BigAutoField(primary_key=True)
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="stock_levels",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="stock_levels",
    )
    quantity = models.IntegerField(default=0)
    reserved_quantity = models.IntegerField(default=0, help_text="Committed to unfulfilled orders")

    class Meta:
        unique_together = [("variant", "location")]
        ordering = ["variant", "location"]

    def __str__(self):
        return f"{self.variant.sku} @ {self.location.name}: {self.quantity}"

    @property
    def available_quantity(self):
        return max(self.quantity - self.reserved_quantity, 0)


class StockMovement(TimeStampedModel):
    """Immutable audit trail of all stock changes."""

    MOVEMENT_TYPES = [
        ("purchase_in", "Purchase In"),
        ("sale_out", "Sale Out"),
        ("adjustment", "Adjustment"),
        ("transfer_in", "Transfer In"),
        ("transfer_out", "Transfer Out"),
        ("return_in", "Return In"),
    ]

    REFERENCE_TYPES = [
        ("order", "Order"),
        ("purchase_order", "Purchase Order"),
        ("manual", "Manual"),
        ("transfer", "Transfer"),
        ("sync", "Channel Sync"),
    ]

    id = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(
        "accounts.Tenant",
        on_delete=models.CASCADE,
        related_name="stock_movements",
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="movements",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="movements",
    )
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity_change = models.IntegerField(help_text="Positive = in, negative = out")
    quantity_before = models.IntegerField(default=0)
    quantity_after = models.IntegerField(default=0)
    reference_type = models.CharField(max_length=20, choices=REFERENCE_TYPES, default="manual")
    reference_id = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type}: {self.variant.sku} {self.quantity_change:+d} @ {self.location.name}"
