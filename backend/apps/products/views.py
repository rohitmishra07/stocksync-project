"""Product views."""

import csv
from django.http import HttpResponse
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.common.mixins import TenantQuerySetMixin
from apps.billing.limits import check_sku_limit
from apps.billing.permissions import PlanFeaturePermission

from .filters import ProductFilter
from .importers import import_products_from_csv
from .models import Category, Product, ProductVariant
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductImportSerializer,
    ProductListSerializer,
    ProductVariantSerializer,
)


class CategoryViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    """CRUD for product categories."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ["name"]

    def get_queryset(self):
        return super().get_queryset().filter(parent=None)


class ProductViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    """CRUD for products with import/export."""

    queryset = Product.objects.select_related("category").prefetch_related("variants")
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "barcode", "brand", "description"]
    ordering_fields = ["name", "sku", "selling_price", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer

    def perform_destroy(self, instance):
        instance.soft_delete()

    def create(self, request, *args, **kwargs):
        allowed, current, limit = check_sku_limit(request.user.tenant)
        if not allowed:
            return Response({
                "error": "SKU limit reached",
                "limit": limit,
                "upgrade_url": "/billing/upgrade"
            }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["post"], serializer_class=ProductImportSerializer)
    def import_csv(self, request):
        """Bulk import products from CSV."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        created, errors = import_products_from_csv(
            request.FILES["file"],
            request.user.tenant,
        )

        return Response({
            "created": created,
            "errors": errors,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        """Export all products as CSV."""
        products = self.get_queryset().filter(is_active=True)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="products.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "name", "sku", "barcode", "brand", "category",
            "cost_price", "selling_price", "low_stock_threshold",
        ])

        for product in products:
            writer.writerow([
                product.name,
                product.sku,
                product.barcode,
                product.brand,
                product.category.name if product.category else "",
                product.cost_price,
                product.selling_price,
                product.low_stock_threshold,
            ])

        return response

    @action(detail=False, methods=["get"], url_path="barcode/(?P<code>[^/.]+)")
    def barcode_lookup(self, request, code=None):
        """Look up a product or variant by barcode, checking local then external sources."""
        # 1. Try local variant first
        variant = ProductVariant.objects.filter(
            tenant=request.user.tenant, barcode=code, is_active=True
        ).select_related("product").first()

        if variant:
            return Response({
                "found_locally": True,
                "product": ProductListSerializer(variant.product).data,
                "variant": ProductVariantSerializer(variant).data,
            })

        # 2. Try local product
        product = Product.objects.filter(
            tenant=request.user.tenant, barcode=code, is_active=True
        ).first()

        if product:
            return Response({
                "found_locally": True,
                "product": ProductListSerializer(product).data,
                "variant": None,
            })

        # 3. External API Lookup (Open Food Facts as default carrier goods source)
        import httpx
        external_data = None
        try:
            with httpx.Client(timeout=5.0) as client:
                # Try the global world instance first
                r = client.get(f"https://world.openfoodfacts.org/api/v0/product/{code}.json")
                if r.status_code == 200:
                    data = r.json()
                    
                    # Special check for status:0 (not found) for Indian barcodes (890 prefix)
                    # We try the dedicated 'in' instance for Patanjali/Dabur/etc.
                    if data.get("status") == 0 and code.startswith("890"):
                        r_in = client.get(f"https://in.openfoodfacts.org/api/v0/product/{code}.json")
                        if r_in.status_code == 200:
                            data = r_in.json()

                    if data.get("status") == 1:
                        product_data = data.get("product", {})
                        external_data = {
                            "name": product_data.get("product_name") or product_data.get("product_name_en") or "New Product",
                            "brand": product_data.get("brands") or product_data.get("brand_owner") or "",
                            "category_name": product_data.get("categories") or "General",
                            "image_url": product_data.get("image_url") or "",
                            "barcode": code,
                        }
        except Exception as e:
            print(f"External lookup error: {e}")
            pass

        return Response({
            "found_locally": False,
            "product": None,
            "variant": None,
            "external_data": external_data,
        })

    @action(detail=False, methods=["post"])
    def barcode_sheet(self, request):
        """Generate a PDF sheet of barcodes for selected products."""
        from .services import generate_barcode_pdf
        product_ids = request.data.get("product_ids", [])
        label_size = request.data.get("label_size", "38x21")
        
        pdf_buffer = generate_barcode_pdf(product_ids, label_size)
        
        response = HttpResponse(pdf_buffer, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="barcodes.pdf"'
        return response


class BundleViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    """CRUD for product bundles."""
    permission_classes = [permissions.IsAuthenticated, PlanFeaturePermission]
    required_feature = 'has_bundles'
    
    from .models import Bundle
    from .serializers import BundleSerializer
    
    queryset = Bundle.objects.prefetch_related("components", "components__product")
    serializer_class = BundleSerializer
    search_fields = ["name", "sku"]

    @action(detail=True, methods=["get"])
    def stock(self, request, pk=None):
        """Get the current available stock for this bundle."""
        bundle = self.get_object()
        return Response({"available_stock": bundle.available_stock})


class ProductVariantViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    """CRUD for product variants."""

    queryset = ProductVariant.objects.select_related("product")
    serializer_class = ProductVariantSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.kwargs.get("product_pk")
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            product_id=self.kwargs["product_pk"],
        )
