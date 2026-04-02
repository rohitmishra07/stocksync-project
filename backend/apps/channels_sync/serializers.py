from rest_framework import serializers
from .models import ShopifyStore, AmazonStore, ChannelProductMapping

class ShopifyStoreSerializer(serializers.ModelSerializer):
    """Serializer for ShopifyStore."""
    last_sync_status = serializers.SerializerMethodField()

    class Meta:
        model = ShopifyStore
        fields = ['id', 'shop_domain', 'is_active', 'installed_at', 'last_sync_status']
        read_only_fields = ['installed_at']

    def get_last_sync_status(self, obj):
        return "Synced"


class AmazonStoreSerializer(serializers.ModelSerializer):
    """Serializer for AmazonStore."""
    class Meta:
        model = AmazonStore
        fields = ['id', 'marketplace_id', 'seller_id', 'is_active', 'last_sync_at']
        read_only_fields = ['last_sync_at']


class ChannelProductMappingSerializer(serializers.ModelSerializer):
    """Serializer for ChannelProductMapping."""
    product_name = serializers.CharField(source='product.name')
    sku = serializers.CharField(source='product.sku')

    class Meta:
        model = ChannelProductMapping
        fields = ['id', 'product', 'product_name', 'sku', 'channel', 'external_id', 'last_synced']
