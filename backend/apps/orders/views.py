"""Order views."""

from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.mixins import TenantQuerySetMixin
from apps.inventory.models import Location
from apps.inventory.services import InsufficientStockError

from django.core.mail import send_mail
from django.conf import settings
from .models import Order, Supplier, PurchaseOrder, PurchaseOrderLine
from .serializers import (
    OrderDetailSerializer,
    OrderFulfillSerializer,
    OrderListSerializer,
    OrderStatusSerializer,
    SupplierSerializer,
    PurchaseOrderSerializer,
)
from .services import cancel_order, fulfill_order


class OrderViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    queryset = Order.objects.prefetch_related("items")
    filterset_fields = ["status", "channel"]
    search_fields = ["order_number", "customer_name", "customer_email"]
    ordering_fields = ["created_at", "grand_total", "order_number"]

    def get_serializer_class(self):
        if self.action == "list":
            return OrderListSerializer
        return OrderDetailSerializer

    @action(detail=True, methods=["put"], serializer_class=OrderStatusSerializer)
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order.status = serializer.validated_data["status"]
        order.save(update_fields=["status", "updated_at"])
        return Response(OrderListSerializer(order).data)

    @action(detail=True, methods=["post"], serializer_class=OrderFulfillSerializer)
    def fulfill(self, request, pk=None):
        order = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            location = Location.objects.get(
                id=serializer.validated_data["location_id"],
                tenant=request.user.tenant,
            )
        except Location.DoesNotExist:
            return Response({"detail": "Location not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            order = fulfill_order(order, location, request.user)
        except (InsufficientStockError, ValueError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if serializer.validated_data.get("tracking_number"):
            order.tracking_number = serializer.validated_data["tracking_number"]
        if serializer.validated_data.get("tracking_url"):
            order.tracking_url = serializer.validated_data["tracking_url"]
        order.save()

        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        try:
            order = cancel_order(order, order.fulfilled_from, request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderDetailSerializer(order).data)
from apps.inventory.models import StockLevel


class SupplierViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    search_fields = ["name", "email"]


class PurchaseOrderViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.prefetch_related("lines", "lines__product")
    serializer_class = PurchaseOrderSerializer
    filterset_fields = ["status", "supplier"]
    search_fields = ["po_number", "supplier__name"]

    @action(detail=True, methods=["patch"])
    def send(self, request, pk=None):
        po = self.get_object()
        po.status = "sent"
        po.save()

        # Send email to supplier
        subject = f"Purchase Order {po.po_number} from {po.tenant.name}"
        message = f"Please find the details of our purchase order here: {settings.FRONTEND_URL}/po-public/{po.token}"
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [po.supplier.email],
            fail_silently=False,
        )
        return Response(PurchaseOrderSerializer(po).data)

    @action(detail=True, methods=["patch"])
    def receive(self, request, pk=None):
        po = self.get_object()
        lines_data = request.data.get("lines", [])
        
        # We need a default location to receive items if none specified
        # For simplicity, we'll use the tenant's first location
        from apps.inventory.models import Location
        location = Location.objects.filter(tenant=po.tenant, is_active=True).first()
        if not location:
            return Response({"detail": "No active location found to receive stock."}, status=status.HTTP_400_BAD_REQUEST)

        all_received = True
        for item in lines_data:
            line = po.lines.get(id=item["line_id"])
            qty_to_receive = int(item["quantity_received"])
            
            # Update PO line
            line.quantity_received += qty_to_receive
            line.save()

            if line.quantity_received < line.quantity_ordered:
                all_received = False
            
            # Update inventory stock - use the first variant for now or extend model
            # For simplicity, we'll find the primary variant or create one
            variant = line.product.variants.first()
            if variant:
                stock, _ = StockLevel.objects.get_or_create(
                    tenant=po.tenant,
                    variant=variant,
                    location=location,
                    defaults={"quantity": 0}
                )
                stock.quantity += qty_to_receive
                stock.save()
                
                # Create movement record
                from apps.inventory.models import StockMovement
                StockMovement.objects.create(
                    tenant=po.tenant,
                    variant=variant,
                    location=location,
                    movement_type="in",
                    quantity_change=qty_to_receive,
                    quantity_before=stock.quantity - qty_to_receive,
                    quantity_after=stock.quantity,
                    reference_type="purchase_order",
                    notes=f"Received from PO {po.po_number}"
                )

        if all_received:
            po.status = "complete"
        else:
            po.status = "partially_received"
        po.save()

        return Response(PurchaseOrderSerializer(po).data)

    @action(detail=False, methods=["get"], url_path="public/(?P<token>[^/.]+)", permission_classes=[permissions.AllowAny])
    def public_get(self, request, token=None):
        try:
            po = PurchaseOrder.objects.get(token=token)
            return Response(PurchaseOrderSerializer(po).data)
        except PurchaseOrder.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["patch"], url_path="public/(?P<token>[^/.]+)/confirm", permission_classes=[permissions.AllowAny])
    def public_confirm(self, request, token=None):
        try:
            po = PurchaseOrder.objects.get(token=token)
            po.status = "confirmed"
            po.save()
            return Response(PurchaseOrderSerializer(po).data)
        except PurchaseOrder.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
