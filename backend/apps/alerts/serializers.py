from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = [
            "id", "alert_type", "severity", "title", "message",
            "related_object_type", "related_object_id",
            "is_read", "is_dismissed", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
