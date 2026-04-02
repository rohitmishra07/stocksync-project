"""Alert views."""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsTenantMember

from .models import Alert
from .serializers import AlertSerializer


class AlertListView(generics.ListAPIView):
    """List alerts for the tenant."""

    serializer_class = AlertSerializer
    permission_classes = [IsTenantMember]

    def get_queryset(self):
        qs = Alert.objects.filter(
            tenant=self.request.tenant,
            is_dismissed=False,
        )
        alert_type = self.request.query_params.get("type")
        if alert_type:
            qs = qs.filter(alert_type=alert_type)

        severity = self.request.query_params.get("severity")
        if severity:
            qs = qs.filter(severity=severity)

        unread_only = self.request.query_params.get("unread")
        if unread_only == "true":
            qs = qs.filter(is_read=False)

        return qs


class AlertMarkReadView(APIView):
    """Mark an alert as read."""

    permission_classes = [IsTenantMember]

    def put(self, request, pk):
        try:
            alert = Alert.objects.get(id=pk, tenant=request.tenant)
        except Alert.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        alert.is_read = True
        alert.save(update_fields=["is_read", "updated_at"])
        return Response(AlertSerializer(alert).data)


class AlertDismissAllView(APIView):
    """Dismiss all alerts."""

    permission_classes = [IsTenantMember]

    def put(self, request):
        count = Alert.objects.filter(
            tenant=request.tenant,
            is_dismissed=False,
        ).update(is_dismissed=True)
        return Response({"dismissed": count})


class AlertCountView(APIView):
    """Get count of unread alerts."""

    permission_classes = [IsTenantMember]

    def get(self, request):
        count = Alert.objects.filter(
            tenant=request.user.tenant,
            is_read=False,
            is_dismissed=False,
        ).count()
        return Response({"unread_count": count})


class AlertSettingsView(APIView):
    """Manage alert routing settings (email vs whatsapp)."""
    from apps.billing.permissions import PlanFeaturePermission
    permission_classes = [IsTenantMember, PlanFeaturePermission]
    required_feature = "has_whatsapp_alerts"

    def put(self, request):
        return Response({"status": "Settings updated", "whatsapp_enabled": True})
