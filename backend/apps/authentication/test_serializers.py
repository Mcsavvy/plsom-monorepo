from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.test import APIRequestFactory
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

from apps.authentication.serializers import (
    CustomTokenObtainPairSerializer,
    CustomTokenRefreshSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


class CustomTokenObtainPairSerializerTestCase(TestCase):
    """Test cases for CustomTokenObtainPairSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User",
            role="student",
        )

    def test_validate_success(self):
        """Test successful token validation and data."""
        serializer = CustomTokenObtainPairSerializer()
        attrs = {"email": "test@example.com", "password": "testpassword123"}

        validated_data = serializer.validate(attrs)

        self.assertIn("access", validated_data)
        self.assertIn("refresh", validated_data)
        self.assertIn("role", validated_data)
        self.assertIn("access_expires_at", validated_data)
        self.assertIn("refresh_expires_at", validated_data)
        self.assertEqual(validated_data["role"], "student")

    def test_validate_email_normalization(self):
        """Test that email is normalized during validation."""
        serializer = CustomTokenObtainPairSerializer()
        attrs = {"email": "TEST@EXAMPLE.COM", "password": "testpassword123"}

        validated_data = serializer.validate(attrs)

        self.assertIn("access", validated_data)
        self.assertEqual(validated_data["role"], "student")

    def test_validate_role_inclusion(self):
        """Test that user role is included in response."""
        # Test with different roles
        roles = ["admin", "lecturer", "student"]

        for role in roles:
            User.objects.create_user(
                email=f"{role}@example.com",
                password="testpassword123",
                role=role,
            )

            serializer = CustomTokenObtainPairSerializer()
            attrs = {
                "email": f"{role}@example.com",
                "password": "testpassword123",
            }

            validated_data = serializer.validate(attrs)
            self.assertEqual(validated_data["role"], role)


class CustomTokenRefreshSerializerTestCase(TestCase):
    """Test cases for CustomTokenRefreshSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpassword123"
        )
        self.refresh_token = RefreshToken.for_user(self.user)

    def test_validate_success(self):
        """Test successful token refresh validation."""
        serializer = CustomTokenRefreshSerializer()
        attrs = {"refresh": str(self.refresh_token)}

        validated_data = serializer.validate(attrs)

        self.assertIn("access", validated_data)
        self.assertIn("access_expires_at", validated_data)
        self.assertIn("refresh_expires_at", validated_data)


class ForgotPasswordSerializerTestCase(TestCase):
    """Test cases for ForgotPasswordSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User",
        )

    def test_validate_email_success(self):
        """Test successful email validation."""
        serializer = ForgotPasswordSerializer()
        email = serializer.validate_email("test@example.com")

        self.assertEqual(email, "test@example.com")

    def test_validate_email_normalization(self):
        """Test email normalization during validation."""
        serializer = ForgotPasswordSerializer()
        email = serializer.validate_email("TEST@EXAMPLE.COM")

        self.assertEqual(email, "test@example.com")

    def test_validate_email_nonexistent_user(self):
        """Test validation with non-existent email."""
        serializer = ForgotPasswordSerializer()

        with self.assertRaises(serializers.ValidationError) as context:
            serializer.validate_email("nonexistent@example.com")

        self.assertIn(
            "No user found with this email address", str(context.exception)
        )

    def test_validate_email_inactive_user(self):
        """Test validation with inactive user."""
        self.user.is_active = False
        self.user.save()

        serializer = ForgotPasswordSerializer()

        with self.assertRaises(serializers.ValidationError) as context:
            serializer.validate_email("test@example.com")

        self.assertIn("User account is not active", str(context.exception))

    @patch("apps.authentication.serializers.async_task")
    def test_save_method(self, mock_async_task):
        """Test save method triggers email task."""
        data = {"email": "test@example.com"}
        serializer = ForgotPasswordSerializer(data=data)

        self.assertTrue(serializer.is_valid())
        user = serializer.save()

        self.assertEqual(user, self.user)
        mock_async_task.assert_called_once()

        # Verify the task was called with correct parameters
        call_args = mock_async_task.call_args[0]
        self.assertEqual(
            call_args[0], "apps.authentication.tasks.send_password_reset_email"
        )
        self.assertEqual(call_args[1], self.user.id)

    def test_serializer_data_validation(self):
        """Test serializer data validation."""
        # Valid data
        data = {"email": "test@example.com"}
        serializer = ForgotPasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        # Invalid email format
        data = {"email": "invalid-email"}
        serializer = ForgotPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())

        # Missing email
        data = {}
        serializer = ForgotPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class ResetPasswordSerializerTestCase(TestCase):
    """Test cases for ResetPasswordSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpassword123"
        )
        self.token = default_token_generator.make_token(self.user)
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))

    def test_validate_success(self):
        """Test successful validation."""
        data = {
            "uid": self.uid,
            "token": self.token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ResetPasswordSerializer(data=data)

        self.assertTrue(serializer.is_valid())
        validated_data = serializer.validated_data
        self.assertEqual(validated_data["user"], self.user)

    def test_validate_password_mismatch(self):
        """Test validation with mismatched passwords."""
        data = {
            "uid": self.uid,
            "token": self.token,
            "new_password": "newpassword123",
            "confirm_password": "differentpassword123",
        }
        serializer = ResetPasswordSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("Passwords do not match", str(serializer.errors))

    def test_validate_invalid_uid(self):
        """Test validation with invalid UID."""
        data = {
            "uid": "invalid-uid",
            "token": self.token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ResetPasswordSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("Invalid reset link", str(serializer.errors))

    def test_validate_invalid_token(self):
        """Test validation with invalid token."""
        data = {
            "uid": self.uid,
            "token": "invalid-token",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ResetPasswordSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("Invalid or expired reset link", str(serializer.errors))

    def test_validate_nonexistent_user(self):
        """Test validation with UID for non-existent user."""
        fake_uid = urlsafe_base64_encode(force_bytes(99999))
        data = {
            "uid": fake_uid,
            "token": self.token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ResetPasswordSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("Invalid reset link", str(serializer.errors))

    def test_save_method(self):
        """Test save method updates user password."""
        data = {
            "uid": self.uid,
            "token": self.token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ResetPasswordSerializer(data=data)

        self.assertTrue(serializer.is_valid())
        user = serializer.save()

        self.assertEqual(user, self.user)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_short_password_validation(self):
        """Test validation with short password."""
        data = {
            "uid": self.uid,
            "token": self.token,
            "new_password": "123",
            "confirm_password": "123",
        }
        serializer = ResetPasswordSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("new_password", serializer.errors)


class ChangePasswordSerializerTestCase(TestCase):
    """Test cases for ChangePasswordSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpassword123"
        )
        self.factory = APIRequestFactory()

    def test_validate_success(self):
        """Test successful validation."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "current_password": "testpassword123",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertTrue(serializer.is_valid())

    def test_validate_password_mismatch(self):
        """Test validation with mismatched new passwords."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "current_password": "testpassword123",
            "new_password": "newpassword123",
            "confirm_password": "differentpassword123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("New passwords do not match", str(serializer.errors))

    def test_validate_same_password(self):
        """Test validation when new password is same as current."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "current_password": "testpassword123",
            "new_password": "testpassword123",
            "confirm_password": "testpassword123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "New password must be different from current password",
            str(serializer.errors),
        )

    def test_validate_wrong_current_password(self):
        """Test validation with wrong current password."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("Current password is incorrect", str(serializer.errors))

    def test_save_method(self):
        """Test save method updates user password."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "current_password": "testpassword123",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertTrue(serializer.is_valid())
        user = serializer.save()

        self.assertEqual(user, self.user)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_short_password_validation(self):
        """Test validation with short new password."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "current_password": "testpassword123",
            "new_password": "123",
            "confirm_password": "123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("new_password", serializer.errors)

    def test_missing_fields_validation(self):
        """Test validation with missing fields."""
        request = self.factory.post("/")
        request.user = self.user

        # Missing current_password
        data = {
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("current_password", serializer.errors)

        # Missing new_password
        data = {
            "current_password": "testpassword123",
            "confirm_password": "newpassword123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("new_password", serializer.errors)

        # Missing confirm_password
        data = {
            "current_password": "testpassword123",
            "new_password": "newpassword123",
        }
        serializer = ChangePasswordSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("confirm_password", serializer.errors)
