"""Tests for authentication endpoints."""

import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestRegister:
    url = reverse("accounts:register")

    def test_register_success(self, api_client):
        data = {
            "company_name": "My Awesome Store",
            "email": "new@example.com",
            "password": "strongpass123",
            "first_name": "John",
            "last_name": "Doe",
        }
        response = api_client.post(self.url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert response.data["user"]["email"] == "new@example.com"
        assert response.data["user"]["role"] == "owner"

    def test_register_duplicate_email(self, api_client, owner):
        data = {
            "company_name": "Another Store",
            "email": "owner@test.com",
            "password": "strongpass123",
        }
        response = api_client.post(self.url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_short_password(self, api_client):
        data = {
            "company_name": "Short Pass Store",
            "email": "short@example.com",
            "password": "123",
        }
        response = api_client.post(self.url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    url = reverse("accounts:login")

    def test_login_success(self, api_client, owner):
        data = {"email": "owner@test.com", "password": "testpass123"}
        response = api_client.post(self.url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_wrong_password(self, api_client, owner):
        data = {"email": "owner@test.com", "password": "wrongpass"}
        response = api_client.post(self.url, data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestMe:
    url = reverse("accounts:me")

    def test_me_authenticated(self, auth_client, owner):
        response = auth_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == owner.email

    def test_me_unauthenticated(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
