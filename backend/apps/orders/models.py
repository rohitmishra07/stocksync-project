"""Order models."""

import uuid
from django.db import models
from apps.common.models import TenantModel


class Supplier(TenantModel):
    """Vendor who supplies stock."""

    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    lead_days = models.PositiveIntegerField(default=7)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Order(TenantModel):
    """Sales order from any channel."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("returned", "Returned"),
    ]

    order_number = models.CharField(max_length=50, db_index=True)
    external_order_id = models.CharField(max_length=255, blank=True, db_index=True)
    channel = models.CharField(
        max_length=20,
        choices=[
            ("manual", "Manual"),
            ("shopify", "Shopify"),
            ("amazon", "Amazon"),
            ("woocommerce", "WooCommerce"),
            ("pos", "POS"),
        ],
        default="manual",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    customer_name = models.CharField(max_length=255, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=50, blank=True)
    shipping_address = models.JSONField(default=dict, blank=True)
    billing_address = models.JSONField(default=dict, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")
    notes = models.TextField(blank=True)
    placed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    tracking_number = models.CharField(max_length=255, blank=True)
    tracking_url = models.URLField(blank=True)
    fulfilled_from = models.ForeignKey(
        "inventory.Location",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fulfilled_orders",
    )

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("tenant", "order_number")]

    def __str__(self):
        return f"Order {self.order_number}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            last = Order.objects.filter(tenant=self.tenant).count()
            self.order_number = f"ORD-{last + 1:06d}"
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        items = self.items.all()
        self.subtotal = sum(item.total for item in items)
        self.tax_total = sum(item.tax for item in items)
        self.grand_total = (
            self.subtotal + self.tax_total + self.shipping_total - self.discount_total
        )
        self.save(update_fields=["subtotal", "tax_total", "grand_total", "updated_at"])


class OrderItem(models.Model):
    """Line item in an order."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.SET_NULL,
        null=True,
        related_name="order_items",
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        related_name="variant_order_items",
    )
    sku = models.CharField(max_length=100)
    name = models.CharField(max_length=500, help_text="Product name snapshot at order time")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        if not self.product and self.variant:
            self.product = self.variant.product
        if not self.sku and self.variant:
            self.sku = self.variant.sku
        super().save(*args, **kwargs)

    @property
    def total(self):
        return (self.unit_price * self.quantity) - self.discount


class PurchaseOrder(TenantModel):
    """Inbound order from a supplier."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("confirmed", "Confirmed"),
        ("partially_received", "Partially Received"),
        ("complete", "Complete"),
        ("cancelled", "Cancelled"),
    ]

    supplier = models.ForeignKey(
        Supplier, on_delete=models.CASCADE, related_name="purchase_orders"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    po_number = models.CharField(max_length=50, db_index=True)
    token = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    notes = models.TextField(blank=True)
    expected_delivery = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("tenant", "po_number")]

    def save(self, *args, **kwargs):
        if not self.po_number:
            count = PurchaseOrder.objects.filter(tenant=self.tenant).count()
            self.po_number = f"PO-2026-{count + 1:04d}"
        super().save(*args, **kwargs)


class PurchaseOrderLine(models.Model):
    """Line item in a PO."""

    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="lines"
    )
    product = models.ForeignKey("products.Product", on_delete=models.CASCADE)
    quantity_ordered = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
