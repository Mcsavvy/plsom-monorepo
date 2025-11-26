from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta

from apps.cohorts.models import Cohort, Enrollment

User = get_user_model()


class CohortModelTestCase(TestCase):
    """Test cases for the Cohort model."""

    def setUp(self):
        self.today = timezone.now().date()
        self.past_date = self.today - timedelta(days=30)
        self.future_date = self.today + timedelta(days=30)
        self.far_future_date = self.today + timedelta(days=60)

        # Create test users
        self.student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Student",
            role="student",
        )

    def test_create_cohort_success(self):
        """Test successful cohort creation."""
        cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )

        self.assertEqual(cohort.name, "Test Cohort")
        self.assertEqual(cohort.program_type, "certificate")
        self.assertFalse(cohort.is_active)
        self.assertEqual(cohort.start_date, self.future_date)
        self.assertEqual(cohort.end_date, self.far_future_date)

    def test_cohort_string_representation(self):
        """Test cohort string representation."""
        cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )

        self.assertEqual(str(cohort), "Test Cohort - certificate")

    def test_cohort_unique_constraint(self):
        """Test that cohort name and program_type combination must be unique."""
        Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )

        with self.assertRaises(IntegrityError):
            Cohort.objects.create(
                name="Test Cohort",
                program_type="certificate",
                start_date=self.future_date + timedelta(days=1),
                end_date=self.far_future_date + timedelta(days=1),
            )

    def test_cohort_same_name_different_program_type_allowed(self):
        """Test that same name with different program type is allowed."""
        Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )

        # This should not raise an error
        cohort2 = Cohort.objects.create(
            name="Test Cohort",
            program_type="diploma",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )

        self.assertEqual(cohort2.name, "Test Cohort")
        self.assertEqual(cohort2.program_type, "diploma")

    def test_cohort_ordering(self):
        """Test that cohorts are ordered by start_date descending."""
        cohort1 = Cohort.objects.create(
            name="First Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )

        cohort2 = Cohort.objects.create(
            name="Second Cohort",
            program_type="certificate",
            start_date=self.future_date + timedelta(days=10),
            end_date=self.far_future_date + timedelta(days=10),
        )

        cohorts = list(Cohort.objects.all())
        self.assertEqual(
            cohorts[0], cohort2
        )  # Later start date should come first
        self.assertEqual(cohorts[1], cohort1)

    def test_is_started_property(self):
        """Test is_started property."""
        # Future cohort
        future_cohort = Cohort.objects.create(
            name="Future Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )
        self.assertFalse(future_cohort.is_started)

        # Current cohort
        current_cohort = Cohort.objects.create(
            name="Current Cohort",
            program_type="diploma",
            start_date=self.today,
            end_date=self.far_future_date,
        )
        self.assertTrue(current_cohort.is_started)

        # Past cohort
        past_cohort = Cohort.objects.create(
            name="Past Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.today - timedelta(days=1),
        )
        self.assertTrue(past_cohort.is_started)

    def test_is_ended_property(self):
        """Test is_ended property."""
        # Cohort without end date
        no_end_cohort = Cohort.objects.create(
            name="No End Cohort",
            program_type="certificate",
            start_date=self.past_date,
        )
        self.assertFalse(no_end_cohort.is_ended)

        # Cohort with future end date
        future_end_cohort = Cohort.objects.create(
            name="Future End Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.future_date,
        )
        self.assertFalse(future_end_cohort.is_ended)

        # Cohort with past end date
        past_end_cohort = Cohort.objects.create(
            name="Past End Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.today - timedelta(days=1),
        )
        self.assertTrue(past_end_cohort.is_ended)

    def test_is_current_property(self):
        """Test is_current property."""
        # Future cohort
        future_cohort = Cohort.objects.create(
            name="Future Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )
        self.assertFalse(future_cohort.is_current)

        # Current cohort
        current_cohort = Cohort.objects.create(
            name="Current Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.future_date,
        )
        self.assertTrue(current_cohort.is_current)

        # Past cohort
        past_cohort = Cohort.objects.create(
            name="Past Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.today - timedelta(days=1),
        )
        self.assertFalse(past_cohort.is_current)

        # Cohort without end date that has started
        no_end_current_cohort = Cohort.objects.create(
            name="No End Current Cohort",
            program_type="diploma",
            start_date=self.past_date,
        )
        self.assertTrue(no_end_current_cohort.is_current)

    def test_duration_days_property(self):
        """Test duration_days property."""
        # Cohort with both dates
        cohort_with_dates = Cohort.objects.create(
            name="Cohort With Dates",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=30),
        )
        self.assertEqual(cohort_with_dates.duration_days, 30)

        # Cohort without end date
        cohort_no_end = Cohort.objects.create(
            name="Cohort No End",
            program_type="certificate",
            start_date=self.future_date,
        )
        self.assertIsNone(cohort_no_end.duration_days)

    def test_enrolled_students_count_property(self):
        """Test enrolled_students_count property."""
        cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )

        # Initially no students
        self.assertEqual(cohort.enrolled_students_count, 0)

        # Add a student
        Enrollment.objects.create(student=self.student, cohort=cohort)
        self.assertEqual(cohort.enrolled_students_count, 1)

    def test_clean_method_end_date_validation(self):
        """Test clean method validates end date is after start date."""
        cohort = Cohort(
            name="Invalid Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.future_date - timedelta(days=1),  # End before start
        )

        with self.assertRaises(DRFValidationError) as context:
            cohort.clean()

        self.assertIn(
            "End date must be after start date", str(context.exception)
        )

    def test_clean_method_cannot_activate_ended_cohort(self):
        """Test clean method prevents activating ended cohorts."""
        cohort = Cohort(
            name="Ended Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.today - timedelta(days=1),
            is_active=True,
        )

        with self.assertRaises(DRFValidationError) as context:
            cohort.clean()

        self.assertIn(
            "Cannot activate a cohort that has already ended",
            str(context.exception),
        )

    def test_save_calls_clean(self):
        """Test that save method calls clean."""
        with self.assertRaises(DRFValidationError):
            Cohort.objects.create(
                name="Invalid Cohort",
                program_type="certificate",
                start_date=self.future_date,
                end_date=self.future_date - timedelta(days=1),
            )

    def test_can_be_deleted_with_enrolled_students(self):
        """Test can_be_deleted returns False when cohort has enrolled students."""
        cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
        )

        Enrollment.objects.create(student=self.student, cohort=cohort)

        can_delete, message = cohort.can_be_deleted()

        self.assertFalse(can_delete)
        self.assertEqual(message, "Cannot delete cohort with enrolled students")

    def test_can_be_deleted_active_cohort(self):
        """Test can_be_deleted returns False for active cohorts."""
        cohort = Cohort.objects.create(
            name="Active Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
            is_active=True,
        )

        can_delete, message = cohort.can_be_deleted()

        self.assertFalse(can_delete)
        self.assertEqual(message, "Cannot delete active cohort")

    def test_can_be_deleted_started_cohort(self):
        """Test can_be_deleted returns False for started cohorts."""
        cohort = Cohort.objects.create(
            name="Started Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.future_date,
        )

        can_delete, message = cohort.can_be_deleted()

        self.assertFalse(can_delete)
        self.assertEqual(
            message, "Cannot delete cohort that has already started"
        )

    def test_can_be_deleted_success(self):
        """Test can_be_deleted returns True for deletable cohorts."""
        cohort = Cohort.objects.create(
            name="Deletable Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
            is_active=False,
        )

        can_delete, message = cohort.can_be_deleted()

        self.assertTrue(can_delete)
        self.assertEqual(message, "Cohort can be deleted")

    def test_can_be_archived_inactive_cohort(self):
        """Test can_be_archived returns False for inactive cohorts."""
        cohort = Cohort.objects.create(
            name="Inactive Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
            is_active=False,
        )

        can_archive, message = cohort.can_be_archived()

        self.assertFalse(can_archive)
        self.assertEqual(message, "Cannot archive inactive cohort")

    def test_can_be_archived_success(self):
        """Test can_be_archived returns True for active cohorts."""
        cohort = Cohort.objects.create(
            name="Active Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.future_date,
            is_active=True,
        )

        can_archive, message = cohort.can_be_archived()

        self.assertTrue(can_archive)
        self.assertEqual(message, "Cohort can be archived")

    def test_archive_method_success(self):
        """Test successful cohort archiving."""
        cohort = Cohort.objects.create(
            name="Active Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.future_date,
            is_active=True,
        )

        archived_cohort = cohort.archive()

        self.assertEqual(archived_cohort, cohort)
        self.assertFalse(cohort.is_active)
        self.assertEqual(cohort.end_date, self.today)

    def test_archive_method_inactive_cohort(self):
        """Test archiving inactive cohort raises ValidationError."""
        cohort = Cohort.objects.create(
            name="Inactive Cohort",
            program_type="certificate",
            start_date=self.future_date,
            end_date=self.far_future_date,
            is_active=False,
        )

        with self.assertRaises(DRFValidationError) as context:
            cohort.archive()

        self.assertIn("Cannot archive inactive cohort", str(context.exception))

    def test_program_type_choices(self):
        """Test that program_type uses User.PROGRAM_TYPES choices."""
        # Test valid program types
        for program_type, _ in User.PROGRAM_TYPES:
            cohort = Cohort.objects.create(
                name=f"Test {program_type} Cohort",
                program_type=program_type,
                start_date=self.future_date,
                end_date=self.far_future_date,
            )
            self.assertEqual(cohort.program_type, program_type)


class EnrollmentModelTestCase(TestCase):
    """Test cases for the Enrollment model."""

    def setUp(self):
        self.today = timezone.now().date()
        self.past_date = self.today - timedelta(days=30)
        self.future_date = self.today + timedelta(days=30)

        # Create test users
        self.student1 = User.objects.create_user(
            email="student1@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Student1",
            role="student",
        )

        self.student2 = User.objects.create_user(
            email="student2@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Student2",
            role="student",
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.past_date,
            end_date=self.future_date,
        )

    def test_create_enrollment_success(self):
        """Test successful enrollment creation."""
        enrollment = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort
        )

        self.assertEqual(enrollment.student, self.student1)
        self.assertEqual(enrollment.cohort, self.cohort)
        self.assertIsNotNone(enrollment.enrolled_at)
        self.assertEqual(enrollment.end_date, self.cohort.end_date)

    def test_enrollment_string_representation(self):
        """Test enrollment string representation."""
        enrollment = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort
        )

        expected_str = f"{self.student1.email} - {self.cohort.name}"
        self.assertEqual(str(enrollment), expected_str)

    def test_enrollment_unique_constraint(self):
        """Test that student-cohort combination must be unique."""
        Enrollment.objects.create(student=self.student1, cohort=self.cohort)

        with self.assertRaises(IntegrityError):
            Enrollment.objects.create(student=self.student1, cohort=self.cohort)

    def test_multiple_students_same_cohort_allowed(self):
        """Test that multiple students can enroll in the same cohort."""
        enrollment1 = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort
        )

        enrollment2 = Enrollment.objects.create(
            student=self.student2, cohort=self.cohort
        )

        self.assertEqual(enrollment1.cohort, enrollment2.cohort)
        self.assertNotEqual(enrollment1.student, enrollment2.student)

    def test_same_student_multiple_cohorts_allowed(self):
        """Test that the same student can enroll in multiple cohorts."""
        cohort2 = Cohort.objects.create(
            name="Second Cohort",
            program_type="diploma",
            start_date=self.past_date,
            end_date=self.future_date,
        )

        enrollment1 = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort
        )

        enrollment2 = Enrollment.objects.create(
            student=self.student1, cohort=cohort2
        )

        self.assertEqual(enrollment1.student, enrollment2.student)
        self.assertNotEqual(enrollment1.cohort, enrollment2.cohort)

    def test_enrollment_ordering(self):
        """Test that enrollments are ordered by enrolled_at descending."""
        enrollment1 = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort
        )

        # Create second enrollment slightly later
        enrollment2 = Enrollment.objects.create(
            student=self.student2, cohort=self.cohort
        )

        enrollments = list(Enrollment.objects.all())
        # More recent enrollment should come first
        self.assertEqual(enrollments[0], enrollment2)
        self.assertEqual(enrollments[1], enrollment1)

    def test_enrollment_defaults_end_date_to_cohort_end_date(self):
        """Test that enrollment end_date defaults to cohort's end_date."""
        enrollment = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort
        )

        self.assertEqual(enrollment.end_date, self.cohort.end_date)

    def test_enrollment_custom_end_date(self):
        """Test enrollment with custom end date."""
        custom_end_date = self.future_date - timedelta(days=10)

        enrollment = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort, end_date=custom_end_date
        )

        self.assertEqual(enrollment.end_date, custom_end_date)

    def test_clean_method_end_date_after_enrollment(self):
        """Test clean method validates end_date is after enrolled_at."""
        past_enrollment_time = timezone.now() - timedelta(days=10)

        enrollment = Enrollment(
            student=self.student1,
            cohort=self.cohort,
            enrolled_at=past_enrollment_time,
            end_date=past_enrollment_time.date() - timedelta(days=1),
        )

        with self.assertRaises(DRFValidationError) as context:
            enrollment.clean()

        self.assertIn(
            "End date must be after enrollment date", str(context.exception)
        )

    def test_save_calls_clean(self):
        """Test that save method calls clean."""
        past_enrollment_time = timezone.now() - timedelta(days=10)

        with self.assertRaises(DRFValidationError):
            Enrollment.objects.create(
                student=self.student1,
                cohort=self.cohort,
                enrolled_at=past_enrollment_time,
                end_date=past_enrollment_time.date() - timedelta(days=1),
            )

    def test_enrollment_with_cohort_without_end_date(self):
        """Test enrollment in cohort without end date."""
        cohort_no_end = Cohort.objects.create(
            name="No End Cohort",
            program_type="certificate",
            start_date=self.past_date,
        )

        enrollment = Enrollment.objects.create(
            student=self.student1, cohort=cohort_no_end
        )

        self.assertIsNone(enrollment.end_date)

    def test_enrollment_auto_sets_enrolled_at(self):
        """Test that enrolled_at is automatically set if not provided."""
        enrollment = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort
        )

        self.assertIsNotNone(enrollment.enrolled_at)
        # Should be within the last few seconds
        time_diff = timezone.now() - enrollment.enrolled_at
        self.assertLess(time_diff.total_seconds(), 10)

    def test_enrollment_related_names(self):
        """Test related names work correctly."""
        enrollment = Enrollment.objects.create(
            student=self.student1, cohort=self.cohort
        )

        # Test student.enrollments
        student_enrollments = self.student1.enrollments.all()
        self.assertIn(enrollment, student_enrollments)

        # Test cohort.enrollments
        cohort_enrollments = self.cohort.enrollments.all()
        self.assertIn(enrollment, cohort_enrollments)
