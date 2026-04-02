"""Demand forecasting logic."""

from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from apps.products.models import Product
from apps.orders.models import OrderItem, PurchaseOrderLine
from .models import ForecastResult


def calculate_product_forecast(product):
    """Calculate 90-day demand forecast for a single product."""
    ninety_days_ago = timezone.now() - timedelta(days=90)
    
    # Calculate sum of sales for this product variant in the last 90 days
    total_sales = OrderItem.objects.filter(
        product=product,
        order__placed_at__gte=ninety_days_ago,
        order__status__in=["confirmed", "processing", "shipped", "delivered"]
    ).aggregate(total=Sum("quantity"))["total"] or 0
    
    daily_avg_sales = total_sales / 90.0
    current_stock = product.total_stock
    
    # Prevent division by zero
    if daily_avg_sales > 0:
        days_of_stock_left = current_stock / daily_avg_sales
    else:
        days_of_stock_left = None  # No sales data yet
        
    # Get typical lead days (from a related supplier if available, or default to 7)
    # Since we don't have a direct product-supplier link yet, we'll try to find
    # the last PO line for this product or default to 7.
    lead_days = 7
    last_po_line = PurchaseOrderLine.objects.filter(product=product).order_by("-purchase_order__created_at").first()
    if last_po_line and last_po_line.purchase_order.supplier:
        lead_days = last_po_line.purchase_order.supplier.lead_days

    # Safety stock logic: (Daily Sales * Lead Days * 2) - Current Stock
    suggested_qty = int((daily_avg_sales * lead_days * 2) - current_stock)
    reorder_suggestion_qty = max(0, suggested_qty)

    # Update or create forecast result
    ForecastResult.objects.update_or_create(
        tenant=product.tenant,
        product=product,
        defaults={
            "daily_avg_sales": daily_avg_sales,
            "days_of_stock_left": days_of_stock_left,
            "reorder_suggestion_qty": reorder_suggestion_qty,
        }
    )


def recalculate_all_forecasts():
    """Recalculate demand forecasts for all products across all tenants."""
    for product in Product.objects.filter(is_active=True):
        calculate_product_forecast(product)
