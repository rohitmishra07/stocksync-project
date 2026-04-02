"""Global test fixtures."""

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Tenant, User


@pytest.fixture
def tenant(db):
    return Tenant.objects.create(
        name="Test Store",
        slug="test-store",
        plan="pro",
        settings={"currency": "USD", "timezone": "UTC"},
    )


@pytest.fixture
def owner(tenant):
    user = User.objects.create_user(
        email="owner@test.com",
        password="testpass123",
        first_name="Test",
        last_name="Owner",
        tenant=tenant,
        role="owner",
    )
    return user


@pytest.fixture
def staff_user(tenant):
    return User.objects.create_user(
        email="staff@test.com",
        password="testpass123",
        tenant=tenant,
        role="staff",
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client, owner):
    api_client.force_authenticate(user=owner)
    # Set tenant on every request
    api_client.handler._force_user = owner
    return api_client
