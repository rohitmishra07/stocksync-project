from django.contrib import admin
from .models import Alert


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ["title", "tenant", "alert_type", "severity", "is_read", "created_at"]
    list_filter = ["alert_type", "severity", "is_read", "tenant"]
