from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta

from apps.classes.models import Class, Attendance
from apps.courses.models import Course
from apps.cohorts.models import Cohort, Enrollment

User = get_user_model()


class ClassJoinTestCase(APITestCase):
    """Test cases for class joining functionality."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()
        
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

        # Create test course
        self.course = Course.objects.create(
            name='Test Course',
            description='Test course description',
            module_count=1
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name='Test Cohort',
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type='certificate'
        )

        # Enroll student in cohort
        Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )

        # Create test class
        self.class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Test Class',
            description='Test class description',
            scheduled_at=self.now + timedelta(minutes=10),  # Class starts in 10 minutes
            duration_minutes=90,
            zoom_join_url='https://zoom.us/j/123456789',
            password_for_zoom='testpass'
        )

    def test_student_join_class_creates_attendance(self):
        """Test that joining a class creates an attendance record."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/classes/{self.class_obj.id}/join/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['can_join'])
        self.assertTrue(response.data['attendance_registered'])
        
        # Check that attendance record was created
        attendance = Attendance.objects.get(
            class_session=self.class_obj,
            student=self.student
        )
        self.assertIsNotNone(attendance)
        self.assertEqual(attendance.join_time.date(), self.now.date())
        # Leave time should be set to class end time
        expected_leave_time = self.class_obj.scheduled_at + timedelta(minutes=self.class_obj.duration_minutes)
        self.assertEqual(attendance.leave_time, expected_leave_time)
        # Duration should be calculated (remaining time for live class)
        self.assertGreater(attendance.duration_minutes, 0)
        self.assertLessEqual(attendance.duration_minutes, self.class_obj.duration_minutes)

    def test_student_rejoin_class_does_not_update_join_time(self):
        """Test that rejoining a class does not update the join_time."""
        self.client.force_authenticate(user=self.student)
        
        # First join
        response1 = self.client.get(f'/api/classes/{self.class_obj.id}/join/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertTrue(response1.data['attendance_registered'])
        
        # Get the original join time
        attendance = Attendance.objects.get(
            class_session=self.class_obj,
            student=self.student
        )
        original_join_time = attendance.join_time
        
        # Wait a bit to ensure time difference
        import time
        time.sleep(1)
        
        # Rejoin the class
        response2 = self.client.get(f'/api/classes/{self.class_obj.id}/join/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertFalse(response2.data['attendance_registered'])
        
        # Check that join_time was not updated
        attendance.refresh_from_db()
        self.assertEqual(attendance.join_time, original_join_time)
        # Leave time should still be set to class end time
        expected_leave_time = self.class_obj.scheduled_at + timedelta(minutes=self.class_obj.duration_minutes)
        self.assertEqual(attendance.leave_time, expected_leave_time)

    def test_student_cannot_join_class_outside_window(self):
        """Test that student cannot join class outside the join window."""
        # Create a class that's in the past
        past_class = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Past Class',
            description='Past class description',
            scheduled_at=self.now - timedelta(hours=2),  # Class was 2 hours ago
            duration_minutes=90,
            zoom_join_url='https://zoom.us/j/123456789',
            password_for_zoom='testpass'
        )
        
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/classes/{past_class.id}/join/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['can_join'])
        self.assertFalse(response.data['attendance_registered'])

    def test_student_can_join_class_with_recording(self):
        """Test that student can join a past class if recording is available."""
        # Create a class that's in the past with recording
        past_class = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Past Class with Recording',
            description='Past class with recording',
            scheduled_at=self.now - timedelta(hours=2),  # Class was 2 hours ago
            duration_minutes=90,
            recording_url='https://example.com/recording',
            password_for_recording='recordingpass'
        )
        
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/classes/{past_class.id}/join/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['can_join'])
        self.assertTrue(response.data['attendance_registered'])
        self.assertEqual(response.data['recording_url'], 'https://example.com/recording')
        
        # Check that attendance record was created with via_recording=True
        attendance = Attendance.objects.get(
            class_session=past_class,
            student=self.student
        )
        self.assertTrue(attendance.via_recording)
        # Leave time should be set to class end time even for recordings
        expected_leave_time = past_class.scheduled_at + timedelta(minutes=past_class.duration_minutes)
        self.assertEqual(attendance.leave_time, expected_leave_time)
        # Duration should be full class duration for recordings
        self.assertEqual(attendance.duration_minutes, past_class.duration_minutes)


class ClassViewSetTestCase(APITestCase):
    """Test cases for ClassViewSet."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()
        
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

        # Create test course
        self.course = Course.objects.create(
            name='Test Course',
            description='Test course description',
            module_count=1,
            program_type='certificate'
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name='Test Cohort',
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type='certificate'
        )

        # Enroll student in cohort
        Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )

        # Create test class
        self.class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Test Class',
            description='Test class description',
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90,
            zoom_join_url='https://zoom.us/j/123456789',
            password_for_zoom='testpass'
        )

    def test_list_classes_as_student(self):
        """Test listing classes as a student."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get('/api/classes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Class')

    def test_list_classes_as_lecturer(self):
        """Test listing classes as a lecturer."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.get('/api/classes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_classes_as_admin(self):
        """Test listing classes as an admin."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/classes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_retrieve_class_as_student(self):
        """Test retrieving a class as a student."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/classes/{self.class_obj.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Class')

    def test_retrieve_class_as_lecturer(self):
        """Test retrieving a class as a lecturer."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.get(f'/api/classes/{self.class_obj.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Class')

    def test_create_class_as_admin(self):
        """Test creating a class as an admin."""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'course_id': self.course.id,
            'lecturer_id': self.lecturer.id,
            'cohort_id': self.cohort.id,
            'title': 'New Class',
            'description': 'New class description',
            'scheduled_at': (self.now + timedelta(hours=2)).isoformat(),
            'duration_minutes': 120,
            'zoom_join_url': 'https://zoom.us/j/987654321',
            'password_for_zoom': 'newpass'
        }
        
        response = self.client.post('/api/classes/', data)
        
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Class')
        self.assertEqual(Class.objects.count(), 2)

    def test_create_class_as_student_forbidden(self):
        """Test that students cannot create classes."""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'course_id': self.course.id,
            'lecturer_id': self.lecturer.id,
            'cohort_id': self.cohort.id,
            'title': 'Unauthorized Class',
            'scheduled_at': (self.now + timedelta(hours=2)).isoformat(),
            'duration_minutes': 90
        }
        
        response = self.client.post('/api/classes/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_class_as_lecturer(self):
        """Test updating a class as a lecturer."""
        self.client.force_authenticate(user=self.lecturer)
        
        data = {
            'title': 'Updated Class Title',
            'description': 'Updated description',
            'duration_minutes': 120
        }
        
        response = self.client.patch(f'/api/classes/{self.class_obj.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Class Title')
        self.assertEqual(response.data['duration_minutes'], 120)

    def test_update_class_as_student_forbidden(self):
        """Test that students cannot update classes."""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'title': 'Unauthorized Update'
        }
        
        response = self.client.patch(f'/api/classes/{self.class_obj.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_recording_link_after_class_completion(self):
        """Test that recording links can be updated after class completion."""
        # Create a past class
        past_class = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Past Class',
            scheduled_at=self.now - timedelta(hours=2),  # 2 hours ago
            duration_minutes=90
        )
        
        self.client.force_authenticate(user=self.lecturer)
        
        # Update recording URL
        data = {
            'recording_url': 'https://example.com/recording.mp4',
            'password_for_recording': 'recording123'
        }
        
        response = self.client.patch(f'/api/classes/{past_class.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['recording_url'], 'https://example.com/recording.mp4')
        self.assertEqual(response.data['password_for_recording'], 'recording123')
        
        # Verify the update was saved
        past_class.refresh_from_db()
        self.assertEqual(past_class.recording_url, 'https://example.com/recording.mp4')
        self.assertEqual(past_class.password_for_recording, 'recording123')

    def test_update_restricted_fields_after_class_completion(self):
        """Test that restricted fields cannot be updated after class completion."""
        # Create a past class
        past_class = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Past Class',
            scheduled_at=self.now - timedelta(hours=2),  # 2 hours ago
            duration_minutes=90
        )
        
        self.client.force_authenticate(user=self.lecturer)
        
        # Try to update restricted fields
        data = {
            'scheduled_at': self.now + timedelta(hours=1),  # Try to reschedule
            'duration_minutes': 120,  # Try to change duration
            'course_id': self.course.id,  # Try to change course
            'recording_url': 'https://example.com/recording.mp4'  # This should be allowed
        }
        
        response = self.client.patch(f'/api/classes/{past_class.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('For past classes, only the following fields can be updated', str(response.data))

    def test_update_allowed_fields_after_class_completion(self):
        """Test that allowed fields can be updated after class completion."""
        # Create a past class
        past_class = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Past Class',
            scheduled_at=self.now - timedelta(hours=2),  # 2 hours ago
            duration_minutes=90
        )
        
        self.client.force_authenticate(user=self.lecturer)
        
        # Update only allowed fields
        data = {
            'title': 'Updated Past Class Title',
            'description': 'Updated description for past class',
            'recording_url': 'https://example.com/recording.mp4',
            'password_for_recording': 'recording123'
        }
        
        response = self.client.patch(f'/api/classes/{past_class.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Past Class Title')
        self.assertEqual(response.data['description'], 'Updated description for past class')
        self.assertEqual(response.data['recording_url'], 'https://example.com/recording.mp4')
        self.assertEqual(response.data['password_for_recording'], 'recording123')

    def test_delete_class_as_admin(self):
        """Test deleting a class as an admin."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.delete(f'/api/classes/{self.class_obj.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Class.objects.count(), 0)

    def test_student_cannot_see_other_cohort_classes(self):
        """Test that students only see classes from their enrolled cohorts."""
        # Create another cohort and class
        other_cohort = Cohort.objects.create(
            name='Other Cohort',
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type='certificate'
        )
        
        Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=other_cohort,
            title='Other Class',
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90
        )
        
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get('/api/classes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Class')

    def test_class_filtering_by_cohort(self):
        """Test filtering classes by cohort."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/classes/?cohort={self.cohort.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_class_filtering_by_course(self):
        """Test filtering classes by course."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/classes/?course={self.course.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_class_filtering_by_lecturer(self):
        """Test filtering classes by lecturer."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/classes/?lecturer={self.lecturer.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class AttendanceViewSetTestCase(APITestCase):
    """Test cases for AttendanceViewSet."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()
        
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

        # Create test course
        self.course = Course.objects.create(
            name='Test Course',
            description='Test course description',
            module_count=1
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name='Test Cohort',
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type='certificate'
        )

        # Enroll student in cohort
        Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )

        # Create test class
        self.class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Test Class',
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90
        )

        # Create test attendance
        self.attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            leave_time=self.now + timedelta(hours=1, minutes=30),
            duration_minutes=90,
            verified=False
        )

    def test_list_attendances_as_admin(self):
        """Test listing attendances as an admin."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/attendance/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_attendances_as_lecturer(self):
        """Test listing attendances as a lecturer."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.get('/api/attendance/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_retrieve_attendance_as_admin(self):
        """Test retrieving an attendance as an admin."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/attendance/{self.attendance.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.attendance.id)

    def test_retrieve_attendance_as_lecturer(self):
        """Test retrieving an attendance as a lecturer."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.get(f'/api/attendance/{self.attendance.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.attendance.id)

    def test_create_attendance_as_admin(self):
        """Test creating an attendance as an admin."""
        self.client.force_authenticate(user=self.admin)

        self.attendance.delete()
        
        data = {
            'class_session_id': self.class_obj.id,
            'student_id': self.student.id,
            'join_time': self.now.isoformat(),
            'leave_time': (self.now + timedelta(hours=1)).isoformat(),
            'duration_minutes': 60,
            'via_recording': False
        }
        
        response = self.client.post('/api/attendance/', data)
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Attendance.objects.count(), 1)

    def test_create_attendance_as_student_forbidden(self):
        """Test that students cannot create attendances."""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'class_session_id': self.class_obj.id,
            'student_id': self.student.id,
            'join_time': self.now.isoformat(),
            'duration_minutes': 60
        }
        
        response = self.client.post('/api/attendance/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_verify_attendance_as_lecturer(self):
        """Test verifying an attendance as a lecturer."""
        self.client.force_authenticate(user=self.lecturer)
        
        data = {
            'verified': True,
            'notes': 'Student attended the full class'
        }
        
        response = self.client.patch(f'/api/attendance/{self.attendance.id}/', data)
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.attendance.refresh_from_db()
        self.assertTrue(self.attendance.verified)

    def test_verify_attendance_as_student_forbidden(self):
        """Test that students cannot verify attendances."""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'verified': True,
            'notes': 'Unauthorized verification'
        }
        
        response = self.client.patch(f'/api/attendance/{self.attendance.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unverify_attendance_as_lecturer(self):
        """Test unverifying an attendance as a lecturer."""
        # First verify the attendance
        self.attendance.verified = True
        self.attendance.save()
        
        self.client.force_authenticate(user=self.lecturer)
        
        data = {
            'verified': False,
            'notes': 'Attendance needs review'
        }
        
        response = self.client.patch(f'/api/attendance/{self.attendance.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.attendance.refresh_from_db()
        self.assertFalse(self.attendance.verified)

    def test_class_attendance_summary_as_lecturer(self):
        """Test getting class attendance summary as a lecturer."""
        self.client.force_authenticate(user=self.lecturer)
        
        response = self.client.get(f'/api/attendance/class-summary/?class_id={self.class_obj.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('class_info', response.data)
        self.assertIn('attendance_list', response.data)
        self.assertIn('attendance_summary', response.data)
        self.assertEqual(response.data['class_info']['title'], 'Test Class')

    def test_class_attendance_summary_as_student_forbidden(self):
        """Test that students cannot access class attendance summary."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/attendance/class-summary/?class_id={self.class_obj.id}')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_attendance_filtering_by_class(self):
        """Test filtering attendances by class."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/attendance/?class_session={self.class_obj.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_attendance_filtering_by_student(self):
        """Test filtering attendances by student."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/attendance/?student={self.student.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_attendance_filtering_by_verified_status(self):
        """Test filtering attendances by verified status."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/attendance/?verified=false')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertFalse(response.data['results'][0]['verified'])


class ClassJoinIntegrationTestCase(APITestCase):
    """Integration tests for class joining functionality."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()
        
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

        # Create test course
        self.course = Course.objects.create(
            name='Test Course',
            description='Test course description',
            module_count=1
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name='Test Cohort',
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type='certificate'
        )

        # Enroll student in cohort
        Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )

    def test_join_class_workflow(self):
        """Test the complete class joining workflow."""
        # Create a class that's starting soon
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Live Class',
            scheduled_at=self.now + timedelta(minutes=5),
            duration_minutes=90,
            zoom_join_url='https://zoom.us/j/123456789',
            password_for_zoom='testpass'
        )
        
        self.client.force_authenticate(user=self.student)
        
        # Join the class
        response = self.client.get(f'/api/classes/{class_obj.id}/join/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['can_join'])
        self.assertTrue(response.data['attendance_registered'])
        self.assertEqual(response.data['zoom_join_url'], 'https://zoom.us/j/123456789')
        self.assertEqual(response.data['password_for_zoom'], 'testpass')
        
        # Check that attendance was created
        attendance = Attendance.objects.get(class_session=class_obj, student=self.student)
        self.assertIsNotNone(attendance)
        self.assertEqual(attendance.duration_minutes, 90)  # Full duration since class hasn't started
        self.assertIsNotNone(attendance.leave_time)
        self.assertFalse(attendance.via_recording)

    def test_join_class_recording_workflow(self):
        """Test joining a class via recording."""
        # Create a class that's already finished
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Past Class',
            scheduled_at=self.now - timedelta(hours=2),
            duration_minutes=90,
            recording_url='https://example.com/recording',
            password_for_recording='recordingpass'
        )
        
        self.client.force_authenticate(user=self.student)
        
        # Join the class (access recording)
        response = self.client.get(f'/api/classes/{class_obj.id}/join/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['can_join'])
        self.assertTrue(response.data['attendance_registered'])
        self.assertEqual(response.data['recording_url'], 'https://example.com/recording')
        self.assertEqual(response.data['password_for_recording'], 'recordingpass')
        
        # Check that attendance was created
        attendance = Attendance.objects.get(class_session=class_obj, student=self.student)
        self.assertIsNotNone(attendance)
        self.assertEqual(attendance.duration_minutes, 90)  # Full duration for recordings
        self.assertTrue(attendance.via_recording)

    def test_join_class_outside_window(self):
        """Test joining a class outside the allowed window."""
        # Create a class that's too far in the future
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Future Class',
            scheduled_at=self.now + timedelta(hours=2),
            duration_minutes=90,
            zoom_join_url='https://zoom.us/j/123456789'
        )
        
        self.client.force_authenticate(user=self.student)
        
        # Try to join the class
        response = self.client.get(f'/api/classes/{class_obj.id}/join/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['can_join'])
        self.assertFalse(response.data['attendance_registered'])
        self.assertIn('message', response.data)

    def test_join_class_unauthorized_student(self):
        """Test that unauthorized students cannot join classes."""
        # Create another cohort and class
        other_cohort = Cohort.objects.create(
            name='Other Cohort',
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type='certificate'
        )
        
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=other_cohort,
            title='Other Class',
            scheduled_at=self.now + timedelta(minutes=5),
            duration_minutes=90,
            zoom_join_url='https://zoom.us/j/123456789'
        )
        
        self.client.force_authenticate(user=self.student)
        
        # Try to join the class
        response = self.client.get(f'/api/classes/{class_obj.id}/join/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_join_class_multiple_times(self):
        """Test joining the same class multiple times."""
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title='Test Class',
            scheduled_at=self.now + timedelta(minutes=5),
            duration_minutes=90,
            zoom_join_url='https://zoom.us/j/123456789'
        )
        
        self.client.force_authenticate(user=self.student)
        
        # Join the class first time
        response1 = self.client.get(f'/api/classes/{class_obj.id}/join/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertTrue(response1.data['attendance_registered'])
        
        # Join the class second time
        response2 = self.client.get(f'/api/classes/{class_obj.id}/join/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertFalse(response2.data['attendance_registered'])  # Already registered
        
        # Check that only one attendance record exists
        self.assertEqual(Attendance.objects.filter(class_session=class_obj, student=self.student).count(), 1)
