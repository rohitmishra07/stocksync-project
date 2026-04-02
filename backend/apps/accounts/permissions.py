"""Custom permission classes."""

from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Only tenant owners."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "owner"


class IsAdminOrOwner(BasePermission):
    """Tenant owners or admins."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("owner", "admin")


class IsManagerOrAbove(BasePermission):
    """Tenant owners, admins, or managers."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            "owner", "admin", "manager",
        )


class IsSameTenant(BasePermission):
    """Ensure the user can only access objects in their own tenant."""

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "tenant"):
            return obj.tenant_id == request.user.tenant_id
        if hasattr(obj, "tenant_id"):
            return obj.tenant_id == request.user.tenant_id
        return True
