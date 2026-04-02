"""Product serializers."""

from django.utils.text import slugify
from rest_framework import serializers

from apps.inventory.models import StockLevel

from .models import Category, Product, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "parent", "sort_order", "children", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_children(self, obj):
        children = obj.children.filter(is_deleted=False)
        return CategorySerializer(children, many=True).data


class VariantStockSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True)

    class Meta:
        model = StockLevel
        fields = ["id", "location", "location_name", "quantity", "reserved_quantity", "available_quantity"]
        read_only_fields = ["id", "available_quantity"]


class ProductVariantSerializer(serializers.ModelSerializer):
    stock_levels = VariantStockSerializer(many=True, read_only=True)
    effective_cost_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    effective_selling_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id", "sku", "barcode", "name", "attributes",
            "cost_price", "selling_price", "weight", "is_active",
            "effective_cost_price", "effective_selling_price",
            "stock_levels", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    total_stock = serializers.IntegerField(read_only=True)
    variant_ids = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "sku", "barcode", "category", "category_name",
            "brand", "cost_price", "selling_price", "total_stock",
            "low_stock_threshold", "margin", "variant_ids",
            "is_active", "images", "created_at",
        ]

    def get_variant_ids(self, obj):
        return list(obj.variants.values_list("id", flat=True))


class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    total_stock = serializers.IntegerField(read_only=True)
    
    # Write-only fields for initial setup
    initial_stock = serializers.IntegerField(write_only=True, required=False)
    location_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "barcode", "description",
            "category", "category_name", "brand", "cost_price",
            "selling_price", "tax_rate", "weight", "dimensions",
            "attributes", "images", "low_stock_threshold",
            "is_active", "total_stock", "margin", "variants",
            "initial_stock", "location_id", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def create(self, validated_data):
        from apps.inventory.services import adjust_stock
        from apps.inventory.models import Location, StockLevel
        
        initial_stock = validated_data.pop("initial_stock", 0)
        location_id = validated_data.pop("location_id", None)
        
        validated_data["slug"] = slugify(validated_data["name"])
        product = super().create(validated_data)
        
        # Create a default variant
        variant = ProductVariant.objects.create(
            tenant=product.tenant,
            product=product,
            sku=product.sku,
            barcode=product.barcode,
            name="Default",
        )
        
        # Find location (provided, default, or first available)
        location = None
        if location_id:
            location = Location.objects.filter(tenant=product.tenant, id=location_id).first()
        
        if not location:
            location = Location.objects.filter(tenant=product.tenant, is_default=True).first()
            
        if not location:
            location = Location.objects.filter(tenant=product.tenant).first()
            
        # Ensure a StockLevel record exists so it shows in Inventory views
        if location:
            StockLevel.objects.get_or_create(
                variant=variant,
                location=location,
                defaults={"quantity": 0}
            )
            
            # If initial stock is provided and > 0, adjust it
            if initial_stock > 0:
                adjust_stock(
                    variant=variant,
                    location=location,
                    quantity_change=initial_stock,
                    user=self.context["request"].user,
                    notes="Initial stock upon product creation",
                )
                
        return product

    def update(self, instance, validated_data):
        if "name" in validated_data:
            validated_data["slug"] = slugify(validated_data["name"])
        return super().update(instance, validated_data)


class ProductImportSerializer(serializers.Serializer):
    """CSV import."""

    file = serializers.FileField()


class BarcodeSerializer(serializers.Serializer):
    """Barcode lookup response."""

    product = ProductListSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True, required=False)


class BundleComponentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        from .models import BundleComponent
        model = BundleComponent
        fields = ["id", "product", "product_name", "quantity"]


class BundleSerializer(serializers.ModelSerializer):
    components = BundleComponentSerializer(many=True, read_only=True)

    class Meta:
        from .models import Bundle
        model = Bundle
        fields = ["id", "name", "sku", "price", "is_active", "components", "created_at"]
        read_only_fields = ["id", "created_at"]
