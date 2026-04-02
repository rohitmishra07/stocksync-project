"""Product and variant models."""

from django.db import models

from apps.common.models import TenantModel


class Category(TenantModel):
    """Product category with tree structure."""

    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "categories"
        unique_together = [("tenant", "name", "parent")]

    def __str__(self):
        return self.name


class Product(TenantModel):
    """Main product record."""

    name = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500)
    sku = models.CharField(max_length=100, db_index=True)
    barcode = models.CharField(max_length=100, blank=True, db_index=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    brand = models.CharField(max_length=255, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage")
    weight = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True, help_text="kg")
    dimensions = models.JSONField(default=dict, blank=True, help_text='{"length": 0, "width": 0, "height": 0}')
    attributes = models.JSONField(default=dict, blank=True, help_text="Custom product attributes")
    images = models.JSONField(default=list, blank=True, help_text="List of image URLs")
    low_stock_threshold = models.PositiveIntegerField(default=10)
    hsn_code = models.CharField(max_length=20, blank=True)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("tenant", "sku")]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def total_stock(self):
        """Sum of available stock across all locations."""
        return sum(
            v.stock_levels.aggregate(total=models.Sum("quantity"))["total"] or 0
            for v in self.variants.all()
        )


class ProductVariant(TenantModel):
    """Product variant (size, color, etc.)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
    )
    sku = models.CharField(max_length=100, db_index=True)
    barcode = models.CharField(max_length=100, blank=True, db_index=True)
    name = models.CharField(max_length=255, help_text='e.g. "Red / Large"')
    attributes = models.JSONField(default=dict, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    weight = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("tenant", "sku")]

    def __str__(self):
        return f"{self.product.name} — {self.name}"

    @property
    def effective_cost_price(self):
        return self.cost_price if self.cost_price is not None else self.product.cost_price

    @property
    def effective_selling_price(self):
        return self.selling_price if self.selling_price is not None else self.product.selling_price


class Bundle(TenantModel):
    """Product Bundle / Kit containing multiple items."""

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, db_index=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("tenant", "sku")]

    def __str__(self):
        return self.name

    @property
    def available_stock(self):
        """Computed stock based on min component availability."""
        components = self.components.all()
        if not components.exists():
            return 0
        return min(comp.product.total_stock // comp.quantity for comp in components)


class BundleComponent(models.Model):
    """Link between Bundle and its component Products."""

    bundle = models.ForeignKey(Bundle, on_delete=models.CASCADE, related_name="components")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in {self.bundle.name}"
