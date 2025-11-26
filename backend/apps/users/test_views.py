from typing import Any
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch
from PIL import Image
import io
from datetime import timedelta
from django.utils import timezone

from apps.cohorts.models import Cohort, Enrollment
from apps.users.serializers import (
    UserSerializer,
    ProfilePictureUploadSerializer,
    StudentEnrollmentActionSerializer,
)

User = get_user_model()


class UserViewSetTestCase(APITestCase):
    """Test cases for UserViewSet."""

    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            first_name="Student",
            last_name="User",
            role="student",
        )

        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Lecturer",
            last_name="User",
            role="lecturer",
        )

        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="testpassword123",
            first_name="Admin",
            last_name="User",
            role="admin",
        )

    def test_me_endpoint_authenticated(self):
        """Test GET /api/users/me/ with authenticated user."""
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "student@example.com")
        self.assertEqual(response.data["role"], "student")

    def test_me_endpoint_unauthenticated(self):
        """Test GET /api/users/me/ without authentication."""
        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_authenticated(self):
        """Test updating user profile when authenticated."""
        self.client.force_authenticate(user=self.student)

        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "whatsapp_number": "+1234567890",
        }

        response = self.client.patch(
            f"/api/users/{self.student.id}/", update_data
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Updated")
        self.assertEqual(response.data["last_name"], "Name")
        self.assertEqual(response.data["whatsapp_number"], "+1234567890")

    def test_update_user_readonly_fields(self):
        """Test that readonly fields cannot be updated."""
        self.client.force_authenticate(user=self.student)

        update_data = {
            "role": "admin",  # Should be readonly
            "is_active": False,  # Should be readonly
            "is_setup_complete": True,  # Should be readonly
        }

        response = self.client.patch(
            f"/api/users/{self.student.id}/", update_data
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify readonly fields weren't changed
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, "student")
        self.assertTrue(self.student.is_active)
        self.assertFalse(self.student.is_setup_complete)

    def create_test_image(self):
        """Helper method to create a test image file."""
        image = Image.new("RGB", (100, 100), color="red")
        file_obj = io.BytesIO()
        image.save(file_obj, format="JPEG")
        file_obj.seek(0)
        return SimpleUploadedFile(
            name="test_image.jpg",
            content=file_obj.read(),
            content_type="image/jpeg",
        )

    def test_profile_picture_upload_success(self):
        """Test successful profile picture upload."""
        self.client.force_authenticate(user=self.student)

        image_file = self.create_test_image()
        data = {"profile_picture": image_file}

        response = self.client.post(
            "/api/users/me/profile-picture/", data, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertIsNotNone(self.student.profile_picture)

    def test_profile_picture_delete_success(self):
        """Test successful profile picture deletion."""
        # First, set a profile picture
        self.student.profile_picture = self.create_test_image()
        self.student.save()

        self.client.force_authenticate(user=self.student)

        response = self.client.delete("/api/users/me/profile-picture/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertFalse(self.student.profile_picture)

    def test_profile_picture_delete_none_exists(self):
        """Test deleting profile picture when none exists."""
        self.client.force_authenticate(user=self.student)

        response = self.client.delete("/api/users/me/profile-picture/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No profile picture to delete", response.data["error"])

    def test_profile_picture_unauthenticated(self):
        """Test profile picture operations without authentication."""
        image_file = self.create_test_image()
        data = {"profile_picture": image_file}

        response = self.client.post(
            "/api/users/me/profile-picture/", data, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StudentViewSetTestCase(APITestCase):
    """Test cases for StudentViewSet."""

    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.student1 = User.objects.create_user(
            email="student1@example.com",
            password="testpassword123",
            first_name="Student",
            last_name="One",
            role="student",
        )

        self.student2 = User.objects.create_user(
            email="student2@example.com",
            password="testpassword123",
            first_name="Student",
            last_name="Two",
            role="student",
        )

        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Lecturer",
            last_name="User",
            role="lecturer",
        )

        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="testpassword123",
            first_name="Admin",
            last_name="User",
            role="admin",
        )

        # Create a test cohort
        today = timezone.now().date()
        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            start_date=today,
            end_date=today + timedelta(days=30),
        )

    def test_list_students_as_lecturer(self):
        """Test listing students as a lecturer."""
        self.client.force_authenticate(user=self.lecturer)

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_students_as_admin(self):
        """Test listing students as an admin."""
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_students_as_student_forbidden(self):
        """Test that students cannot list other students."""
        self.client.force_authenticate(user=self.student1)

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_students_unauthenticated(self):
        """Test listing students without authentication."""
        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_student_as_self(self):
        """Test retrieving own student profile."""
        self.client.force_authenticate(user=self.student1)

        response = self.client.get(f"/api/students/{self.student1.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "student1@example.com")

    def test_retrieve_student_as_lecturer(self):
        """Test retrieving student profile as lecturer."""
        self.client.force_authenticate(user=self.lecturer)

        response = self.client.get(f"/api/students/{self.student1.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "student1@example.com")

    def test_retrieve_student_as_admin(self):
        """Test retrieving student profile as admin."""
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(f"/api/students/{self.student1.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "student1@example.com")

    def test_retrieve_other_student_as_student_forbidden(self):
        """Test that students cannot retrieve other students' profiles."""
        self.client.force_authenticate(user=self.student1)

        response = self.client.get(f"/api/students/{self.student2.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_enroll_student_success(self):
        """Test successful student enrollment in cohort."""
        self.client.force_authenticate(user=self.admin)

        data = {"cohort_id": self.cohort.id}
        response = self.client.post(
            f"/api/students/{self.student1.id}/enroll/", data
        )
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            Enrollment.objects.filter(
                student=self.student1, cohort=self.cohort
            ).exists()
        )

    def test_enroll_student_already_enrolled(self):
        """Test enrolling student who is already enrolled."""
        # Pre-enroll the student
        Enrollment.objects.create(student=self.student1, cohort=self.cohort)

        self.client.force_authenticate(user=self.admin)

        data = {"cohort_id": self.cohort.id}
        response = self.client.post(
            f"/api/students/{self.student1.id}/enroll/", data
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already enrolled", str(response.data))

    def test_enroll_student_invalid_cohort(self):
        """Test enrolling student in non-existent cohort."""
        self.client.force_authenticate(user=self.admin)

        data = {"cohort_id": 99999}
        response = self.client.post(
            f"/api/students/{self.student1.id}/enroll/", data
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_enroll_student_as_lecturer_forbidden(self):
        """Test that lecturers cannot enroll students."""
        self.client.force_authenticate(user=self.lecturer)

        data = {"cohort_id": self.cohort.id}
        response = self.client.post(
            f"/api/students/{self.student1.id}/enroll/", data
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unenroll_student_success(self):
        """Test successful student unenrollment from cohort."""
        # Pre-enroll the student
        Enrollment.objects.create(student=self.student1, cohort=self.cohort)

        self.client.force_authenticate(user=self.admin)

        data = {"cohort_id": self.cohort.id}
        response = self.client.post(
            f"/api/students/{self.student1.id}/unenroll/", data
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            Enrollment.objects.filter(
                student=self.student1, cohort=self.cohort
            ).exists()
        )

    def test_unenroll_student_not_enrolled(self):
        """Test unenrolling student who is not enrolled."""
        self.client.force_authenticate(user=self.admin)

        data = {"cohort_id": self.cohort.id}
        response = self.client.post(
            f"/api/students/{self.student1.id}/unenroll/", data
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not enrolled", str(response.data))


class StaffViewSetTestCase(APITestCase):
    """Test cases for StaffViewSet."""

    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            first_name="Student",
            last_name="User",
            role="student",
        )

        self.lecturer1 = User.objects.create_user(
            email="lecturer1@example.com",
            password="testpassword123",
            first_name="Lecturer",
            last_name="One",
            role="lecturer",
        )

        self.lecturer2 = User.objects.create_user(
            email="lecturer2@example.com",
            password="testpassword123",
            first_name="Lecturer",
            last_name="Two",
            role="lecturer",
        )

        self.admin1 = User.objects.create_user(
            email="admin1@example.com",
            password="testpassword123",
            first_name="Admin",
            last_name="One",
            role="admin",
        )

        self.admin2 = User.objects.create_user(
            email="admin2@example.com",
            password="testpassword123",
            first_name="Admin",
            last_name="Two",
            role="admin",
        )

    def test_list_staff_as_admin(self):
        """Test listing staff as admin."""
        self.client.force_authenticate(user=self.admin1)

        response = self.client.get("/api/staff/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return 4 staff members (2 lecturers + 2 admins)
        self.assertEqual(len(response.data["results"]), 4)

    def test_list_staff_as_lecturer_forbidden(self):
        """Test that lecturers cannot list staff."""
        self.client.force_authenticate(user=self.lecturer1)

        response = self.client.get("/api/staff/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_staff_as_student_forbidden(self):
        """Test that students cannot list staff."""
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/staff/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_staff_as_admin(self):
        """Test retrieving staff profile as admin."""
        self.client.force_authenticate(user=self.admin1)

        response = self.client.get(f"/api/staff/{self.lecturer1.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "lecturer1@example.com")

    def test_promote_lecturer_to_admin(self):
        """Test promoting lecturer to admin."""
        self.client.force_authenticate(user=self.admin1)

        response = self.client.post(
            f"/api/staff/{self.lecturer1.id}/promote-demote/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "user promoted to admin")

        self.lecturer1.refresh_from_db()
        self.assertEqual(self.lecturer1.role, "admin")

    def test_demote_admin_to_lecturer(self):
        """Test demoting admin to lecturer."""
        self.client.force_authenticate(user=self.admin1)

        response = self.client.post(
            f"/api/staff/{self.admin2.id}/promote-demote/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "admin demoted to lecturer")

        self.admin2.refresh_from_db()
        self.assertEqual(self.admin2.role, "lecturer")

    def test_admin_cannot_demote_self(self):
        """Test that admin cannot demote themselves."""
        self.client.force_authenticate(user=self.admin1)

        response = self.client.post(
            f"/api/staff/{self.admin1.id}/promote-demote/"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot demote themselves", str(response.data))

    def test_promote_demote_student_invalid(self):
        """Test promoting/demoting a student (should fail)."""
        self.client.force_authenticate(user=self.admin1)

        response = self.client.post(
            f"/api/staff/{self.student.id}/promote-demote/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Not found", str(response.data))


class UserSerializerTestCase(TestCase):
    """Test cases for UserSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User",
            role="student",
        )

    def test_serializer_fields(self):
        """Test that serializer includes correct fields."""
        serializer = UserSerializer(instance=self.user)

        expected_fields = {
            "id",
            "email",
            "first_name",
            "last_name",
            "title",
            "role",
            "whatsapp_number",
            "profile_picture",
            "is_setup_complete",
            "is_active",
        }

        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_readonly_fields(self):
        """Test that readonly fields are properly set."""
        serializer = UserSerializer()
        readonly_fields = set(serializer.Meta.read_only_fields)
        expected_readonly = {
            "is_staff",
            "is_active",
            "role",
            "is_setup_complete",
            "profile_picture",
        }

        self.assertEqual(readonly_fields, expected_readonly)

    def test_profile_picture_serialization_with_image(self):
        """Test profile picture serialization when image exists."""
        # This would require setting up media files, so we'll mock it
        with patch.object(self.user, "profile_picture") as mock_picture:
            mock_picture.url = "/media/profiles/test.jpg"
            mock_picture.__bool__ = lambda x: True

            serializer = UserSerializer(instance=self.user)
            self.assertIn("profile_picture", serializer.data)

    def test_profile_picture_serialization_without_image(self):
        """Test profile picture serialization when no image exists."""
        serializer = UserSerializer(instance=self.user)
        self.assertIsNone(serializer.data["profile_picture"])


class ProfilePictureUploadSerializerTestCase(TestCase):
    """Test cases for ProfilePictureUploadSerializer."""

    def create_test_image(self, size=(100, 100), format="JPEG"):
        """Helper method to create test image."""
        image = Image.new("RGB", size, color="red")
        file_obj = io.BytesIO()
        image.save(file_obj, format=format)
        file_obj.seek(0)
        return SimpleUploadedFile(
            name="test_image.jpg",
            content=file_obj.read(),
            content_type="image/jpeg",
        )

    def test_valid_image_upload(self):
        """Test valid image upload validation."""
        image_file = self.create_test_image()
        data = {"profile_picture": image_file}

        serializer = ProfilePictureUploadSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_large_image_validation(self):
        """Test that large images are rejected."""
        # Create a large image (this is just a mock for testing)
        image_file = self.create_test_image()
        image_file.size = 6 * 1024 * 1024  # 6MB

        data = {"profile_picture": image_file}
        serializer = ProfilePictureUploadSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Image file size must be less than 5MB", str(serializer.errors)
        )

    def test_invalid_image_type_validation(self):
        """Test that invalid image types are rejected."""
        # Create a file with invalid content type
        invalid_file = SimpleUploadedFile(
            name="test.txt",
            content=b"This is not an image",
            content_type="text/plain",
        )

        data = {"profile_picture": invalid_file}
        serializer = ProfilePictureUploadSerializer(data=data)

        self.assertFalse(serializer.is_valid())


class StudentEnrollmentActionSerializerTestCase(TestCase):
    """Test cases for StudentEnrollmentActionSerializer."""

    def setUp(self):
        today = timezone.now().date()
        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            start_date=today,
            end_date=today + timedelta(days=30),
        )

    def test_valid_cohort_id(self):
        """Test validation with valid cohort ID."""
        data = {"cohort_id": self.cohort.id}
        serializer = StudentEnrollmentActionSerializer(data=data)

        self.assertTrue(serializer.is_valid())

    def test_invalid_cohort_id(self):
        """Test validation with invalid cohort ID."""
        data = {"cohort_id": 99999}
        serializer = StudentEnrollmentActionSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Cohort with this ID does not exist", str(serializer.errors)
        )

    def test_missing_cohort_id(self):
        """Test validation with missing cohort ID."""
        data: dict[str, Any] = {}
        serializer = StudentEnrollmentActionSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("cohort_id", serializer.errors)
