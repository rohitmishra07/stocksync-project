import hmac
import hashlib
import json
import httpx
from django.conf import settings
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, JsonResponse
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.decorators import api_view, permission_classes, throttle_classes

from apps.billing.limits import check_channel_limit
from .models import ShopifyStore, AmazonStore, ChannelProductMapping
from .serializers import AmazonStoreSerializer, ChannelProductMappingSerializer
from .tasks import initial_shopify_sync, process_shopify_webhook, initial_amazon_sync

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shopify_install(request):
    """
    Redirects user to Shopify consent screen.
    Expects 'shop' query parameter (e.g. mystore.myshopify.com).
    """
    shop = request.GET.get('shop')
    if not shop:
        return Response({"error": "Missing 'shop' parameter"}, status=400)

    # Clean shop domain
    shop = shop.replace("http://", "").replace("https://", "").split("/")[0]
    
    api_key = settings.SHOPIFY_API_KEY
    redirect_uri = f"{settings.BASE_URL}/api/v1/channels/shopify/callback/"
    scopes = "read_inventory,write_inventory,read_orders,write_orders,read_products,write_products,read_locations"
    
    install_url = f"https://{shop}/admin/oauth/authorize?client_id={api_key}&scope={scopes}&redirect_uri={redirect_uri}"
    
    return redirect(install_url)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shopify_callback(request):
    """
    Handles Shopify OAuth callback.
    Exchanges 'code' for a permanent access token.
    """
    shop = request.GET.get('shop')
    code = request.GET.get('code')
    
    if not shop or not code:
        return Response({"error": "Missing parameters"}, status=400)

    # Check limits BEFORE provisioning token
    allowed, current, limit = check_channel_limit(request.user.tenant)
    if not allowed:
        return Response({
            "error": "Channel limit reached",
            "limit": limit,
            "upgrade_url": "/billing/upgrade"
        }, status=status.HTTP_402_PAYMENT_REQUIRED)

    # Exchange code for access token
    url = f"https://{shop}/admin/oauth/access_token"
    data = {
        "client_id": settings.SHOPIFY_API_KEY,
        "client_secret": settings.SHOPIFY_API_SECRET,
        "code": code
    }

    try:
        with httpx.Client() as client:
            response = client.post(url, json=data)
            response.raise_for_status()
            access_token = response.json().get('access_token')
    except Exception as e:
        return Response({"error": f"Failed to get access token: {str(e)}"}, status=500)

    # Save store record linked to current tenant
    store, created = ShopifyStore.objects.update_or_create(
        shop_domain=shop,
        defaults={
            'tenant': request.user.tenant,
            'access_token': access_token,
            'webhook_secret': settings.SHOPIFY_WEBHOOK_SECRET,
            'is_active': True
        }
    )

    # Register webhooks (implementation provided below)
    _register_shopify_webhooks(shop, access_token)

    # Trigger initial sync
    initial_shopify_sync.delay(store.id)

    return redirect(f"{settings.FRONTEND_URL}/settings/channels?connected=shopify")


def _register_shopify_webhooks(shop, access_token):
    """Registers required webhooks with Shopify."""
    api_version = "2025-04"
    url = f"https://{shop}/admin/api/{api_version}/webhooks.json"
    headers = {"X-Shopify-Access-Token": access_token}
    
    events = ['inventory_levels/update', 'orders/create', 'orders/fulfilled', 'products/update']
    
    with httpx.Client() as client:
        for event in events:
            # Clean event name for URL (inventory_levels/update -> inventory_levels_update)
            event_slug = event.replace("/", "_")
            webhook_data = {
                "webhook": {
                    "topic": event,
                    "address": f"{settings.BASE_URL}/api/v1/channels/shopify/webhook/{event_slug}/",
                    "format": "json"
                }
            }
            try:
                client.post(url, json=webhook_data, headers=headers)
            except Exception:
                # Log failures but don't block
                pass


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([ScopedRateThrottle])
def shopify_webhook(request, event):
    """
    Endpoint for Shopify webhook delivery.
    Verifies HMAC and dispatches to Celery.
    """
    # Set the scope for rate limiting
    request._view_throttle_scope = 'webhook'
    hmac_header = request.headers.get('X-Shopify-Hmac-Sha256')
    shop_domain = request.headers.get('X-Shopify-Shop-Domain')
    data = request.body

    if not hmac_header:
        return HttpResponse(status=401)

    # Verify HMAC
    digest = hmac.new(
        settings.SHOPIFY_API_SECRET.encode('utf-8'),
        data,
        hashlib.sha256
    ).digest()
    computed_hmac = hashlib.sha256(digest).hexdigest()
    
    # Simple direct comparison (standard for Shopify)
    # Note: Using base64 encoding if Shopify sends it that way, but usually it's hex or base64
    import base64
    computed_hmac_b64 = base64.b64encode(digest).decode('utf-8')
    
    if hmac_header != computed_hmac_b64:
        return HttpResponse(status=401)

    try:
        payload = json.loads(data)
    except json.JSONDecodeError:
        return HttpResponse(status=400)

    # Dispatch to background task
    process_shopify_webhook.delay(event, shop_domain, payload)

    return HttpResponse(status=status.HTTP_200_OK)


from rest_framework.generics import ListAPIView
from .serializers import ChannelProductMappingSerializer

class ChannelSyncStatusView(ListAPIView):
    """
    Returns all product channel mappings for the current tenant.
    """
    serializer_class = ChannelProductMappingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtering by tenant (ChannelProductMapping -> Product -> Tenant)
        return ChannelProductMapping.objects.filter(
            product__tenant=self.request.user.tenant
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def amazon_connect(request):
    """
    Initiates Amazon connection. 
    For Demo mode: Directly creates a mock store.
    """
    # Check limits
    allowed, current, limit = check_channel_limit(request.user.tenant)
    if not allowed:
        return Response({
            "error": "Channel limit reached",
            "limit": limit,
            "upgrade_url": "/billing/upgrade"
        }, status=status.HTTP_402_PAYMENT_REQUIRED)

    # In production, this would redirect to Amazon OAuth
    # For now, we seed a demo store
    store, created = AmazonStore.objects.update_or_create(
        tenant=request.user.tenant,
        marketplace_id="ATVPDKIKX0DER", # US Marketplace
        defaults={
            "seller_id": "DEMO_SELLER_123",
            "refresh_token": "demo_refresh_token",
            "is_active": True
        }
    )

    # Trigger initial sync
    initial_amazon_sync.delay(store.id)

    return Response({
        "message": "Amazon store connected and syncing (Demo Mode)",
        "store": AmazonStoreSerializer(store).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def amazon_status(request):
    """Returns the status of the Amazon connection for the current tenant."""
    store = AmazonStore.objects.filter(tenant=request.user.tenant, is_active=True).first()
    if not store:
        return Response({"connected": False})
    
    return Response({
        "connected": True,
        "store": AmazonStoreSerializer(store).data
    })
