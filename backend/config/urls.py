"""StockSync URL Configuration."""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from apps.common.health import HealthCheckView
from apps.common.admin_views import AdminMetricsView

urlpatterns = [
    path("admin/stocksync-metrics/", AdminMetricsView.as_view(), name="admin_metrics"),
    path("admin/", admin.site.urls),
    # Health check
    path("api/v1/health/", HealthCheckView.as_view(), name="health_check"),
    # API v1
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/products/", include("apps.products.urls")),
    path("api/v1/inventory/", include("apps.inventory.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/alerts/", include("apps.alerts.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/channels/", include("apps.channels_sync.urls")),
    path("api/v1/billing/", include("apps.billing.urls")),
    path("stripe/", include("djstripe.urls", namespace="djstripe")),
    # API Schema & Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
