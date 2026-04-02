from django.contrib import admin
from .models import Location, StockLevel, StockMovement


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "is_default", "is_active"]
    list_filter = ["tenant", "is_active"]


@admin.register(StockLevel)
class StockLevelAdmin(admin.ModelAdmin):
    list_display = ["variant", "location", "quantity", "reserved_quantity"]
    list_filter = ["location"]


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ["variant", "location", "movement_type", "quantity_change", "created_at"]
    list_filter = ["movement_type", "reference_type"]
    readonly_fields = ["created_at"]
