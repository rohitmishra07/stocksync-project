from rest_framework import generics, permissions
from rest_framework.response import Response
from apps.common.mixins import TenantQuerySetMixin
import decimal
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Count, Avg
from django.db.models.functions import TruncDay
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order, OrderItem
from apps.inventory.models import StockLevel
from apps.billing.permissions import PlanFeaturePermission
from .models import ForecastResult
from .serializers import ForecastResultSerializer


class ForecastResultListView(TenantQuerySetMixin, generics.ListAPIView):
    """List all demand forecasting results for the tenant."""
    permission_classes = [permissions.IsAuthenticated, PlanFeaturePermission]
    required_feature = 'has_forecasting'

    serializer_class = ForecastResultSerializer
    queryset = ForecastResult.objects.all()
    filterset_fields = ["product"]
    search_fields = ["product__name", "product__sku"]
    ordering = ["days_of_stock_left"]
    ordering_fields = ["days_of_stock_left", "reorder_suggestion_qty", "daily_avg_sales"]


class DashboardAnalyticsView(generics.GenericAPIView):
    """Aggregated KPIs for the main dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        now = timezone.now()
        
        # 1. Total Orders KPI (Lifetime)
        total_orders = Order.objects.filter(tenant=tenant).count()
        
        # 2. Revenue KPI (Last 30 Days vs Previous 30 Days)
        last_30_days_start = now - timedelta(days=30)
        curr_revenue = Order.objects.filter(
            tenant=tenant,
            status__in=["confirmed", "processing", "shipped", "delivered"],
            created_at__gte=last_30_days_start
        ).aggregate(total=Sum("grand_total"))["total"] or 0
        
        prev_30_days_start = last_30_days_start - timedelta(days=30)
        prev_revenue = Order.objects.filter(
            tenant=tenant,
            status__in=["confirmed", "processing", "shipped", "delivered"],
            created_at__gte=prev_30_days_start,
            created_at__lt=last_30_days_start
        ).aggregate(total=Sum("grand_total"))["total"] or 0
        
        if prev_revenue > 0:
            change_percent = round(((float(curr_revenue) - float(prev_revenue)) / float(prev_revenue)) * 100, 1)
        else:
            change_percent = 0.0
            
        # 3. Inventory Risks
        low_stock_count = StockLevel.objects.filter(
            variant__product__tenant=tenant,
            quantity__lte=10
        ).values('variant__product').distinct().count()
        
        data = {
            "orders": {"total": total_orders},
            "revenue": {
                "total": float(curr_revenue),
                "currency": tenant.currency if hasattr(tenant, 'currency') else "USD",
                "change_percent": change_percent
            },
            "inventory": {"low_stock_items": low_stock_count}
        }
        return Response(data)


class SalesAnalyticsView(generics.GenericAPIView):
    """Time-series data for sales and revenue charts."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        days_str = request.query_params.get("days", "30")
        try:
            days = int(days_str)
        except ValueError:
            days = 30
            
        start_date = timezone.now() - timedelta(days=days)
        
        sales_trend = Order.objects.filter(
            tenant=tenant,
            created_at__gte=start_date,
            status__in=["confirmed", "processing", "shipped", "delivered"]
        ).annotate(
            date=TruncDay("created_at")
        ).values("date").annotate(
            revenue=Sum("grand_total"),
            orders_count=Count("id")
        ).order_by("date")
        
        results = []
        for s in sales_trend:
            results.append({
                "date": s["date"].strftime("%Y-%m-%d"),
                "revenue": float(s["revenue"] or 0),
                "orders": s["orders_count"]
            })
            
        return Response({"data": results})


class TopProductsAnalyticsView(generics.GenericAPIView):
    """Ranking of products by total revenue generation."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        limit_str = request.query_params.get("limit", "5")
        try:
            limit = int(limit_str)
        except ValueError:
            limit = 5
        
        # Explicit ExpressionWrapper to handle Decimal multiplication in Sum
        top_products_qs = OrderItem.objects.filter(
            order__tenant=tenant,
            order__status__in=["confirmed", "processing", "shipped", "delivered"]
        ).values(
            product_name=F("name")
        ).annotate(
            total_revenue=Sum(
                ExpressionWrapper(F("quantity") * F("unit_price"), output_field=DecimalField())
            )
        ).order_by("-total_revenue")[:limit]
        
        # Convert Decimals to float for JSON compatibility
        results = []
        for p in top_products_qs:
            results.append({
                "name": p["product_name"],
                "total_revenue": float(p["total_revenue"] or 0)
            })
        
        return Response({"products": results})


class MarginAnalyticsView(TenantQuerySetMixin, generics.GenericAPIView):
    """Analytics for profit margins across different channels."""
    
    def get(self, request):
        margins_qs = OrderItem.objects.filter(
            order__tenant=request.user.tenant,
            order__status__in=["confirmed", "processing", "shipped", "delivered"]
        ).values(
            channel=F("order__channel")
        ).annotate(
            total_revenue=Sum(ExpressionWrapper(F("quantity") * F("unit_price"), output_field=DecimalField())),
            total_cost=Sum(ExpressionWrapper(F("quantity") * F("variant__product__cost_price"), output_field=DecimalField())),
        ).annotate(
            profit=ExpressionWrapper(
                F("total_revenue") - F("total_cost"),
                output_field=DecimalField()
            )
        )
        
        results = []
        for m in margins_qs:
            rev = float(m["total_revenue"] or 0)
            cost = float(m["total_cost"] or 0)
            profit = float(m["profit"] or 0)
            margin_pct = (profit / rev * 100) if rev > 0 else 0
            results.append({
                "channel": m["channel"],
                "total_revenue": rev,
                "total_cost": cost,
                "profit": profit,
                "margin_pct": margin_pct
            })
        
        return Response(results)


class GSTReportView(TenantQuerySetMixin, generics.GenericAPIView):
    """India GST-ready tax reporting."""
    permission_classes = [permissions.IsAuthenticated, PlanFeaturePermission]
    required_feature = 'has_gst_reports'

    def get(self, request):
        tenant = request.user.tenant
        order_items = OrderItem.objects.filter(
            order__tenant=tenant,
            order__status__in=["confirmed", "processing", "shipped", "delivered"]
        ).select_related("order", "product")

        gst_data = []
        for item in order_items:
            # Determine if Intra-state or Inter-state
            shipping_address = item.order.shipping_address or {}
            dest_state = shipping_address.get("state_code", "").upper()
            origin_state = (tenant.state_code or "").upper()
            
            if not item.product:
                continue
            
            tax_type = "IGST" if dest_state != origin_state else "CGST/SGST"
            tax_rate = item.product.gst_rate or 0
            tax_amount = (item.total * tax_rate) / 100

            gst_data.append({
                "order_number": item.order.order_number,
                "hsn_code": item.product.hsn_code,
                "tax_rate": float(tax_rate),
                "taxable_value": float(item.total),
                "tax_amount": float(tax_amount),
                "tax_type": tax_type,
                "cgst": float(tax_amount / 2 if tax_type == "CGST/SGST" else 0),
                "sgst": float(tax_amount / 2 if tax_type == "CGST/SGST" else 0),
                "igst": float(tax_amount if tax_type == "IGST" else 0),
            })

        return Response(gst_data)


class AnomaliesView(TenantQuerySetMixin, generics.GenericAPIView):
    """Detect dynamic anomalies across inventory and orders."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        anomalies = []

        # 1. Pricing Error
        from apps.products.models import Product
        pricing_errors = Product.objects.filter(
            tenant=tenant,
            is_active=True,
            cost_price__gt=F('selling_price')
        )
        for p in pricing_errors:
            anomalies.append({
                "type": "Pricing Error",
                "severity": "critical",
                "description": f"Product '{p.name}' is selling at a loss (Cost: ${p.cost_price}, Price: ${p.selling_price})",
                "reference": p.sku
            })

        # 2. High Discount Orders
        high_discounts = Order.objects.filter(
            tenant=tenant,
            status__in=["pending", "confirmed", "processing"],
            discount_total__gt=0.5 * F("subtotal")
        ).exclude(subtotal=0)
        
        for o in high_discounts:
            anomalies.append({
                "type": "High Discount",
                "severity": "warning",
                "description": f"Order {o.order_number} has >50% discount (Subtotal: ${o.subtotal}, Discount: ${o.discount_total})",
                "reference": o.order_number
            })

        # 3. Overstock based on Forecast
        forecasts = ForecastResult.objects.filter(product__tenant=tenant)
        for f in forecasts:
            product = f.product
            # Overstock if stock > 5 * daily sales (minimum threshold of 1 for daily_avg_sales)
            if f.daily_avg_sales > 0 and product.total_stock > (5 * f.daily_avg_sales):
                anomalies.append({
                    "type": "Overstock Risk",
                    "severity": "info",
                    "description": f"Excess inventory for '{product.name}'. Stock: {product.total_stock}, Daily Sales: {f.daily_avg_sales:.1f}",
                    "reference": product.sku
                })

        return Response(anomalies)
