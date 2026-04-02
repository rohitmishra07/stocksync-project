from rest_framework import serializers
from .models import Order, OrderItem, Supplier, PurchaseOrder, PurchaseOrderLine


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "email", "phone", "lead_days", "address"]


class OrderItemSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "variant", "sku", "name", "quantity",
            "unit_price", "discount", "tax", "total",
        ]


class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = PurchaseOrderLine
        fields = ["id", "product", "product_name", "quantity_ordered", "quantity_received", "unit_cost"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    lines = PurchaseOrderLineSerializer(many=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            "id", "supplier", "supplier_name", "status", "po_number",
            "token", "notes", "expected_delivery", "lines"
        ]
        read_only_fields = ["id", "po_number", "token"]

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])
        po = PurchaseOrder.objects.create(**validated_data)
        for line_data in lines_data:
            PurchaseOrderLine.objects.create(purchase_order=po, **line_data)
        return po


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "channel", "status",
            "customer_name", "customer_email",
            "grand_total", "currency", "item_count",
            "placed_at", "shipped_at", "created_at",
        ]
        read_only_fields = ["id", "order_number", "created_at"]

    def get_item_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "external_order_id", "channel", "status",
            "customer_name", "customer_email", "customer_phone",
            "shipping_address", "billing_address",
            "subtotal", "tax_total", "shipping_total", "discount_total", "grand_total",
            "currency", "notes", "items",
            "tracking_number", "tracking_url", "fulfilled_from",
            "placed_at", "shipped_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "order_number", "created_at", "updated_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        order.recalculate_totals()
        return order


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)


class OrderFulfillSerializer(serializers.Serializer):
    location_id = serializers.UUIDField()
    tracking_number = serializers.CharField(required=False, default="")
    tracking_url = serializers.URLField(required=False, default="")
