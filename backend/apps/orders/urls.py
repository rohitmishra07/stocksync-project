"""Order URL routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "orders"

router = DefaultRouter()
router.register(r"suppliers", views.SupplierViewSet, basename="supplier")
router.register(r"purchase-orders", views.PurchaseOrderViewSet, basename="purchase-order")
router.register(r"", views.OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),
]
