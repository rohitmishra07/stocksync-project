"""Analytics and forecasting models."""

from django.db import models
from apps.common.models import TenantModel


class ForecastResult(TenantModel):
    """Calculated demand forecasting results for a product."""

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="forecasts",
    )
    daily_avg_sales = models.FloatField()
    days_of_stock_left = models.FloatField(null=True)
    reorder_suggestion_qty = models.IntegerField()
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["days_of_stock_left"]
        verbose_name = "forecast result"
        verbose_name_plural = "forecast results"

    def __str__(self):
        return f"Forecast for {self.product.name} ({self.calculated_at.date()})"
