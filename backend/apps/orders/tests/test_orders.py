"""Tests for order operations."""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.inventory.models import Location
from apps.inventory.services import adjust_stock
from apps.orders.models import Order, OrderItem
from apps.orders.services import cancel_order, fulfill_order
from apps.products.models import Product, ProductVariant


@pytest.fixture
def location(tenant):
    return Location.objects.create(tenant=tenant, name="Warehouse", is_default=True)


@pytest.fixture
def variant(tenant):
    product = Product.objects.create(
        tenant=tenant, name="Widget", slug="widget", sku="WDG-001",
        cost_price=5.00, selling_price=15.00,
    )
    return ProductVariant.objects.create(
        product=product, sku="WDG-001", name="Default",
        cost_price=5.00, selling_price=15.00,
    )


@pytest.fixture
def order_with_items(tenant, variant):
    order = Order.objects.create(
        tenant=tenant,
        customer_name="Jane Doe",
        customer_email="jane@example.com",
    )
    OrderItem.objects.create(
        order=order,
        variant=variant,
        sku=variant.sku,
        name="Widget",
        quantity=3,
        unit_price=15.00,
    )
    order.recalculate_totals()
    return order


@pytest.mark.django_db
class TestOrderCRUD:
    list_url = reverse("orders:order-list")

    def test_create_order(self, auth_client, variant):
        data = {
            "customer_name": "John Doe",
            "customer_email": "john@example.com",
            "items": [
                {
                    "variant": str(variant.id),
                    "sku": variant.sku,
                    "name": "Widget",
                    "quantity": 2,
                    "unit_price": "15.00",
                }
            ],
        }
        response = auth_client.post(self.list_url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Order.objects.count() == 1
        order = Order.objects.first()
        assert order.grand_total == 30.00

    def test_list_orders(self, auth_client, order_with_items):
        response = auth_client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1


@pytest.mark.django_db
class TestOrderFulfillment:
    def test_fulfill_deducts_stock(self, variant, location, order_with_items, owner):
        adjust_stock(variant, location, 50, user=owner)
        order = fulfill_order(order_with_items, location, user=owner)
        assert order.status == "shipped"
        variant.refresh_from_db()
        assert variant.available_stock == 47  # 50 - 3

    def test_cancel_restores_stock(self, variant, location, order_with_items, owner):
        adjust_stock(variant, location, 50, user=owner)
        order = fulfill_order(order_with_items, location, user=owner)
        cancel_order(order, user=owner)
        assert order.status == "cancelled"
        variant.refresh_from_db()
        assert variant.available_stock == 50  # Restored
