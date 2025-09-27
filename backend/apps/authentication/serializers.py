from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.utils import timezone
from django.conf import settings
from django_q.tasks import async_task
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Define fields explicitly for schema documentation
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)
    access_expires_at = serializers.DateTimeField(read_only=True)
    refresh_expires_at = serializers.DateTimeField(read_only=True)

    def validate(self, attrs):
        # Normalize email before validation
        if "email" in attrs:
            attrs["email"] = User.objects.normalize_email(attrs["email"])

        print(attrs)

        data = super().validate(attrs)
        user = self.user
        data["role"] = user.role

        # Calculate token expiry times
        now = timezone.now()
        access_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME")
        refresh_lifetime = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME")

        data["access_expires_at"] = now + access_lifetime
        data["refresh_expires_at"] = now + refresh_lifetime

        return data


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField()
    access_expires_at = serializers.DateTimeField(read_only=True)
    refresh_expires_at = serializers.DateTimeField(read_only=True)

    def validate(self, attrs):
        data = super().validate(attrs)

        # Calculate token expiry times
        now = timezone.now()
        access_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME")
        refresh_lifetime = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME")

        data["access_expires_at"] = now + access_lifetime
        data["refresh_expires_at"] = now + refresh_lifetime

        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Normalize email before validation
        normalized_email = User.objects.normalize_email(value)

        try:
            user = User.objects.get(email=normalized_email)
            if not user.is_active:
                raise serializers.ValidationError("User account is not active.")
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No user found with this email address."
            )
        return normalized_email

    def save(self):
        email = self.validated_data["email"]
        user = User.objects.get(email=email)

        # Generate password reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Queue the email sending task
        async_task(
            "apps.authentication.tasks.send_password_reset_email",
            user.id,
            uid,
            token,
        )

        return user


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        uid = attrs.get("uid")
        token = attrs.get("token")
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if new_password != confirm_password:
            raise serializers.ValidationError("Passwords do not match.")

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid reset link.")

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError("Invalid or expired reset link.")

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        new_password = self.validated_data["new_password"]

        user.set_password(new_password)
        user.save()

        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        current_password = attrs.get("current_password")
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if new_password != confirm_password:
            raise serializers.ValidationError("New passwords do not match.")

        if current_password == new_password:
            raise serializers.ValidationError(
                "New password must be different from current password."
            )

        return attrs

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self):
        user = self.context["request"].user
        new_password = self.validated_data["new_password"]

        user.set_password(new_password)
        user.save()

        return user
