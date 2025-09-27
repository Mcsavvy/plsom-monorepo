from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta

from apps.cohorts.models import Cohort, Enrollment

User = get_user_model() 


class CohortViewSetTestCase(APITestCase):
    """Test cases for CohortViewSet."""

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.now().date()
        self.past_date = self.today - timedelta(days=31)
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
        
        self.lecturer = User.objects.create_user(
            email='lecturer@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Lecturer',
            role='lecturer'
        )
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Admin',
            role='admin'
        )

        # Create test cohorts
        self.cohort1 = Cohort.objects.create(
            name='Test Cohort 1',
            program_type='certificate',
            start_date=self.future_date,
            end_date=self.far_future_date
        )
        
        self.cohort2 = Cohort.objects.create(
            name='Test Cohort 2',
            program_type='diploma',
            start_date=self.future_date + timedelta(days=5),
            end_date=self.far_future_date + timedelta(days=5)
        )
        
        self.active_cohort = Cohort.objects.create(
            name='Active Cohort',
            program_type='certificate',
            start_date=self.past_date,
            end_date=self.today,
            is_active=True
        )

        # Enroll student in cohort1
        self.enrollment = Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort1
        )

    def test_list_cohorts_as_admin(self):
        """Test listing cohorts as admin sees all cohorts."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/cohorts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_list_cohorts_as_lecturer(self):
        """Test listing cohorts as lecturer sees all cohorts."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.get('/api/cohorts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_list_cohorts_as_student(self):
        """Test listing cohorts as student sees only enrolled cohorts."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get('/api/cohorts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.cohort1.id)

    def test_list_cohorts_unauthenticated(self):
        """Test listing cohorts without authentication."""
        response = self.client.get('/api/cohorts/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_cohort_as_admin(self):
        """Test retrieving specific cohort as admin."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/cohorts/{self.cohort1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.cohort1.id)
        self.assertEqual(response.data['name'], 'Test Cohort 1')

    def test_retrieve_cohort_as_student_enrolled(self):
        """Test retrieving cohort student is enrolled in."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/cohorts/{self.cohort1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.cohort1.id)

    def test_retrieve_cohort_as_student_not_enrolled(self):
        """Test retrieving cohort student is not enrolled in."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/cohorts/{self.cohort2.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_cohort_as_admin_success(self):
        """Test creating cohort as admin."""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'name': 'New Cohort',
            'program_type': 'certificate',
            'start_date': self.far_future_date + timedelta(days=1),
            'end_date': self.far_future_date + timedelta(days=31)
        }
        
        response = self.client.post('/api/cohorts/', data)
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Cohort')
        
        # Verify cohort was created in database
        self.assertTrue(Cohort.objects.filter(name='New Cohort').exists())

    def test_create_cohort_as_lecturer_forbidden(self):
        """Test creating cohort as lecturer is forbidden."""
        self.client.force_authenticate(user=self.lecturer)
        
        data = {
            'name': 'New Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date + timedelta(days=10),
            'end_date': self.far_future_date + timedelta(days=10)
        }
        
        response = self.client.post('/api/cohorts/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_cohort_as_student_forbidden(self):
        """Test creating cohort as student is forbidden."""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'name': 'New Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date + timedelta(days=10),
            'end_date': self.far_future_date + timedelta(days=10)
        }
        
        response = self.client.post('/api/cohorts/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_cohort_overlapping_dates(self):
        """Test creating cohort with overlapping dates fails."""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'name': 'Overlapping Cohort',
            'program_type': 'certificate',
            'start_date': self.future_date - timedelta(days=5),
            'end_date': self.future_date + timedelta(days=40)  # Overlaps with cohort1
        }
        
        response = self.client.post('/api/cohorts/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('overlap', str(response.data))

    def test_create_cohort_duplicate_name_same_program(self):
        """Test creating cohort with duplicate name in same program fails."""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'name': 'Test Cohort 1',  # Same name as existing cohort
            'program_type': 'certificate',  # Same program type
            'start_date': self.future_date + timedelta(days=100),
            'end_date': self.far_future_date + timedelta(days=100)
        }
        
        response = self.client.post('/api/cohorts/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_cohort_as_admin_success(self):
        """Test updating cohort as admin."""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'name': 'Updated Cohort Name',
            'program_type': 'diploma',
            'start_date': self.far_future_date + timedelta(days=30),
            'end_date': self.far_future_date + timedelta(days=61)
        }
        
        response = self.client.put(f'/api/cohorts/{self.cohort1.id}/', data)
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Cohort Name')
        self.assertEqual(response.data['program_type'], 'diploma')

    def test_partial_update_cohort_as_admin(self):
        """Test partial update of cohort as admin."""
        self.client.force_authenticate(user=self.admin)
        
        data = {'name': 'Partially Updated Name'}
        
        response = self.client.patch(f'/api/cohorts/{self.cohort1.id}/', data)

        print(response.data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Partially Updated Name')
        self.assertEqual(response.data['program_type'], 'certificate')  # Unchanged

    def test_update_cohort_as_lecturer_forbidden(self):
        """Test updating cohort as lecturer is forbidden."""
        self.client.force_authenticate(user=self.lecturer)
        
        data = {'name': 'Updated Name'}
        
        response = self.client.patch(f'/api/cohorts/{self.cohort1.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_cohort_as_admin_success(self):
        """Test deleting cohort as admin."""
        # Create a cohort that can be deleted (no enrollments, not active, not started)
        deletable_cohort = Cohort.objects.create(
            name='Deletable Cohort',
            program_type='certificate',
            start_date=self.future_date + timedelta(days=10),
            end_date=self.far_future_date + timedelta(days=10),
            is_active=False
        )
        
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.delete(f'/api/cohorts/{deletable_cohort.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Cohort.objects.filter(id=deletable_cohort.id).exists())

    def test_delete_cohort_with_enrollments_fails(self):
        """Test deleting cohort with enrollments fails."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.delete(f'/api/cohorts/{self.cohort1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('enrolled students', str(response.data))

    def test_delete_active_cohort_fails(self):
        """Test deleting active cohort fails."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.delete(f'/api/cohorts/{self.active_cohort.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('active cohort', str(response.data))

    def test_delete_started_cohort_fails(self):
        """Test deleting started cohort fails."""
        # Create a started cohort without enrollments
        started_cohort = Cohort.objects.create(
            name='Started Cohort',
            program_type='certificate',
            start_date=self.past_date,
            end_date=self.future_date,
            is_active=False
        )
        
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.delete(f'/api/cohorts/{started_cohort.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already started', str(response.data))

    def test_delete_cohort_as_lecturer_forbidden(self):
        """Test deleting cohort as lecturer is forbidden."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.delete(f'/api/cohorts/{self.cohort1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_current_cohorts_endpoint(self):
        """Test current cohorts endpoint returns active cohorts."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get('/api/cohorts/current/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.active_cohort.id)

    def test_current_cohorts_unauthenticated(self):
        """Test current cohorts endpoint requires authentication."""
        response = self.client.get('/api/cohorts/current/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_my_cohort_as_student(self):
        """Test my-cohort endpoint for student."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get('/api/cohorts/my-cohort/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.cohort1.id)

    def test_my_cohort_as_student_not_enrolled(self):
        """Test my-cohort endpoint for student not enrolled."""
        unenrolled_student = User.objects.create_user(
            email='unenrolled@example.com',
            password='testpassword123',
            role='student'
        )
        
        self.client.force_authenticate(user=unenrolled_student)
        
        response = self.client.get('/api/cohorts/my-cohort/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('not enrolled', str(response.data))

    def test_my_cohort_as_non_student(self):
        """Test my-cohort endpoint for non-student user."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.get('/api/cohorts/my-cohort/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('only available for students', str(response.data))

    def test_archive_cohort_as_admin_success(self):
        """Test archiving cohort as admin."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/cohorts/{self.active_cohort.id}/archive/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify cohort was archived
        self.active_cohort.refresh_from_db()
        self.assertFalse(self.active_cohort.is_active)
        self.assertEqual(self.active_cohort.end_date, self.today)

    def test_archive_inactive_cohort_fails(self):
        """Test archiving inactive cohort fails."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(f'/api/cohorts/{self.cohort1.id}/archive/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot archive inactive cohort', str(response.data))

    def test_archive_cohort_as_lecturer_forbidden(self):
        """Test archiving cohort as lecturer is forbidden."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.post(f'/api/cohorts/{self.active_cohort.id}/archive/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cohort_ordering(self):
        """Test that cohorts are ordered by start_date descending."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/cohorts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check ordering (most recent start_date first)
        results = response.data['results']
        start_dates = [result['start_date'] for result in results]
        
        # Convert to date objects for comparison
        start_dates = [timezone.datetime.strptime(date_str, '%Y-%m-%d').date() for date_str in start_dates]
        
        # Should be in descending order
        self.assertEqual(start_dates, sorted(start_dates, reverse=True))


class EnrollmentViewSetTestCase(APITestCase):
    """Test cases for EnrollmentViewSet."""

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.now().date()
        self.past_date = self.today - timedelta(days=30)
        self.future_date = self.today + timedelta(days=30)

        # Create test users
        self.student1 = User.objects.create_user(
            email='student1@example.com',
            password='testpassword123',
            first_name='Student',
            last_name='One',
            role='student'
        )
        
        self.student2 = User.objects.create_user(
            email='student2@example.com',
            password='testpassword123',
            first_name='Student',
            last_name='Two',
            role='student'
        )
        
        self.lecturer = User.objects.create_user(
            email='lecturer@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Lecturer',
            role='lecturer'
        )
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Admin',
            role='admin'
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=self.past_date,
            end_date=self.future_date
        )

        # Create enrollments
        self.enrollment1 = Enrollment.objects.create(
            student=self.student1,
            cohort=self.cohort
        )
        
        self.enrollment2 = Enrollment.objects.create(
            student=self.student2,
            cohort=self.cohort
        )

    def test_list_enrollments_as_admin(self):
        """Test listing enrollments as admin sees all enrollments."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_list_enrollments_as_lecturer(self):
        """Test listing enrollments as lecturer sees all enrollments."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.get('/api/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_list_enrollments_as_student(self):
        """Test listing enrollments as student sees only own enrollments."""
        self.client.force_authenticate(user=self.student1)
        
        response = self.client.get('/api/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.enrollment1.id)

    def test_list_enrollments_unauthenticated(self):
        """Test listing enrollments without authentication."""
        response = self.client.get('/api/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_enrollment_as_admin(self):
        """Test retrieving specific enrollment as admin."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/enrollments/{self.enrollment1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.enrollment1.id)

    def test_retrieve_enrollment_as_student_own(self):
        """Test retrieving own enrollment as student."""
        self.client.force_authenticate(user=self.student1)
        
        response = self.client.get(f'/api/enrollments/{self.enrollment1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.enrollment1.id)

    def test_retrieve_enrollment_as_student_other(self):
        """Test retrieving other student's enrollment as student."""
        self.client.force_authenticate(user=self.student1)
        
        response = self.client.get(f'/api/enrollments/{self.enrollment2.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_enrollment_viewset_is_readonly(self):
        """Test that enrollment viewset is read-only."""
        self.client.force_authenticate(user=self.admin)
        
        # Try to create enrollment
        data = {
            'student': self.student1.id,
            'cohort': self.cohort.id
        }
        response = self.client.post('/api/enrollments/', data)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Try to update enrollment
        data = {'end_date': self.future_date + timedelta(days=10)}
        response = self.client.patch(f'/api/enrollments/{self.enrollment1.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Try to delete enrollment
        response = self.client.delete(f'/api/enrollments/{self.enrollment1.id}/')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_enrollment_ordering(self):
        """Test that enrollments are ordered by enrolled_at descending."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check ordering (most recent enrollment first)
        results = response.data['results']
        self.assertEqual(results[0]['id'], self.enrollment2.id)  # More recent
        self.assertEqual(results[1]['id'], self.enrollment1.id)  # Older

    def test_enrollment_search_by_student_email(self):
        """Test searching enrollments by student email."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/enrollments/?q=student1@example.com')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.enrollment1.id)

    def test_enrollment_search_by_cohort_name(self):
        """Test searching enrollments by cohort name."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/enrollments/?q=Test Cohort')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_enrollment_search_by_student_name(self):
        """Test searching enrollments by student name."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/enrollments/?q=Student')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['id'], self.enrollment2.id)
