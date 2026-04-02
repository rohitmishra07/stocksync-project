"""Account views — registration, login, user management."""

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.throttling import ScopedRateThrottle

from apps.common.permissions import IsTenantAdmin

from .serializers import (
    CustomTokenObtainPairSerializer,
    InviteUserSerializer,
    RegisterSerializer,
    TenantSettingsSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new tenant + owner."""

    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """JWT login — returns access + refresh tokens + user data."""

    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile."""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class TenantSettingsView(generics.RetrieveUpdateAPIView):
    """View/update tenant settings (admin only)."""

    serializer_class = TenantSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get_object(self):
        return self.request.user.tenant


class InviteUserView(generics.CreateAPIView):
    """Invite a new team member (admin only)."""

    serializer_class = InviteUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]


class TeamListView(generics.ListAPIView):
    """List all team members in the tenant."""

    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(tenant=self.request.user.tenant, is_active=True)
