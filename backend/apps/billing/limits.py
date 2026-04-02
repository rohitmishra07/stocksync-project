def check_sku_limit(tenant):
    """Returns (allowed: bool, current: int, limit: int)"""
    from apps.products.models import Product
    sub = getattr(tenant, 'subscription', None)
    if not sub or not sub.plan:
        return True, 0, 0
    limit = sub.plan.max_skus
    if limit == -1:
        return True, 0, -1
    current = Product.objects.filter(tenant=tenant).count()
    return current < limit, current, limit

def check_channel_limit(tenant):
    """Returns (allowed: bool, current: int, limit: int)"""
    from apps.channels_sync.models import ShopifyStore
    sub = getattr(tenant, 'subscription', None)
    if not sub or not sub.plan:
        return True, 0, 0
    limit = sub.plan.max_channels
    if limit == -1:
        return True, 0, -1
    current = ShopifyStore.objects.filter(
        tenant=tenant, is_active=True
    ).count()
    return current < limit, current, limit
