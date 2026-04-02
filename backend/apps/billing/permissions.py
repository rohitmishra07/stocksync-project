from rest_framework.permissions import BasePermission

class PlanFeaturePermission(BasePermission):
    """
    Usage: permission_classes = [IsAuthenticated, PlanFeaturePermission]
    Set required_feature = 'has_forecasting' on the view class.
    """
    def has_permission(self, request, view):
        required_feature = getattr(view, 'required_feature', None)
        if not required_feature:
            return True
        subscription = getattr(request.user.tenant, 'subscription', None)
        if not subscription or not subscription.is_active:
            return False
        return getattr(subscription.plan, required_feature, False)
