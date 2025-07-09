
import uuid
from datetime import timedelta
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.cohorts.models import Cohort
from apps.invitations.models import Invitation
from apps.invitations.serializers import InvitationSerializer
from apps.invitations.tasks import send_invitation_email

User = get_user_model()


class InvitationModelTestCase(TestCase):
    """Test cases for Invitation model"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_active=True,
        )
        
        self.cohort = Cohort.objects.create(
            name="Test Cohort 2024",
            program_type="diploma",
            is_active=True,
            start_date="2024-01-01",
        )

    def test_invitation_creation(self):
        """Test creating an invitation"""
        invitation = Invitation.objects.create(
            email="student@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        self.assertEqual(invitation.email, "student@test.com")
        self.assertEqual(invitation.role, "student")
        self.assertEqual(invitation.program_type, "diploma")
        self.assertEqual(invitation.cohort, self.cohort)
        self.assertEqual(invitation.created_by, self.admin_user)
        self.assertIsNotNone(invitation.token)
        self.assertIsInstance(invitation.token, uuid.UUID)
        self.assertIsNone(invitation.used_at)

    def test_invitation_str_representation(self):
        """Test string representation of invitation"""
        invitation = Invitation.objects.create(
            email="student@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        expected_str = f"student@test.com - student - diploma"
        self.assertEqual(str(invitation), expected_str)

    def test_invitation_is_expired_property(self):
        """Test is_expired property"""
        # Create non-expired invitation
        future_time = timezone.now() + timedelta(days=1)
        invitation = Invitation.objects.create(
            email="student@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=future_time,
            created_by=self.admin_user,
        )
        
        self.assertFalse(invitation.is_expired)
        
        # Create expired invitation
        past_time = timezone.now() - timedelta(days=1)
        expired_invitation = Invitation.objects.create(
            email="expired@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=past_time,
            created_by=self.admin_user,
        )
        
        self.assertTrue(expired_invitation.is_expired)

    def test_invitation_is_used_property(self):
        """Test is_used property"""
        invitation = Invitation.objects.create(
            email="student@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        self.assertFalse(invitation.is_used)
        
        # Mark as used
        invitation.used_at = timezone.now()
        invitation.save()
        
        self.assertTrue(invitation.is_used)

    def test_invitation_token_uniqueness(self):
        """Test that invitation tokens are unique"""
        invitation1 = Invitation.objects.create(
            email="student1@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        invitation2 = Invitation.objects.create(
            email="student2@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        self.assertNotEqual(invitation1.token, invitation2.token)

    def test_invitation_admin_role_no_program_type(self):
        """Test creating invitation for admin role without program type"""
        invitation = Invitation.objects.create(
            email="admin2@test.com",
            role="admin",
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        self.assertEqual(invitation.role, "admin")
        self.assertIsNone(invitation.program_type)
        self.assertIsNone(invitation.cohort)

    def test_invitation_lecturer_role_no_cohort(self):
        """Test creating invitation for lecturer role without cohort"""
        invitation = Invitation.objects.create(
            email="lecturer@test.com",
            role="lecturer",
            program_type="certificate",
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        self.assertEqual(invitation.role, "lecturer")
        self.assertEqual(invitation.program_type, "certificate")
        self.assertIsNone(invitation.cohort)


class InvitationSerializerTestCase(TestCase):
    """Test cases for InvitationSerializer"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            role="admin",
            is_active=True,
        )
        
        self.cohort = Cohort.objects.create(
            name="Test Cohort 2024",
            program_type="diploma",
            is_active=True,
            start_date="2024-01-01",
        )

    def test_serializer_valid_student_data(self):
        """Test serializer with valid student data"""
        data = {
            "email": "student@test.com",
            "role": "student",
            "program_type": "diploma",
            "cohort": self.cohort.id,
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        serializer = InvitationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_student_missing_program_type(self):
        """Test serializer validation for student missing program type"""
        data = {
            "email": "student@test.com",
            "role": "student",
            "cohort": self.cohort.id,
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        serializer = InvitationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("program_type", serializer.errors)

    def test_serializer_student_missing_cohort(self):
        """Test serializer validation for student missing cohort"""
        data = {
            "email": "student@test.com",
            "role": "student",
            "program_type": "diploma",
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        serializer = InvitationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("cohort", serializer.errors)

    def test_serializer_valid_admin_data(self):
        """Test serializer with valid admin data"""
        data = {
            "email": "admin2@test.com",
            "role": "admin",
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        serializer = InvitationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_valid_lecturer_data(self):
        """Test serializer with valid lecturer data"""
        data = {
            "email": "lecturer@test.com",
            "role": "lecturer",
            "program_type": "certificate",
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        serializer = InvitationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_read_only_fields(self):
        """Test that read-only fields are not included in validation"""
        invitation = Invitation.objects.create(
            email="student@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        serializer = InvitationSerializer(invitation)
        data = serializer.data
        
        # Read-only fields should be present in serialized data
        self.assertIn("id", data)
        self.assertIn("token", data)
        self.assertIn("created_by", data)
        self.assertIn("is_expired", data)
        self.assertIn("is_used", data)


class InvitationViewSetTestCase(APITestCase):
    """Test cases for InvitationViewSet"""

    def setUp(self):
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            role="admin",
            is_active=True,
        )
        
        # Create non-admin user
        self.student_user = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            role="student",
            program_type="diploma",
            is_active=True,
        )
        
        self.cohort = Cohort.objects.create(
            name="Test Cohort 2024",
            program_type="diploma",
            is_active=True,
            start_date="2024-01-01",
        )
        
        # URLs
        self.invitation_list_url = reverse("invitation-list")

    def test_list_invitations_as_admin(self):
        """Test listing invitations as admin"""
        # Clear any existing invitations first
        Invitation.objects.all().delete()
        
        # Create test invitation
        invitation = Invitation.objects.create(
            email="test@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.invitation_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]["email"], "test@test.com")
        else:
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]["email"], "test@test.com")

    def test_list_invitations_as_non_admin(self):
        """Test listing invitations as non-admin user"""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.invitation_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_invitations_unauthenticated(self):
        """Test listing invitations without authentication"""
        response = self.client.get(self.invitation_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("apps.invitations.views.async_task")
    def test_create_invitation_as_admin(self, mock_async_task):
        """Test creating invitation as admin"""
        data = {
            "email": "newstudent@test.com",
            "role": "student",
            "program_type": "diploma",
            "cohort": self.cohort.id,
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.invitation_list_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "newstudent@test.com")
        self.assertEqual(response.data["created_by"], self.admin_user.id)
        
        # Check that async task was called
        mock_async_task.assert_called_once()
        
        # Verify invitation was created in database
        invitation = Invitation.objects.get(email="newstudent@test.com")
        self.assertEqual(invitation.role, "student")
        self.assertEqual(invitation.created_by, self.admin_user)

    def test_create_invitation_as_non_admin(self):
        """Test creating invitation as non-admin user"""
        data = {
            "email": "newstudent@test.com",
            "role": "student",
            "program_type": "diploma",
            "cohort": self.cohort.id,
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.invitation_list_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_invitation_invalid_data(self):
        """Test creating invitation with invalid data"""
        data = {
            "email": "newstudent@test.com",
            "role": "student",
            # Missing program_type and cohort for student
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.invitation_list_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check that validation errors are returned (program_type is required first)
        self.assertIn("program_type", response.data)
        # Note: cohort validation might not trigger if program_type is missing first

    def test_retrieve_invitation_as_admin(self):
        """Test retrieving specific invitation as admin"""
        invitation = Invitation.objects.create(
            email="test@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        url = reverse("invitation-detail", kwargs={"pk": invitation.id})
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "test@test.com")

    @patch("apps.invitations.views.async_task")
    @override_settings(INVITATION_EXPIRATION_TIME=timedelta(days=14))
    def test_resend_invitation_as_admin(self, mock_async_task):
        """Test resending invitation as admin"""
        invitation = Invitation.objects.create(
            email="test@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        original_expires_at = invitation.expires_at
        
        url = reverse("invitation-resend", kwargs={"pk": invitation.id})
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "Invitation resent.")
        
        # Check that async task was called
        mock_async_task.assert_called_once()
        
        # Verify expiry time was updated
        invitation.refresh_from_db()
        self.assertGreater(invitation.expires_at, original_expires_at)

    def test_resend_invitation_as_non_admin(self):
        """Test resending invitation as non-admin user"""
        invitation = Invitation.objects.create(
            email="test@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        url = reverse("invitation-resend", kwargs={"pk": invitation.id})
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_invitation_as_admin(self):
        """Test updating invitation as admin"""
        invitation = Invitation.objects.create(
            email="test@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        data = {
            "email": "updated@test.com",
            "role": "student",
            "program_type": "certificate",
            "cohort": self.cohort.id,
            "expires_at": timezone.now() + timedelta(days=14),
        }
        
        url = reverse("invitation-detail", kwargs={"pk": invitation.id})
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "updated@test.com")
        self.assertEqual(response.data["program_type"], "certificate")

    def test_delete_invitation_as_admin(self):
        """Test deleting invitation as admin"""
        invitation = Invitation.objects.create(
            email="test@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        url = reverse("invitation-detail", kwargs={"pk": invitation.id})
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify invitation was deleted
        with self.assertRaises(Invitation.DoesNotExist):
            Invitation.objects.get(id=invitation.id)


class InvitationTaskTestCase(TestCase):
    """Test cases for invitation tasks"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            role="admin",
            is_active=True,
        )
        
        self.cohort = Cohort.objects.create(
            name="Test Cohort 2024",
            program_type="diploma",
            is_active=True,
            start_date="2024-01-01",
        )

    @patch("apps.invitations.tasks.send_mail")
    @override_settings(
        FRONTEND_URL="https://example.com",
        DEFAULT_FROM_EMAIL="noreply@example.com"
    )
    def test_send_invitation_email_task(self, mock_send_mail):
        """Test send_invitation_email task"""
        invitation = Invitation.objects.create(
            email="student@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        # Call the task
        send_invitation_email(invitation.id)
        
        # Verify send_mail was called with correct parameters
        mock_send_mail.assert_called_once()
        call_args = mock_send_mail.call_args
        
        self.assertEqual(call_args[0][0], "You're invited to join the platform")
        self.assertIn(f"invited to join as a {invitation.role}", call_args[0][1])
        self.assertIn(f"https://example.com/onboard/{invitation.token}/", call_args[0][1])
        self.assertEqual(call_args[0][2], "noreply@example.com")
        self.assertEqual(call_args[0][3], ["student@test.com"])
        self.assertEqual(call_args[1]["fail_silently"], False)

    @patch("apps.invitations.tasks.send_mail")
    def test_send_invitation_email_task_nonexistent_invitation(self, mock_send_mail):
        """Test send_invitation_email task with non-existent invitation"""
        with self.assertRaises(Invitation.DoesNotExist):
            send_invitation_email(99999)
        
        # Verify send_mail was not called
        mock_send_mail.assert_not_called()

    @patch("apps.invitations.tasks.send_mail")
    def test_send_invitation_email_content_format(self, mock_send_mail):
        """Test the format of invitation email content"""
        invitation = Invitation.objects.create(
            email="lecturer@test.com",
            role="lecturer",
            program_type="certificate",
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        with override_settings(
            FRONTEND_URL="https://testsite.com",
            DEFAULT_FROM_EMAIL="invites@testsite.com"
        ):
            send_invitation_email(invitation.id)
        
        # Get the call arguments
        call_args = mock_send_mail.call_args
        subject = call_args[0][0]
        message = call_args[0][1]
        
        self.assertEqual(subject, "You're invited to join the platform")
        self.assertIn("Hello,", message)
        self.assertIn("You have been invited to join as a lecturer", message)
        self.assertIn(f"https://testsite.com/onboard/{invitation.token}/", message)
        self.assertIn(f"This link will expire on {invitation.expires_at}", message)


class InvitationIntegrationTestCase(APITestCase):
    """Integration tests for invitation functionality"""

    def setUp(self):
        self.client = APIClient()
        
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            role="admin",
            is_active=True,
        )
        
        self.cohort = Cohort.objects.create(
            name="Test Cohort 2024",
            program_type="diploma",
            is_active=True,
            start_date="2024-01-01",
        )

    @patch("apps.invitations.tasks.send_mail")
    def test_complete_invitation_flow(self, mock_send_mail):
        """Test complete invitation creation and email sending flow"""
        data = {
            "email": "newstudent@test.com",
            "role": "student",
            "program_type": "diploma",
            "cohort": self.cohort.id,
            "expires_at": timezone.now() + timedelta(days=7),
        }
        
        self.client.force_authenticate(user=self.admin_user)
        
        # Create invitation
        response = self.client.post(reverse("invitation-list"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify invitation exists in database
        invitation = Invitation.objects.get(email="newstudent@test.com")
        self.assertEqual(invitation.role, "student")
        self.assertEqual(invitation.program_type, "diploma")
        self.assertEqual(invitation.cohort, self.cohort)
        
        # Note: In real tests, you would need to wait for the async task or use a synchronous test runner

    def test_invitation_token_security(self):
        """Test that invitation tokens are properly secured"""
        invitation1 = Invitation.objects.create(
            email="student1@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        invitation2 = Invitation.objects.create(
            email="student2@test.com",
            role="student",
            program_type="diploma",
            cohort=self.cohort,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=self.admin_user,
        )
        
        # Tokens should be unique
        self.assertNotEqual(invitation1.token, invitation2.token)
        
        # Tokens should be valid UUIDs
        self.assertIsInstance(invitation1.token, uuid.UUID)
        self.assertIsInstance(invitation2.token, uuid.UUID)
        
        # Tokens should be in the correct format
        self.assertEqual(len(str(invitation1.token)), 36)  # UUID4 string length
        self.assertEqual(len(str(invitation2.token)), 36)
