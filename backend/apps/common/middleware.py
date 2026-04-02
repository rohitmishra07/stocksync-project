"""Tenant middleware — attaches tenant to request from JWT user."""

from django.utils.deprecation import MiddlewareMixin


class TenantMiddleware(MiddlewareMixin):
    """Attach tenant to request for all authenticated users."""

    def process_request(self, request):
        if hasattr(request, "user") and request.user.is_authenticated:
            request.tenant = request.user.tenant
        else:
            request.tenant = None
