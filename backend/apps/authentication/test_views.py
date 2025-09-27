from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

User = get_user_model()


class AuthenticationViewsTestCase(APITestCase):
    """Test cases for authentication views."""

    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User",
            "role": "student",
        }
        self.user = User.objects.create_user(**self.user_data)

    def test_token_obtain_pair_success(self):
        """Test successful login and token generation."""
        login_data = {
            "email": self.user_data["email"],
            "password": self.user_data["password"],
        }
        response = self.client.post("/api/auth/login/", login_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("role", response.data)
        self.assertIn("access_expires_at", response.data)
        self.assertIn("refresh_expires_at", response.data)
        self.assertEqual(response.data["role"], "student")

    def test_token_obtain_pair_invalid_credentials(self):
        """Test login with invalid credentials."""
        login_data = {
            "email": self.user_data["email"],
            "password": "wrongpassword",
        }
        response = self.client.post("/api/auth/login/", login_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_obtain_pair_inactive_user(self):
        """Test login with inactive user account."""
        self.user.is_active = False
        self.user.save()

        login_data = {
            "email": self.user_data["email"],
            "password": self.user_data["password"],
        }
        response = self.client.post("/api/auth/login/", login_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_obtain_pair_email_normalization(self):
        """Test that email is normalized during login."""
        login_data = {
            "email": "TEST@EXAMPLE.COM",  # Uppercase email
            "password": self.user_data["password"],
        }
        response = self.client.post("/api/auth/login/", login_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_refresh_success(self):
        """Test successful token refresh."""
        refresh = RefreshToken.for_user(self.user)
        refresh_data = {"refresh": str(refresh)}

        response = self.client.post("/api/auth/refresh/", refresh_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("access_expires_at", response.data)
        self.assertIn("refresh_expires_at", response.data)

    def test_token_refresh_invalid_token(self):
        """Test token refresh with invalid token."""
        refresh_data = {"refresh": "invalid-token"}

        response = self.client.post("/api/auth/refresh/", refresh_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_verify_success(self):
        """Test successful token verification."""
        refresh = RefreshToken.for_user(self.user)
        access_token = refresh.access_token
        verify_data = {"token": str(access_token)}

        response = self.client.post("/api/auth/verify/", verify_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_verify_invalid_token(self):
        """Test token verification with invalid token."""
        verify_data = {"token": "invalid-token"}

        response = self.client.post("/api/auth/verify/", verify_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_blacklist_success(self):
        """Test successful token blacklisting (logout)."""
        refresh = RefreshToken.for_user(self.user)
        blacklist_data = {"refresh": str(refresh)}

        response = self.client.post("/api/auth/logout/", blacklist_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("apps.authentication.serializers.async_task")
    def test_forgot_password_success(self, mock_async_task):
        """Test successful password reset request."""
        forgot_data = {"email": self.user.email}

        response = self.client.post("/api/auth/forgot-password/", forgot_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_async_task.assert_called_once()

    @patch("apps.authentication.serializers.async_task")
    def test_forgot_password_email_normalization(self, mock_async_task):
        """Test that email is normalized in password reset."""
        forgot_data = {"email": "TEST@EXAMPLE.COM"}

        response = self.client.post("/api/auth/forgot-password/", forgot_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_async_task.assert_called_once()

    def test_forgot_password_nonexistent_user(self):
        """Test password reset with non-existent email."""
        forgot_data = {"email": "nonexistent@example.com"}

        response = self.client.post("/api/auth/forgot-password/", forgot_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forgot_password_inactive_user(self):
        """Test password reset with inactive user."""
        self.user.is_active = False
        self.user.save()

        forgot_data = {"email": self.user.email}

        response = self.client.post("/api/auth/forgot-password/", forgot_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_success(self):
        """Test successful password reset."""
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        reset_data = {
            "uid": uid,
            "token": token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post("/api/auth/reset-password/", reset_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_reset_password_mismatched_passwords(self):
        """Test password reset with mismatched passwords."""
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        reset_data = {
            "uid": uid,
            "token": token,
            "new_password": "newpassword123",
            "confirm_password": "differentpassword123",
        }

        response = self.client.post("/api/auth/reset-password/", reset_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_invalid_token(self):
        """Test password reset with invalid token."""
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        reset_data = {
            "uid": uid,
            "token": "invalid-token",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post("/api/auth/reset-password/", reset_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_invalid_uid(self):
        """Test password reset with invalid UID."""
        token = default_token_generator.make_token(self.user)

        reset_data = {
            "uid": "invalid-uid",
            "token": token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post("/api/auth/reset-password/", reset_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_success(self):
        """Test successful password change for authenticated user."""
        self.client.force_authenticate(user=self.user)

        change_data = {
            "current_password": self.user_data["password"],
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post("/api/auth/change-password/", change_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_change_password_wrong_current_password(self):
        """Test password change with wrong current password."""
        self.client.force_authenticate(user=self.user)

        change_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post("/api/auth/change-password/", change_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_mismatched_new_passwords(self):
        """Test password change with mismatched new passwords."""
        self.client.force_authenticate(user=self.user)

        change_data = {
            "current_password": self.user_data["password"],
            "new_password": "newpassword123",
            "confirm_password": "differentpassword123",
        }

        response = self.client.post("/api/auth/change-password/", change_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_same_as_current(self):
        """Test password change with new password same as current."""
        self.client.force_authenticate(user=self.user)

        change_data = {
            "current_password": self.user_data["password"],
            "new_password": self.user_data["password"],
            "confirm_password": self.user_data["password"],
        }

        response = self.client.post("/api/auth/change-password/", change_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_unauthenticated(self):
        """Test password change without authentication."""
        change_data = {
            "current_password": self.user_data["password"],
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post("/api/auth/change-password/", change_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
