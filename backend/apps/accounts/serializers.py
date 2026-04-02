"""Account serializers."""

from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Tenant

User = get_user_model()


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "name", "slug", "plan", "settings", "is_active", "created_at"]
        read_only_fields = ["id", "slug", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "role", "tenant", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class RegisterSerializer(serializers.Serializer):
    """Register a new tenant + owner account."""

    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    company_name = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_company_name(self, value):
        slug = slugify(value)
        if Tenant.objects.filter(slug=slug).exists():
            raise serializers.ValidationError("A company with this name already exists.")
        return value

    def create(self, validated_data):
        tenant = Tenant.objects.create(
            name=validated_data["company_name"],
            slug=slugify(validated_data["company_name"]),
            settings={"currency": "USD", "timezone": "UTC"},
        )
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            tenant=tenant,
            role="owner",
        )
        return user


class InviteUserSerializer(serializers.Serializer):
    """Invite a team member."""

    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    role = serializers.ChoiceField(choices=["admin", "manager", "staff"])
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        tenant = self.context["request"].user.tenant
        return User.objects.create_user(
            tenant=tenant,
            **validated_data,
        )


class TenantSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["name", "settings"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add user info to JWT response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
