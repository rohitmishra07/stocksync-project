"""Inventory serializers."""

from rest_framework import serializers

from .models import Location, StockLevel, StockMovement


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "address", "is_default", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class StockLevelSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True)
    product_name = serializers.CharField(source="variant.product.name", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = StockLevel
        fields = [
            "id", "variant", "variant_sku", "variant_name", "product_name",
            "location", "location_name",
            "quantity", "reserved_quantity", "available_quantity",
            "updated_at",
        ]


class StockAdjustmentSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    location_id = serializers.UUIDField()
    quantity_change = serializers.IntegerField()
    notes = serializers.CharField(required=False, default="")


class StockTransferSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    from_location_id = serializers.UUIDField()
    to_location_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, default="")


class StockMovementSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)
    product_name = serializers.CharField(source="variant.product.name", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True, default=None)

    class Meta:
        model = StockMovement
        fields = [
            "id", "variant", "variant_sku", "product_name",
            "location", "location_name",
            "movement_type", "quantity_change",
            "reference_type", "reference_id",
            "notes", "created_by", "created_by_email",
            "created_at",
        ]


class InventoryValuationSerializer(serializers.Serializer):
    location_id = serializers.UUIDField()
    location_name = serializers.CharField()
    total_items = serializers.IntegerField()
    total_cost_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_retail_value = serializers.DecimalField(max_digits=14, decimal_places=2)
