from django.urls import path
from . import views

app_name = "alerts"

urlpatterns = [
    path("", views.AlertListView.as_view(), name="alert-list"),
    path("count/", views.AlertCountView.as_view(), name="alert-count"),
    path("<uuid:pk>/read/", views.AlertMarkReadView.as_view(), name="alert-read"),
    path("dismiss-all/", views.AlertDismissAllView.as_view(), name="alert-dismiss-all"),
    path("settings/", views.AlertSettingsView.as_view(), name="alert-settings"),
]
