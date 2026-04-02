from django.contrib import admin
from .models import Order, OrderItem, Supplier, PurchaseOrder, PurchaseOrderLine

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "lead_days", "tenant"]
    list_filter = ["tenant"]
    search_fields = ["name", "email"]


class PurchaseOrderLineInline(admin.TabularInline):
    model = PurchaseOrderLine
    extra = 0


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ["po_number", "supplier", "tenant", "status", "expected_delivery"]
    list_filter = ["status", "tenant", "supplier"]
    search_fields = ["po_number", "notes"]
    inlines = [PurchaseOrderLineInline]
