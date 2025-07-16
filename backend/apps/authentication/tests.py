import json
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.cohorts.models import Cohort, Enrollment
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from unittest.mock import patch

User = get_user_model()


class AuthenticationTestCase(APITestCase):
    """Test suite for authentication flow"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create test users with different roles
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_active=True,
        )

        self.lecturer_user = User.objects.create_user(
            email="lecturer@test.com",
            password="testpass123",
            first_name="Lecturer",
            last_name="User",
            role="lecturer",
            program_type="certificate",
            is_active=True,
        )

        self.student_user = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            first_name="Student",
            last_name="User",
            role="student",
            program_type="diploma",
            is_active=True,
        )

        # Create cohort and enrollment for student
        self.cohort = Cohort.objects.create(
            name="Test Cohort 2024",
            program_type="diploma",
            is_active=True,
            start_date="2024-01-01",
        )

        self.enrollment = Enrollment.objects.create(
            student=self.student_user, cohort=self.cohort
        )

        # URLs
        self.token_obtain_url = reverse("token_obtain_pair")
        self.token_refresh_url = reverse("token_refresh")
        self.token_verify_url = reverse("token_verify")
        self.token_blacklist_url = reverse("token_blacklist")

    def test_token_obtain_valid_credentials(self):
        """Test obtaining tokens with valid credentials"""
        data = {"email": "admin@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["role"], "admin")
        self.assertIsNone(
            response.data["program_type"]
        )  # Admin doesn't have program_type
        self.assertIsNone(response.data["cohort"])  # Admin doesn't have cohort

    def test_token_obtain_invalid_credentials(self):
        """Test obtaining tokens with invalid credentials"""
        data = {"email": "admin@test.com", "password": "wrongpassword"}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)

    def test_token_obtain_nonexistent_user(self):
        """Test obtaining tokens with non-existent user"""
        data = {"email": "nonexistent@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_obtain_inactive_user(self):
        """Test obtaining tokens with inactive user"""
        User.objects.create_user(
            email="inactive@test.com",
            password="testpass123",
            role="student",
            is_active=False,
        )

        data = {"email": "inactive@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_obtain_student_with_cohort(self):
        """Test obtaining tokens for student with cohort enrollment"""
        data = {"email": "student@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "student")
        self.assertEqual(response.data["program_type"], "diploma")
        self.assertEqual(response.data["cohort"], self.cohort.id)

    def test_token_obtain_student_without_cohort(self):
        """Test obtaining tokens for student without cohort enrollment"""
        User.objects.create_user(
            email="student_no_cohort@test.com",
            password="testpass123",
            role="student",
            program_type="certificate",
            is_active=True,
        )

        data = {
            "email": "student_no_cohort@test.com",
            "password": "testpass123",
        }
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "student")
        self.assertEqual(response.data["program_type"], "certificate")
        self.assertIsNone(response.data["cohort"])

    def test_token_obtain_lecturer(self):
        """Test obtaining tokens for lecturer"""
        data = {"email": "lecturer@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "lecturer")
        self.assertEqual(response.data["program_type"], "certificate")
        self.assertIsNone(response.data["cohort"])

    def test_token_refresh_valid(self):
        """Test refreshing tokens with valid refresh token"""
        # First get tokens
        data = {"email": "admin@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)
        refresh_token = response.data["refresh"]

        # Now refresh
        refresh_data = {"refresh": refresh_token}
        response = self.client.post(self.token_refresh_url, refresh_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_token_refresh_invalid(self):
        """Test refreshing tokens with invalid refresh token"""
        refresh_data = {"refresh": "invalid_token"}
        response = self.client.post(self.token_refresh_url, refresh_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_verify_valid(self):
        """Test verifying valid access token"""
        # Get access token
        data = {"email": "admin@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)
        access_token = response.data["access"]

        # Verify token
        verify_data = {"token": access_token}
        response = self.client.post(self.token_verify_url, verify_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_verify_invalid(self):
        """Test verifying invalid access token"""
        verify_data = {"token": "invalid_token"}
        response = self.client.post(self.token_verify_url, verify_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_blacklist_valid(self):
        """Test blacklisting valid refresh token"""
        # Get tokens
        data = {"email": "admin@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)
        refresh_token = response.data["refresh"]

        # Blacklist token
        blacklist_data = {"refresh": refresh_token}
        response = self.client.post(self.token_blacklist_url, blacklist_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Try to use blacklisted token for refresh
        refresh_data = {"refresh": refresh_token}
        response = self.client.post(self.token_refresh_url, refresh_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_blacklist_invalid(self):
        """Test blacklisting invalid refresh token"""
        blacklist_data = {"refresh": "invalid_token"}
        response = self.client.post(self.token_blacklist_url, blacklist_data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_custom_token_claims(self):
        """Test that custom claims are properly included in JWT tokens"""
        from apps.authentication.serializers import (
            CustomTokenObtainPairSerializer,
        )

        # Test with student having enrollment
        token = CustomTokenObtainPairSerializer.get_token(self.student_user)
        self.assertEqual(token["role"], "student")
        self.assertEqual(token["program_type"], "diploma")
        self.assertEqual(token["cohort"], self.cohort.id)

        # Test with admin
        token_admin = CustomTokenObtainPairSerializer.get_token(self.admin_user)
        self.assertEqual(token_admin["role"], "admin")
        self.assertIsNone(token_admin["program_type"])
        self.assertIsNone(token_admin["cohort"])

    def test_student_multiple_enrollments(self):
        """Test student with multiple enrollments gets latest cohort"""
        # Create another cohort and enroll student
        new_cohort = Cohort.objects.create(
            name="Newer Cohort 2024",
            program_type="diploma",
            is_active=True,
            start_date="2024-06-01",
        )

        Enrollment.objects.create(student=self.student_user, cohort=new_cohort)

        # Get token
        data = {"email": "student@test.com", "password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)

        # Should get the latest enrollment (new_cohort)
        self.assertEqual(response.data["cohort"], new_cohort.id)

    def test_missing_email_field(self):
        """Test token obtain with missing email field"""
        data = {"password": "testpass123"}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password_field(self):
        """Test token obtain with missing password field"""
        data = {"email": "admin@test.com"}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_credentials(self):
        """Test token obtain with empty credentials"""
        data = {"email": "", "password": ""}
        response = self.client.post(self.token_obtain_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_expiry_behavior(self):
        """Test token behavior near expiry"""
        # This would require mocking time or using a very short-lived token
        # For now, we'll just verify the token contains the expected exp claim
        refresh = RefreshToken.for_user(self.admin_user)
        access = refresh.access_token

        # Check that exp claim exists
        self.assertIn("exp", access)
        self.assertIsInstance(access["exp"], int)

    def test_content_type_handling(self):
        """Test different content types for authentication requests"""
        # Test with JSON content type
        data = {"email": "admin@test.com", "password": "testpass123"}
        response = self.client.post(
            self.token_obtain_url,
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def tearDown(self):
        """Clean up after tests"""
        User.objects.all().delete()
        Cohort.objects.all().delete()
        Enrollment.objects.all().delete()


class AuthenticationIntegrationTestCase(APITestCase):
    """Integration tests for authentication with other app components"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@test.com",
            password="testpass123",
            role="student",
            program_type="certificate",
            is_active=True,
        )

    def test_authentication_with_protected_endpoint(self):
        """Test using JWT tokens to access protected endpoints"""
        # Get token
        data = {"email": "test@test.com", "password": "testpass123"}
        response = self.client.post(reverse("token_obtain_pair"), data)
        access_token = response.data["access"]

        # Test authenticated request (this would require a protected endpoint)
        # For now, we'll just verify the token is properly formatted
        self.assertTrue(
            access_token.startswith("eyJ")
        )  # JWT tokens start with eyJ

    def test_token_refresh_cycle(self):
        """Test complete token refresh cycle"""
        # Initial login
        data = {"email": "test@test.com", "password": "testpass123"}
        response = self.client.post(reverse("token_obtain_pair"), data)

        original_access = response.data["access"]
        refresh_token = response.data["refresh"]

        # Refresh token
        refresh_data = {"refresh": refresh_token}
        response = self.client.post(reverse("token_refresh"), refresh_data)

        new_access = response.data["access"]

        # Tokens should be different
        self.assertNotEqual(original_access, new_access)

        # Both should be valid JWT format
        self.assertTrue(original_access.startswith("eyJ"))
        self.assertTrue(new_access.startswith("eyJ"))

    @patch('apps.authentication.serializers.async_task')
    def test_forgot_password_success(self, mock_async_task):
        """Test successful forgot password request"""
        url = reverse('forgot_password')
        data = {'email': 'test@test.com'}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify the task was called with correct parameters
        mock_async_task.assert_called_once()

    def test_forgot_password_invalid_email(self):
        """Test forgot password with non-existent email"""
        url = reverse('forgot_password')
        data = {'email': 'nonexistent@example.com'}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_forgot_password_inactive_user(self):
        """Test forgot password with inactive user"""
        self.user.is_active = False
        self.user.save()
        
        url = reverse('forgot_password')
        data = {'email': 'test@test.com'}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_reset_password_success(self):
        """Test successful password reset"""
        # Generate reset token
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        url = reverse('reset_password')
        data = {
            'uid': uid,
            'token': token,
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))

    def test_reset_password_invalid_token(self):
        """Test password reset with invalid token"""
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        url = reverse('reset_password')
        data = {
            'uid': uid,
            'token': 'invalid_token',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_reset_password_password_mismatch(self):
        """Test password reset with mismatched passwords"""
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        url = reverse('reset_password')
        data = {
            'uid': uid,
            'token': token,
            'new_password': 'newpass123',
            'confirm_password': 'differentpass'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_change_password_success(self):
        """Test successful password change for authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('change_password')
        data = {
            'current_password': 'testpass123',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))

    def test_change_password_wrong_current_password(self):
        """Test password change with wrong current password"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('change_password')
        data = {
            'current_password': 'wrongpass',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', response.data)

    def test_change_password_password_mismatch(self):
        """Test password change with mismatched new passwords"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('change_password')
        data = {
            'current_password': 'testpass123',
            'new_password': 'newpass123',
            'confirm_password': 'differentpass'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_change_password_same_password(self):
        """Test password change with same password"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('change_password')
        data = {
            'current_password': 'testpass123',
            'new_password': 'testpass123',
            'confirm_password': 'testpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_change_password_unauthenticated(self):
        """Test password change without authentication"""
        url = reverse('change_password')
        data = {
            'current_password': 'testpass123',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
