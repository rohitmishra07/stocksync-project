from django.urls import path
from .views import (
    shopify_install, shopify_callback, shopify_webhook, 
    amazon_connect, amazon_status, ChannelSyncStatusView
)

urlpatterns = [
    path('status/', ChannelSyncStatusView.as_view(), name='channel-status'),
    path('shopify/install/', shopify_install, name='shopify-install'),
    path('shopify/callback/', shopify_callback, name='shopify-callback'),
    path('shopify/webhook/<str:event>/', shopify_webhook, name='shopify-webhook'),
    path('amazon/connect/', amazon_connect, name='amazon-connect'),
    path('amazon/status/', amazon_status, name='amazon-status'),
]
