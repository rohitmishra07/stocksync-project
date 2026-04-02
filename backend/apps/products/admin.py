from django.contrib import admin
from .models import Category, Product, ProductVariant, Bundle, BundleComponent


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "parent", "sort_order"]
    list_filter = ["tenant"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "sku", "tenant", "selling_price", "is_active", "created_at"]
    list_filter = ["tenant", "is_active", "category"]
    search_fields = ["name", "sku", "barcode"]
    inlines = [ProductVariantInline]


class BundleComponentInline(admin.TabularInline):
    model = BundleComponent
    extra = 0


@admin.register(Bundle)
class BundleAdmin(admin.ModelAdmin):
    list_display = ["name", "sku", "tenant", "price", "is_active"]
    list_filter = ["tenant", "is_active"]
    search_fields = ["name", "sku"]
    inlines = [BundleComponentInline]
