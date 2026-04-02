import logging
import httpx
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

class AmazonSPAPIClient:
    """
    A service client for interacting with the Amazon Selling Partner API.
    Handles LWA authentication and core SP-API endpoints.
    """
    
    BASE_URLS = {
        "NA": "https://sellingpartnerapi-na.amazon.com",
        "EU": "https://sellingpartnerapi-eu.amazon.com",
        "FE": "https://sellingpartnerapi-fe.amazon.com",
    }

    def __init__(self, refresh_token, region="NA"):
        self.refresh_token = refresh_token
        self.base_url = self.BASE_URLS.get(region, self.BASE_URLS["NA"])
        self.access_token = None
        self.token_expiry = None

    def _get_access_token(self):
        """Exchanges refresh_token for a temporary access_token via LWA."""
        if self.access_token and self.token_expiry > timezone.now():
            return self.access_token

        url = "https://api.amazon.com/auth/o2/token"
        data = {
            "grant_type": "refresh_token",
            "refresh_token": self.refresh_token,
            "client_id": getattr(settings, "AMAZON_CLIENT_ID", "MOCK_ID"),
            "client_secret": getattr(settings, "AMAZON_CLIENT_SECRET", "MOCK_SECRET"),
        }

        # For the Demo mode, we skip the real request
        if data["client_id"] == "MOCK_ID":
            self.access_token = "mock_access_token"
            self.token_expiry = timezone.now() + timezone.timedelta(hours=1)
            return self.access_token

        try:
            with httpx.Client() as client:
                response = client.post(url, data=data)
                response.raise_for_status()
                payload = response.json()
                self.access_token = payload["access_token"]
                self.token_expiry = timezone.now() + timezone.timedelta(seconds=payload["expires_in"] - 60)
                return self.access_token
        except Exception as e:
            logger.error(f"Failed to refresh Amazon LWA token: {str(e)}")
            return None

    def _get_headers(self):
        token = self._get_access_token()
        return {
            "x-amz-access-token": token,
            "Content-Type": "application/json",
        }

    def get_inventory(self, marketplace_id):
        """Fetches inventory summaries from SP-API."""
        # For Demo, return mock data
        if getattr(settings, "AMAZON_CLIENT_ID", "MOCK_ID") == "MOCK_ID":
            return [
                {"sku": "AZ-PRO-100", "asin": "B08N5K7S8L", "quantity": 42, "name": "Amazon Echo Dot (Mock)"},
                {"sku": "AZ-WH-200", "asin": "B09G96TFFY", "quantity": 15, "name": "Kindle Paperwhite (Mock)"},
                {"sku": "8906092350134", "asin": "B01N1SEH29", "quantity": 120, "name": "Patanjali Honey 500g (Sync)"}
            ]

        endpoint = f"{self.base_url}/fba/inventory/v1/summaries"
        params = {"details": "true", "marketplaceIds": marketplace_id}
        
        try:
            with httpx.Client() as client:
                response = client.get(endpoint, headers=self._get_headers(), params=params)
                response.raise_for_status()
                return response.json().get("payload", {}).get("inventorySummaries", [])
        except Exception as e:
            logger.error(f"Failed to fetch Amazon inventory: {str(e)}")
            return []

    def get_orders(self, marketplace_id, created_after=None):
        """Fetches recent orders from SP-API."""
        if getattr(settings, "AMAZON_CLIENT_ID", "MOCK_ID") == "MOCK_ID":
            return [
                {"order_id": "111-1234567-1234567", "amount": 29.99, "status": "Shipped", "sku": "AZ-PRO-100"},
                {"order_id": "111-7654321-7654321", "amount": 139.00, "status": "Pending", "sku": "AZ-WH-200"}
            ]

        endpoint = f"{self.base_url}/orders/v0/orders"
        params = {
            "MarketplaceIds": marketplace_id,
            "CreatedAfter": created_after or (timezone.now() - timezone.timedelta(days=1)).isoformat(),
        }
        
        try:
            with httpx.Client() as client:
                response = client.get(endpoint, headers=self._get_headers(), params=params)
                response.raise_for_status()
                return response.json().get("payload", {}).get("Orders", [])
        except Exception as e:
            logger.error(f"Failed to fetch Amazon orders: {str(e)}")
            return []
