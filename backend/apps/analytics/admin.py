from django.contrib import admin
from .models import ForecastResult

@admin.register(ForecastResult)
class ForecastResultAdmin(admin.ModelAdmin):
    list_display = ["product", "tenant", "daily_avg_sales", "days_of_stock_left", "calculated_at"]
    list_filter = ["tenant"]
    search_fields = ["product__name", "product__sku"]
    readonly_fields = ["calculated_at"]
