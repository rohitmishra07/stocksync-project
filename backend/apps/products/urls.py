"""Product URL routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "products"

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"bundles", views.BundleViewSet, basename="bundle")
router.register(r"", views.ProductViewSet, basename="product")

urlpatterns = [
    path(
        "<uuid:product_pk>/variants/",
        views.ProductVariantViewSet.as_view({"get": "list", "post": "create"}),
        name="variant-list",
    ),
    path(
        "<uuid:product_pk>/variants/<uuid:pk>/",
        views.ProductVariantViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}),
        name="variant-detail",
    ),
    path("", include(router.urls)),
]
