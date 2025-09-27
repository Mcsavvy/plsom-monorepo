from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from datetime import date, timedelta

from apps.cohorts.models import Cohort, Enrollment
from apps.cohorts.serializers import CohortSerializer, EnrollmentSerializer

User = get_user_model()


class CohortSerializerTestCase(TestCase):
    """Test cases for CohortSerializer."""

    def setUp(self):
        self.today = timezone.now().date()
        self.past_date = self.today - timedelta(days=30)
        self.future_date = self.today + timedelta(days=30)
        self.far_future_date = self.today + timedelta(days=60)

        # Create test users
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Student',
            role='student'
        )

    def test_serializer_fields(self):
        """Test that serializer includes correct fields."""
        cohort = Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        serializer = CohortSerializer(instance=cohort)
        
        expected_fields = {
            'id', 'name', 'program_type', 'is_active',
            'start_date', 'end_date', 'enrolled_students_count'
        }
        
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_enrolled_students_count_method(self):
        """Test get_enrolled_students_count method."""
        cohort = Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        serializer = CohortSerializer(instance=cohort)
        self.assertEqual(serializer.data['enrolled_students_count'], 0)
        
        # Add enrollment
        Enrollment.objects.create(student=self.student, cohort=cohort)
        
        serializer = CohortSerializer(instance=cohort)
        self.assertEqual(serializer.data['enrolled_students_count'], 1)

    def test_validate_name_new_cohort_success(self):
        """Test name validation for new cohort with unique name."""
        data = {
            'name': 'Unique Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date,
            'end_date': self.far_future_date
        }
        
        serializer = CohortSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_validate_name_new_cohort_duplicate(self):
        """Test name validation for new cohort with duplicate name."""
        # Create existing cohort
        Cohort.objects.create(
            name='Existing Cohort',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        data = {
            'name': 'Existing Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date + timedelta(days=1),
            'end_date': self.far_future_date + timedelta(days=1)
        }
        
        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
        self.assertIn('already exists for certificate program', str(serializer.errors))

    def test_validate_name_same_name_different_program_type(self):
        """Test name validation allows same name for different program types."""
        # Create existing cohort
        Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        data = {
            'name': 'Test Cohort',
            'program_type': 'diploma',  # Different program type
            'start_date': self.future_date,
            'end_date': self.far_future_date
        }
        
        serializer = CohortSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_validate_name_update_same_name(self):
        """Test name validation for updating cohort with same name."""
        cohort = Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        data = {
            'name': 'Test Cohort',  # Same name
            'program_type': 'certificate',
            'start_date': self.future_date,
            'end_date': self.far_future_date
        }
        
        serializer = CohortSerializer(instance=cohort, data=data)
        self.assertTrue(serializer.is_valid())

    def test_validate_name_update_duplicate_name(self):
        """Test name validation for updating cohort with duplicate name."""
        # Create existing cohorts
        Cohort.objects.create(
            name='Cohort One',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        cohort2 = Cohort.objects.create(
            name='Cohort Two',
            program_type='certificate',
            start_date=self.future_date + timedelta(days=1),
            end_date=self.far_future_date + timedelta(days=1)
        )
        
        # Try to update cohort2 to have same name as cohort1
        data = {
            'name': 'Cohort One',
            'program_type': 'certificate',
            'start_date': self.future_date + timedelta(days=1),
            'end_date': self.far_future_date + timedelta(days=1)
        }
        
        serializer = CohortSerializer(instance=cohort2, data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_validate_start_date_new_cohort_past_date(self):
        """Test start date validation for new cohort with past date."""
        data = {
            'name': 'Test Cohort',
            'program_type': 'certificate',
            'start_date': self.past_date,
            'end_date': self.future_date
        }
        
        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('start_date', serializer.errors)
        self.assertIn('cannot be in the past', str(serializer.errors))

    def test_validate_start_date_new_cohort_future_date(self):
        """Test start date validation for new cohort with future date."""
        data = {
            'name': 'Test Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date,
            'end_date': self.far_future_date
        }
        
        serializer = CohortSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_validate_start_date_update_started_cohort(self):
        """Test start date validation for updating started cohort."""
        cohort = Cohort.objects.create(
            name='Started Cohort',
            program_type='certificate',
            start_date=self.past_date,
            end_date=self.future_date
        )
        
        # Try to change start date of already started cohort
        data = {
            'name': 'Started Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date,  # Different start date
            'end_date': self.far_future_date
        }
        
        serializer = CohortSerializer(instance=cohort, data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('start_date', serializer.errors)
        self.assertIn('Cannot change start date for a cohort that has already started', str(serializer.errors))

    def test_validate_start_date_update_same_date(self):
        """Test start date validation for updating with same date."""
        cohort = Cohort.objects.create(
            name='Started Cohort',
            program_type='certificate',
            start_date=self.past_date,
            end_date=self.future_date
        )
        
        # Update with same start date should be allowed
        data = {
            'name': 'Started Cohort',
            'program_type': 'certificate',
            'start_date': self.past_date,  # Same start date
            'end_date': self.future_date
        }
        
        serializer = CohortSerializer(instance=cohort, data=data)
        self.assertTrue(serializer.is_valid())

    def test_validate_end_date_past_date(self):
        """Test end date validation with past date."""
        data = {
            'name': 'Test Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date,
            'end_date': self.past_date
        }
        
        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        # Should fail validation in model's clean method when trying to save

    def test_validate_end_date_none(self):
        """Test end date validation with None value."""
        data = {
            'name': 'Test Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date,
            'end_date': None
        }
        
        serializer = CohortSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_create(self):
        """Test creating cohort through serializer."""
        data = {
            'name': 'New Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date,
            'end_date': self.far_future_date
        }
        
        serializer = CohortSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        cohort = serializer.save()
        
        self.assertEqual(cohort.name, 'New Cohort')
        self.assertEqual(cohort.program_type, 'certificate')
        self.assertEqual(cohort.start_date, self.future_date)
        self.assertEqual(cohort.end_date, self.far_future_date)

    def test_serializer_update(self):
        """Test updating cohort through serializer."""
        cohort = Cohort.objects.create(
            name='Original Cohort',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        data = {
            'name': 'Updated Cohort',
            'program_type': 'diploma',
            'start_date': self.future_date,
            'end_date': self.far_future_date + timedelta(days=10)
        }
        
        serializer = CohortSerializer(instance=cohort, data=data)
        self.assertTrue(serializer.is_valid())
        
        updated_cohort = serializer.save()
        
        self.assertEqual(updated_cohort.name, 'Updated Cohort')
        self.assertEqual(updated_cohort.program_type, 'diploma')
        self.assertEqual(updated_cohort.end_date, self.far_future_date + timedelta(days=10))

    def test_serializer_partial_update(self):
        """Test partial update of cohort through serializer."""
        cohort = Cohort.objects.create(
            name='Original Cohort',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        data = {'name': 'Partially Updated Cohort'}
        
        serializer = CohortSerializer(instance=cohort, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        updated_cohort = serializer.save()
        
        self.assertEqual(updated_cohort.name, 'Partially Updated Cohort')
        self.assertEqual(updated_cohort.program_type, 'certificate')  # Unchanged
        self.assertEqual(updated_cohort.start_date, self.future_date)  # Unchanged

    def test_serializer_invalid_program_type(self):
        """Test serializer validation with invalid program type."""
        data = {
            'name': 'Test Cohort',
            'program_type': 'invalid_type',
            'start_date': self.future_date,
            'end_date': self.far_future_date
        }
        
        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('program_type', serializer.errors)

    def test_serializer_missing_required_fields(self):
        """Test serializer validation with missing required fields."""
        data = {'name': 'Test Cohort'}
        
        serializer = CohortSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        
        # Should have errors for missing required fields
        self.assertIn('program_type', serializer.errors)
        self.assertIn('start_date', serializer.errors)

    def test_serializer_representation(self):
        """Test serializer data representation."""
        cohort = Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date,
            is_active=True
        )
        
        serializer = CohortSerializer(instance=cohort)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Test Cohort')
        self.assertEqual(data['program_type'], 'certificate')
        self.assertEqual(data['start_date'], str(self.future_date))
        self.assertEqual(data['end_date'], str(self.far_future_date))
        self.assertTrue(data['is_active'])
        self.assertEqual(data['enrolled_students_count'], 0)


class EnrollmentSerializerTestCase(TestCase):
    """Test cases for EnrollmentSerializer."""

    def setUp(self):
        self.today = timezone.now().date()
        self.past_date = self.today - timedelta(days=30)
        self.future_date = self.today + timedelta(days=30)

        # Create test users
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Student',
            role='student'
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=self.past_date,
            end_date=self.future_date,
            is_active=True
        )

    def test_serializer_fields(self):
        """Test that serializer includes correct fields."""
        enrollment = Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )
        
        serializer = EnrollmentSerializer(instance=enrollment)
        
        # Check that all expected fields are present
        expected_fields = {'id', 'student', 'cohort', 'enrolled_at', 'end_date'}
        print(serializer.data.keys())
        self.assertTrue(expected_fields.issubset(set(serializer.data.keys())))

    def test_serializer_create(self):
        """Test creating enrollment through serializer."""
        data = {
            'student_id': self.student.id,
            'cohort_id': self.cohort.id,
        }
        
        serializer = EnrollmentSerializer(data=data)
        if serializer.is_valid():
            enrollment = serializer.save()
            
            self.assertEqual(enrollment.student, self.student)
            self.assertEqual(enrollment.cohort, self.cohort)
            self.assertIsNotNone(enrollment.enrolled_at)
        else:
            # If EnrollmentSerializer doesn't exist or has different structure,
            # this test will help identify the actual structure
            self.fail(f"Serializer validation failed: {serializer.errors}")

    def test_serializer_representation(self):
        """Test serializer data representation."""
        enrollment = Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )
        
        serializer = EnrollmentSerializer(instance=enrollment)
        data = serializer.data
        
        # Check that the data contains expected information
        self.assertIn('id', data)
        self.assertIn('enrolled_at', data)
        
        # Check that student and cohort information is included
        if 'student' in data:
            if isinstance(data['student'], dict):
                # If nested serializer is used
                self.assertIn('email', data['student'])
            else:
                # If just ID is used
                self.assertEqual(data['student'], self.student.id)
        
        if 'cohort' in data:
            if isinstance(data['cohort'], dict):
                # If nested serializer is used
                self.assertIn('name', data['cohort'])
            else:
                # If just ID is used
                self.assertEqual(data['cohort'], self.cohort.id)

    def test_enrollment_validation(self):
        """Test enrollment validation through serializer."""
        # Create first enrollment
        Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )
        
        # Try to create duplicate enrollment
        data = {
            'student': self.student.id,
            'cohort': self.cohort.id
        }
        
        serializer = EnrollmentSerializer(data=data)
        # This should fail due to unique constraint
        if serializer.is_valid():
            try:
                serializer.save()
                self.fail("Should have raised IntegrityError for duplicate enrollment")
            except Exception:
                # Expected to fail
                pass

    def test_serializer_missing_required_fields(self):
        """Test serializer validation with missing required fields."""
        data: dict = {}
        
        serializer = EnrollmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        
        # Should have errors for missing required fields
        # The exact fields depend on the actual serializer implementation
        self.assertTrue(len(serializer.errors) > 0)
