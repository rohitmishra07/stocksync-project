"""Analytics serializers."""

from rest_framework import serializers
from .models import ForecastResult


class ForecastResultSerializer(serializers.ModelSerializer):
    """Serializer for demand forecasting results."""
    
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    
    class Meta:
        model = ForecastResult
        fields = [
            "id", "product", "product_name", "product_sku",
            "daily_avg_sales", "days_of_stock_left",
            "reorder_suggestion_qty", "calculated_at"
        ]
        read_only_fields = fields
