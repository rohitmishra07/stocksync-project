"""Tests for product endpoints."""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.products.models import Category, Product, ProductVariant


@pytest.fixture
def category(tenant):
    return Category.objects.create(
        tenant=tenant,
        name="Electronics",
        slug="electronics",
    )


@pytest.fixture
def product(tenant, category):
    p = Product.objects.create(
        tenant=tenant,
        name="Wireless Mouse",
        slug="wireless-mouse",
        sku="WM-001",
        barcode="1234567890123",
        category=category,
        cost_price=10.00,
        selling_price=29.99,
    )
    ProductVariant.objects.create(
        product=p,
        sku="WM-001",
        name="Default",
        cost_price=10.00,
        selling_price=29.99,
    )
    return p


@pytest.mark.django_db
class TestProductCRUD:
    list_url = reverse("products:product-list")

    def test_list_products(self, auth_client, product):
        response = auth_client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_create_product(self, auth_client, category):
        data = {
            "name": "Keyboard",
            "slug": "keyboard",
            "sku": "KB-001",
            "category": str(category.id),
            "cost_price": "15.00",
            "selling_price": "49.99",
        }
        response = auth_client.post(self.list_url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Product.objects.filter(sku="KB-001").exists()
        # Should auto-create a default variant
        assert ProductVariant.objects.filter(sku="KB-001").exists()

    def test_create_product_duplicate_sku(self, auth_client, product, category):
        data = {
            "name": "Another Mouse",
            "slug": "another-mouse",
            "sku": "WM-001",  # Duplicate
            "cost_price": "10.00",
            "selling_price": "29.99",
        }
        response = auth_client.post(self.list_url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_product_detail(self, auth_client, product):
        url = reverse("products:product-detail", args=[product.id])
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["sku"] == "WM-001"
        assert len(response.data["variants"]) == 1

    def test_update_product(self, auth_client, product):
        url = reverse("products:product-detail", args=[product.id])
        response = auth_client.patch(url, {"name": "Updated Mouse"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        product.refresh_from_db()
        assert product.name == "Updated Mouse"

    def test_delete_product_soft_deletes(self, auth_client, product):
        url = reverse("products:product-detail", args=[product.id])
        response = auth_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        # Should still exist as soft-deleted
        assert Product.all_objects.filter(id=product.id, is_deleted=True).exists()
        # But not in default queryset
        assert not Product.objects.filter(id=product.id).exists()

    def test_barcode_lookup(self, auth_client, product):
        url = reverse("products:product-barcode", args=["1234567890123"])
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["sku"] == "WM-001"

    def test_search_products(self, auth_client, product):
        response = auth_client.get(self.list_url, {"search": "mouse"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_filter_by_category(self, auth_client, product, category):
        response = auth_client.get(self.list_url, {"category": str(category.id)})
        assert response.data["count"] == 1
