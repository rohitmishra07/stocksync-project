"""Inventory views."""

from django.db.models import Sum, F, DecimalField, Value
from django.db.models.functions import Coalesce
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.mixins import TenantQuerySetMixin
from apps.products.models import ProductVariant

from .models import Location, StockLevel, StockMovement
from .serializers import (
    LocationSerializer,
    StockAdjustmentSerializer,
    StockLevelSerializer,
    StockMovementSerializer,
    StockTransferSerializer,
)
from .services import adjust_stock, transfer_stock, InsufficientStockError


class LocationViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    search_fields = ["name"]


class StockLevelListView(generics.ListAPIView):
    """List stock levels across all locations."""

    serializer_class = StockLevelSerializer
    filterset_fields = ["location", "variant"]

    def get_queryset(self):
        return (
            StockLevel.objects.filter(variant__tenant=self.request.user.tenant)
            .select_related("variant", "variant__product", "location")
        )


class StockAdjustView(APIView):
    """Manual stock adjustment."""

    def post(self, request):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            variant = ProductVariant.objects.get(
                id=serializer.validated_data["variant_id"],
                tenant=request.user.tenant,
            )
            location = Location.objects.get(
                id=serializer.validated_data["location_id"],
                tenant=request.user.tenant,
            )
        except (ProductVariant.DoesNotExist, Location.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        try:
            stock = adjust_stock(
                variant=variant,
                location=location,
                quantity_change=serializer.validated_data["quantity_change"],
                user=request.user,
                notes=serializer.validated_data.get("notes", ""),
            )
        except InsufficientStockError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(StockLevelSerializer(stock).data)


class StockTransferView(APIView):
    """Transfer stock between locations."""

    def post(self, request):
        serializer = StockTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            variant = ProductVariant.objects.get(
                id=serializer.validated_data["variant_id"],
                tenant=request.user.tenant,
            )
            from_loc = Location.objects.get(
                id=serializer.validated_data["from_location_id"],
                tenant=request.user.tenant,
            )
            to_loc = Location.objects.get(
                id=serializer.validated_data["to_location_id"],
                tenant=request.user.tenant,
            )
        except (ProductVariant.DoesNotExist, Location.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        try:
            transfer_stock(
                variant=variant,
                from_location=from_loc,
                to_location=to_loc,
                quantity=serializer.validated_data["quantity"],
                user=request.user,
                notes=serializer.validated_data.get("notes", ""),
            )
        except InsufficientStockError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Transfer completed successfully."})


class StockMovementListView(generics.ListAPIView):
    """Audit trail of all stock movements."""

    serializer_class = StockMovementSerializer
    filterset_fields = ["movement_type", "reference_type", "variant", "location"]

    def get_queryset(self):
        return (
            StockMovement.objects.filter(tenant=self.request.user.tenant)
            .select_related("variant", "variant__product", "location", "created_by")
        )


class LowStockListView(generics.ListAPIView):
    """Products below their low stock threshold."""

    serializer_class = StockLevelSerializer

    def get_queryset(self):
        return (
            StockLevel.objects.filter(
                variant__tenant=self.request.user.tenant,
                quantity__lt=F("variant__product__low_stock_threshold"),
            )
            .select_related("variant", "variant__product", "location")
        )


class InventoryValuationView(APIView):
    """Total inventory value by location."""

    def get(self, request):
        locations = Location.objects.filter(tenant=request.user.tenant, is_active=True)
        data = []

        for loc in locations:
            stocks = StockLevel.objects.filter(location=loc, quantity__gt=0).select_related(
                "variant", "variant__product"
            )
            total_items = 0
            total_cost = 0
            total_retail = 0

            for s in stocks:
                total_items += s.quantity
                cost = s.variant.effective_cost_price or 0
                retail = s.variant.effective_selling_price or 0
                total_cost += s.quantity * cost
                total_retail += s.quantity * retail

            data.append({
                "location_id": str(loc.id),
                "location_name": loc.name,
                "total_items": total_items,
                "total_cost_value": round(total_cost, 2),
                "total_retail_value": round(total_retail, 2),
            })

        return Response(data)
