"""Tests for inventory operations."""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.inventory.models import Location, StockLevel, StockMovement
from apps.inventory.services import adjust_stock, transfer_stock
from apps.products.models import Product, ProductVariant


@pytest.fixture
def location(tenant):
    return Location.objects.create(
        tenant=tenant,
        name="Main Warehouse",
        is_default=True,
    )


@pytest.fixture
def location_b(tenant):
    return Location.objects.create(
        tenant=tenant,
        name="Store Front",
    )


@pytest.fixture
def variant(tenant):
    product = Product.objects.create(
        tenant=tenant,
        name="Test Product",
        slug="test-product",
        sku="TP-001",
        cost_price=10.00,
        selling_price=25.00,
        low_stock_threshold=5,
    )
    return ProductVariant.objects.create(
        tenant=tenant,
        product=product,
        sku="TP-001",
        name="Default",
        cost_price=10.00,
        selling_price=25.00,
    )


@pytest.mark.django_db
class TestStockAdjustment:
    def test_add_stock(self, variant, location, owner):
        stock = adjust_stock(variant, location, 50, user=owner, notes="Initial stock")
        assert stock.quantity == 50
        assert StockMovement.objects.count() == 1

    def test_remove_stock(self, variant, location, owner):
        adjust_stock(variant, location, 50, user=owner)
        stock = adjust_stock(variant, location, -10, user=owner, notes="Sold")
        assert stock.quantity == 40

    def test_insufficient_stock_raises(self, variant, location, owner):
        adjust_stock(variant, location, 5, user=owner)
        from apps.inventory.services import InsufficientStockError
        with pytest.raises(InsufficientStockError):
            adjust_stock(variant, location, -10, user=owner)

    def test_movement_audit_trail(self, variant, location, owner):
        adjust_stock(variant, location, 100, user=owner)
        adjust_stock(variant, location, -30, user=owner)
        movements = StockMovement.objects.filter(variant=variant)
        assert movements.count() == 2
        latest = movements.first()
        assert latest.quantity_before == 100
        assert latest.quantity_after == 70


@pytest.mark.django_db
class TestStockTransfer:
    def test_transfer_success(self, variant, location, location_b, owner):
        adjust_stock(variant, location, 50, user=owner)
        from_stock, to_stock = transfer_stock(
            variant, location, location_b, 20, user=owner
        )
        assert from_stock.quantity == 30
        assert to_stock.quantity == 20
        assert StockMovement.objects.count() == 3  # 1 initial + 2 transfer

    def test_transfer_insufficient(self, variant, location, location_b, owner):
        adjust_stock(variant, location, 5, user=owner)
        from apps.inventory.services import InsufficientStockError
        with pytest.raises(InsufficientStockError):
            transfer_stock(variant, location, location_b, 10, user=owner)


@pytest.mark.django_db
class TestInventoryAPI:
    def test_adjust_stock_api(self, auth_client, variant, location):
        url = reverse("inventory:stock-adjust")
        data = {
            "variant_id": str(variant.id),
            "location_id": str(location.id),
            "quantity_change": 100,
            "notes": "Received shipment",
        }
        response = auth_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK

    def test_low_stock_endpoint(self, auth_client, variant, location, owner):
        adjust_stock(variant, location, 3, user=owner)  # Below threshold of 5
        url = reverse("inventory:low-stock")
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1
