"""Shared permission classes."""

from rest_framework.permissions import BasePermission


class IsTenantMember(BasePermission):
    """Ensure user belongs to the tenant owning the object."""

    def has_object_permission(self, request, view, obj):
        if not hasattr(obj, "tenant"):
            return True
        return obj.tenant == request.user.tenant


class IsTenantAdmin(BasePermission):
    """Only tenant owners and admins."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("owner", "admin")
        )


class IsTenantOwner(BasePermission):
    """Only the tenant owner."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and request.user.role == "owner"
        )
