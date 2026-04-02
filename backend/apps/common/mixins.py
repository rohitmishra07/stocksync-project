"""Shared view mixins."""

from rest_framework.exceptions import PermissionDenied


class TenantQuerySetMixin:
    """Filter querysets to current tenant automatically."""

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, "tenant", None)
        if not tenant and self.request.user.is_authenticated:
            tenant = self.request.user.tenant
            
        if not tenant:
            raise PermissionDenied("Authentication required.")
        return qs.filter(tenant=tenant)

    def perform_create(self, serializer):
        tenant = getattr(self.request, "tenant", None)
        if not tenant and self.request.user.is_authenticated:
            tenant = self.request.user.tenant
        serializer.save(tenant=tenant)
