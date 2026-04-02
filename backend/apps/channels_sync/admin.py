from django.contrib import admin
from .models import ShopifyStore, ChannelProductMapping

@admin.register(ShopifyStore)
class ShopifyStoreAdmin(admin.ModelAdmin):
    list_display = ('shop_domain', 'tenant', 'is_active', 'installed_at')
    list_filter = ('is_active', 'tenant')
    search_fields = ('shop_domain',)

@admin.register(ChannelProductMapping)
class ChannelProductMappingAdmin(admin.ModelAdmin):
    list_display = ('product', 'channel', 'external_id', 'last_synced')
    list_filter = ('channel',)
    search_fields = ('product__sku', 'external_id')
