"""Account URL routes."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = "accounts"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    path("tenant/settings/", views.TenantSettingsView.as_view(), name="tenant-settings"),
    path("team/", views.TeamListView.as_view(), name="team-list"),
    path("team/invite/", views.InviteUserView.as_view(), name="team-invite"),
]
