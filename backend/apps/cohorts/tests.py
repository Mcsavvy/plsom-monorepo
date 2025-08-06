from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta

from apps.cohorts.models import Cohort, Enrollment
from apps.cohorts.serializers import CohortSerializer, EnrollmentSerializer

User = get_user_model()


class CohortModelTestCase(TestCase):
    """Test cases for Cohort model"""

    def setUp(self):
        """Set up test data"""
        self.today = timezone.now().date()
        self.future_date = self.today + timedelta(days=30)
        self.end_date = self.today + timedelta(days=365)

    def test_cohort_creation(self):
        """Test basic cohort creation"""
        cohort = Cohort.objects.create(
            name="Test Cohort 2024",
            program_type="certificate",
            start_date=self.future_date,
            is_active=False,
        )

        self.assertEqual(cohort.name, "Test Cohort 2024")
        self.assertEqual(cohort.program_type, "certificate")
        self.assertEqual(cohort.start_date, self.future_date)
        self.assertFalse(cohort.is_active)
        self.assertIsNone(cohort.end_date)

    def test_cohort_str_representation(self):
        """Test string representation of cohort"""
        cohort = Cohort.objects.create(
            name="Test Cohort 2024",
            program_type="diploma",
            start_date=self.future_date,
        )

        self.assertEqual(str(cohort), "Test Cohort 2024 - diploma")

    def test_cohort_properties(self):
        """Test cohort computed properties"""
        # Future cohort
        future_cohort = Cohort.objects.create(
            name="Future Cohort",
            program_type="certificate",
            start_date=self.today + timedelta(days=30),
            end_date=self.today + timedelta(days=400),
        )

        self.assertFalse(future_cohort.is_started)
        self.assertFalse(future_cohort.is_ended)
        self.assertFalse(future_cohort.is_current)
        self.assertEqual(future_cohort.duration_days, 370)
        self.assertEqual(future_cohort.enrolled_students_count, 0)

        # Current cohort
        current_cohort = Cohort.objects.create(
            name="Current Cohort",
            program_type="diploma",
            start_date=self.today - timedelta(days=10),
            end_date=self.today + timedelta(days=200),
            is_active=True,
        )

        self.assertTrue(current_cohort.is_started)
        self.assertFalse(current_cohort.is_ended)
        self.assertTrue(current_cohort.is_current)
        self.assertEqual(current_cohort.duration_days, 210)

        # Ended cohort
        ended_cohort = Cohort.objects.create(
            name="Ended Cohort",
            program_type="certificate",
            start_date=self.today - timedelta(days=400),
            end_date=self.today - timedelta(days=10),
        )

        self.assertTrue(ended_cohort.is_started)
        self.assertTrue(ended_cohort.is_ended)
        self.assertFalse(ended_cohort.is_current)

    def test_cohort_validation_end_date_before_start_date(self):
        """Test validation when end date is before start date"""
        with self.assertRaises(Exception):
            Cohort.objects.create(
                name="Invalid Cohort",
                program_type="certificate",
                start_date=self.future_date,
                end_date=self.today,
            )

    def test_cohort_validation_duration_too_short(self):
        """Test validation when cohort duration is too short"""
        with self.assertRaises(Exception):
            Cohort.objects.create(
                name="Short Cohort",
                program_type="certificate",
                start_date=self.future_date,
                end_date=self.future_date + timedelta(days=20),
            )

    def test_cohort_validation_duration_too_long(self):
        """Test validation when cohort duration is too long"""
        with self.assertRaises(Exception):
            Cohort.objects.create(
                name="Long Cohort",
                program_type="certificate",
                start_date=self.future_date,
                end_date=self.future_date + timedelta(days=800),
            )

    def test_cohort_can_be_deleted(self):
        """Test cohort deletion validation"""
        cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            is_active=False,
        )

        can_delete, message = cohort.can_be_deleted()
        self.assertTrue(can_delete)

        # Test with enrolled students
        student = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            role="student",
            program_type="certificate",
        )
        Enrollment.objects.create(student=student, cohort=cohort)

        can_delete, message = cohort.can_be_deleted()
        self.assertFalse(can_delete)
        self.assertIn("enrolled students", message)

        # Test with active cohort
        active_cohort = Cohort.objects.create(
            name="Active Cohort",
            program_type="diploma",
            start_date=self.future_date,
            is_active=True,
        )

        can_delete, message = active_cohort.can_be_deleted()
        self.assertFalse(can_delete)
        self.assertIn("active cohort", message)

    def test_cohort_archive(self):
        """Test cohort archiving"""
        cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.today - timedelta(days=25),
            end_date=self.today + timedelta(days=10),
            is_active=True,
        )

        archived_cohort = cohort.archive()

        self.assertEqual(archived_cohort.end_date, self.today)
        self.assertFalse(archived_cohort.is_active)


class EnrollmentModelTestCase(TestCase):
    """Test cases for Enrollment model"""

    def setUp(self):
        """Set up test data"""
        self.today = timezone.now().date()
        self.future_date = self.today + timedelta(days=30)

        self.student = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            role="student",
            program_type="certificate",
        )

        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            is_active=True,
        )

    def test_enrollment_creation(self):
        """Test basic enrollment creation"""
        enrollment = Enrollment.objects.create(
            student=self.student, cohort=self.cohort
        )

        self.assertEqual(enrollment.student, self.student)
        self.assertEqual(enrollment.cohort, self.cohort)
        self.assertIsNotNone(enrollment.enrolled_at)

    def test_enrollment_str_representation(self):
        """Test string representation of enrollment"""
        enrollment = Enrollment.objects.create(
            student=self.student, cohort=self.cohort
        )

        self.assertEqual(
            str(enrollment), f"{self.student.email} - {self.cohort.name}"
        )

    def test_enrollment_unique_constraint(self):
        """Test that a student cannot be enrolled in the same cohort twice"""
        Enrollment.objects.create(student=self.student, cohort=self.cohort)

        with self.assertRaises(Exception):
            Enrollment.objects.create(student=self.student, cohort=self.cohort)

    def test_enrollment_program_type_validation(self):
        """Test that student program type must match cohort program type"""
        diploma_student = User.objects.create_user(
            email="diploma@test.com",
            password="testpass123",
            role="student",
            program_type="diploma",
        )

        with self.assertRaises(Exception):
            Enrollment.objects.create(
                student=diploma_student, cohort=self.cohort
            )


class CohortSerializerTestCase(TestCase):
    """Test cases for CohortSerializer"""

    def setUp(self):
        """Set up test data"""
        self.today = timezone.now().date()
        self.future_date = self.today + timedelta(days=30)
        self.end_date = self.today + timedelta(days=365)

    def test_cohort_serializer_creation(self):
        """Test cohort serializer for creation"""
        data = {
            "name": "Test Cohort 2024",
            "program_type": "certificate",
            "start_date": self.future_date,
            "is_active": False,
        }

        serializer = CohortSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        cohort = serializer.save()
        self.assertEqual(cohort.name, "Test Cohort 2024")
        self.assertEqual(cohort.program_type, "certificate")

    def test_cohort_serializer_validation_name_unique(self):
        """Test that cohort name must be unique"""
        Cohort.objects.create(
            name="Existing Cohort",
            program_type="certificate",
            start_date=self.future_date,
        )

        data = {
            "name": "Existing Cohort",
            "program_type": "diploma",
            "start_date": self.future_date,
        }

        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_cohort_serializer_validation_start_date_past(self):
        """Test that start date cannot be in the past for new cohorts"""
        data = {
            "name": "Past Cohort",
            "program_type": "certificate",
            "start_date": self.today - timedelta(days=10),
        }

        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("start_date", serializer.errors)

    def test_cohort_serializer_validation_end_date_past(self):
        """Test that end date cannot be in the past"""
        data = {
            "name": "Invalid Cohort",
            "program_type": "certificate",
            "start_date": self.future_date,
            "end_date": self.today - timedelta(days=10),
        }

        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("end_date", serializer.errors)

    def test_cohort_serializer_validation_duration(self):
        """Test cohort duration validation"""
        # Too short duration
        data = {
            "name": "Short Cohort",
            "program_type": "certificate",
            "start_date": self.future_date,
            "end_date": self.future_date + timedelta(days=20),
        }

        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("end_date", serializer.errors)

        # Too long duration
        data = {
            "name": "Long Cohort",
            "program_type": "certificate",
            "start_date": self.future_date,
            "end_date": self.future_date + timedelta(days=800),
        }

        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("end_date", serializer.errors)

    def test_cohort_serializer_activation_business_rule(self):
        """Test that only one cohort can be active per program type"""
        # Create first active cohort
        Cohort.objects.create(
            name="Active Cohort 1",
            program_type="certificate",
            start_date=self.future_date,
            is_active=True,
        )

        # Try to create another active cohort for same program type
        data = {
            "name": "Active Cohort 2",
            "program_type": "certificate",
            "start_date": self.future_date + timedelta(days=10),
            "is_active": True,
        }

        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("is_active", serializer.errors)


class EnrollmentSerializerTestCase(TestCase):
    """Test cases for EnrollmentSerializer"""

    def setUp(self):
        """Set up test data"""
        self.today = timezone.now().date()
        self.future_date = self.today + timedelta(days=30)

        self.student = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            role="student",
            program_type="certificate",
        )

        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            is_active=True,
        )

    def test_enrollment_serializer_creation(self):
        """Test enrollment serializer for creation"""
        data = {"student": self.student.id, "cohort": self.cohort.id}

        serializer = EnrollmentSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        enrollment = serializer.save()
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.student, self.student)
        self.assertEqual(enrollment.cohort, self.cohort)

    def test_enrollment_serializer_program_type_mismatch(self):
        """Test that student program type must match cohort program type"""
        diploma_student = User.objects.create_user(
            email="diploma@test.com",
            password="testpass123",
            role="student",
            program_type="diploma",
        )

        data = {"student": diploma_student.id, "cohort": self.cohort.id}

        serializer = EnrollmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_enrollment_serializer_inactive_cohort(self):
        """Test that cannot enroll in inactive cohort"""
        inactive_cohort = Cohort.objects.create(
            name="Inactive Cohort",
            program_type="certificate",
            start_date=self.future_date,
            is_active=False,
        )

        data = {"student": self.student.id, "cohort": inactive_cohort.id}

        serializer = EnrollmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_enrollment_serializer_ended_cohort(self):
        """Test that cannot enroll in ended cohort"""
        ended_cohort = Cohort.objects.create(
            name="Ended Cohort",
            program_type="certificate",
            start_date=self.today - timedelta(days=100),
            end_date=self.today - timedelta(days=10),
        )

        data = {"student": self.student.id, "cohort": ended_cohort.id}

        serializer = EnrollmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)


class CohortViewSetTestCase(APITestCase):
    """Test cases for CohortViewSet"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.today = timezone.now().date()
        self.future_date = self.today + timedelta(days=30)

        # Create users with different roles
        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="testpass123", role="admin"
        )

        self.lecturer_user = User.objects.create_user(
            email="lecturer@test.com", password="testpass123", role="lecturer"
        )

        self.student_user = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            role="student",
            program_type="certificate",
        )

        # Create cohorts
        self.cohort1 = Cohort.objects.create(
            name="Cohort 1",
            program_type="certificate",
            start_date=self.future_date,
            is_active=True,
        )

        self.cohort2 = Cohort.objects.create(
            name="Cohort 2",
            program_type="diploma",
            start_date=self.future_date + timedelta(days=10),
            is_active=False,
        )

        # Create enrollment for student
        self.enrollment = Enrollment.objects.create(
            student=self.student_user, cohort=self.cohort1
        )

    def test_list_cohorts_admin(self):
        """Test that admin can see all cohorts"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("cohort-list")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_cohorts_lecturer(self):
        """Test that lecturer can see all cohorts"""
        self.client.force_authenticate(user=self.lecturer_user)
        url = reverse("cohort-list")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_cohorts_student(self):
        """Test that student can only see their enrolled cohort"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("cohort-list")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Cohort 1")

    def test_create_cohort_admin(self):
        """Test that admin can create cohorts"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("cohort-list")

        data = {
            "name": "New Cohort",
            "program_type": "certificate",
            "start_date": self.future_date + timedelta(days=20),
            "is_active": False,
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Cohort.objects.count(), 3)

    def test_create_cohort_non_admin(self):
        """Test that non-admin cannot create cohorts"""
        self.client.force_authenticate(user=self.lecturer_user)
        url = reverse("cohort-list")

        data = {
            "name": "New Cohort",
            "program_type": "certificate",
            "start_date": self.future_date + timedelta(days=20),
            "is_active": False,
        }

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_cohort_admin(self):
        """Test that admin can retrieve any cohort"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("cohort-detail", args=[self.cohort1.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Cohort 1")

    def test_retrieve_cohort_student_own_cohort(self):
        """Test that student can retrieve their own cohort"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("cohort-detail", args=[self.cohort1.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_cohort_student_other_cohort(self):
        """Test that student cannot retrieve other cohorts"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("cohort-detail", args=[self.cohort2.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_cohort_admin(self):
        """Test that admin can update cohorts"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("cohort-detail", args=[self.cohort1.id])

        data = {"name": "Updated Cohort 1"}

        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Cohort 1")

    def test_update_cohort_non_admin(self):
        """Test that non-admin cannot update cohorts"""
        self.client.force_authenticate(user=self.lecturer_user)
        url = reverse("cohort-detail", args=[self.cohort1.id])

        data = {"name": "Updated Cohort 1"}

        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_cohort_admin_success(self):
        """Test that admin can delete eligible cohorts"""
        # Create a cohort that can be deleted
        deletable_cohort = Cohort.objects.create(
            name="Deletable Cohort",
            program_type="certificate",
            start_date=self.future_date + timedelta(days=50),
            is_active=False,
        )

        self.client.force_authenticate(user=self.admin_user)
        url = reverse("cohort-detail", args=[deletable_cohort.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_cohort_with_enrollments(self):
        """Test that cannot delete cohort with enrollments"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("cohort-detail", args=[self.cohort1.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_current_cohorts_endpoint(self):
        """Test current cohorts endpoint"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("cohort-current")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only cohort1 is active

    def test_my_cohort_endpoint_student(self):
        """Test my cohort endpoint for student"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("cohort-my-cohort")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Cohort 1")

    def test_my_cohort_endpoint_non_student(self):
        """Test my cohort endpoint for non-student"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("cohort-my-cohort")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_archive_cohort_admin(self):
        """Test that admin can archive cohorts"""
        self.client.force_authenticate(user=self.admin_user)
        cohort = Cohort.objects.create(
            name="Cohort 1",
            program_type="certificate",
            start_date=self.today - timedelta(days=25),
            end_date=self.today + timedelta(days=10),
            is_active=True,
        )
        url = reverse("cohort-archive", args=[cohort.id])

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify cohort was archived
        cohort.refresh_from_db()
        self.assertEqual(cohort.end_date, self.today)
        self.assertFalse(cohort.is_active)

    def test_archive_cohort_non_admin(self):
        """Test that non-admin cannot archive cohorts"""
        self.client.force_authenticate(user=self.lecturer_user)
        url = reverse("cohort-archive", args=[self.cohort1.id])

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class EnrollmentViewSetTestCase(APITestCase):
    """Test cases for EnrollmentViewSet"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.today = timezone.now().date()
        self.future_date = self.today + timedelta(days=30)

        # Create users
        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="testpass123", role="admin"
        )

        self.student1 = User.objects.create_user(
            email="student1@test.com",
            password="testpass123",
            role="student",
            program_type="certificate",
        )

        self.student2 = User.objects.create_user(
            email="student2@test.com",
            password="testpass123",
            role="student",
            program_type="diploma",
        )

        # Create cohorts
        self.cohort1 = Cohort.objects.create(
            name="Cohort 1",
            program_type="certificate",
            start_date=self.future_date,
            is_active=True,
        )

        self.cohort2 = Cohort.objects.create(
            name="Cohort 2",
            program_type="diploma",
            start_date=self.future_date,
            is_active=True,
        )

        # Create enrollments
        self.enrollment1 = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort1
        )

        self.enrollment2 = Enrollment.objects.create(
            student=self.student2, cohort=self.cohort2
        )

    def test_list_enrollments_admin(self):
        """Test that admin can see all enrollments"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("enrollment-list")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_enrollments_student(self):
        """Test that student can only see their own enrollments"""
        self.client.force_authenticate(user=self.student1)
        url = reverse("enrollment-list")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["student"]["email"], "student1@test.com"
        )

    def test_retrieve_enrollment_admin(self):
        """Test that admin can retrieve any enrollment"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("enrollment-detail", args=[self.enrollment1.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["student"]["email"], "student1@test.com")

    def test_retrieve_enrollment_student_own(self):
        """Test that student can retrieve their own enrollment"""
        self.client.force_authenticate(user=self.student1)
        url = reverse("enrollment-detail", args=[self.enrollment1.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_enrollment_student_other(self):
        """Test that student cannot retrieve other enrollments"""
        self.client.force_authenticate(user=self.student1)
        url = reverse("enrollment-detail", args=[self.enrollment2.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_enrollment_read_only(self):
        """Test that enrollments are read-only"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("enrollment-list")

        data = {"student": self.student1.id, "cohort": self.cohort2.id}

        response = self.client.post(url, data)

        self.assertEqual(
            response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED
        )
