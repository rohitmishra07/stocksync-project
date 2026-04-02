"""Inventory URL routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "inventory"

router = DefaultRouter()
router.register(r"locations", views.LocationViewSet, basename="location")

urlpatterns = [
    path("stock/", views.StockLevelListView.as_view(), name="stock-list"),
    path("adjust/", views.StockAdjustView.as_view(), name="stock-adjust"),
    path("transfer/", views.StockTransferView.as_view(), name="stock-transfer"),
    path("movements/", views.StockMovementListView.as_view(), name="movement-list"),
    path("low-stock/", views.LowStockListView.as_view(), name="low-stock"),
    path("valuation/", views.InventoryValuationView.as_view(), name="valuation"),
    path("", include(router.urls)),
]
