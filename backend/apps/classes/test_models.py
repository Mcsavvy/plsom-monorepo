from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.classes.models import Class, Attendance
from apps.courses.models import Course
from apps.cohorts.models import Cohort

User = get_user_model()


class ClassModelTestCase(TestCase):
    """Test cases for Class model."""

    def setUp(self):
        self.now = timezone.now()

        # Create test users
        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
        )

        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Admin",
            role="admin",
        )

        # Create test course
        self.course = Course.objects.create(
            name="Test Course",
            description="Test course description",
            module_count=1,
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type="certificate",
        )

    def test_class_creation(self):
        """Test creating a class with all required fields."""
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Test Class",
            description="Test class description",
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90,
            zoom_meeting_id="123456789",
            zoom_join_url="https://zoom.us/j/123456789",
            password_for_zoom="testpass",
            recording_url="https://example.com/recording",
            password_for_recording="recordingpass",
        )

        self.assertEqual(class_obj.course, self.course)
        self.assertEqual(class_obj.lecturer, self.lecturer)
        self.assertEqual(class_obj.cohort, self.cohort)
        self.assertEqual(class_obj.title, "Test Class")
        self.assertEqual(class_obj.description, "Test class description")
        self.assertEqual(class_obj.duration_minutes, 90)
        self.assertEqual(class_obj.zoom_meeting_id, "123456789")
        self.assertEqual(class_obj.zoom_join_url, "https://zoom.us/j/123456789")
        self.assertEqual(class_obj.password_for_zoom, "testpass")
        self.assertEqual(
            class_obj.recording_url, "https://example.com/recording"
        )
        self.assertEqual(class_obj.password_for_recording, "recordingpass")

    def test_class_str_representation(self):
        """Test the string representation of a class."""
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Test Class",
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90,
        )

        expected_str = f"{self.course.name} - Test Class"
        self.assertEqual(str(class_obj), expected_str)

    def test_class_ordering(self):
        """Test that classes are ordered by scheduled_at."""
        class1 = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Class 1",
            scheduled_at=self.now + timedelta(hours=2),
            duration_minutes=90,
        )

        class2 = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Class 2",
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90,
        )

        classes = list(Class.objects.all())
        self.assertEqual(classes[0], class2)  # Earlier scheduled class first
        self.assertEqual(classes[1], class1)

    def test_class_optional_fields(self):
        """Test creating a class with minimal required fields."""
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Minimal Class",
            scheduled_at=self.now + timedelta(hours=1),
        )

        self.assertEqual(class_obj.description, "")
        self.assertEqual(class_obj.duration_minutes, 90)  # Default value
        self.assertIsNone(class_obj.zoom_meeting_id)
        self.assertIsNone(class_obj.zoom_join_url)
        self.assertIsNone(class_obj.password_for_zoom)
        self.assertIsNone(class_obj.recording_url)
        self.assertIsNone(class_obj.password_for_recording)


class AttendanceModelTestCase(TestCase):
    """Test cases for Attendance model."""

    def setUp(self):
        self.now = timezone.now()

        # Create test users
        self.student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Student",
            role="student",
        )

        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
        )

        # Create test course
        self.course = Course.objects.create(
            name="Test Course",
            description="Test course description",
            module_count=1,
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type="certificate",
        )

        # Create test class
        self.class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Test Class",
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90,
        )

    def test_attendance_creation(self):
        """Test creating an attendance record with all fields."""
        join_time = self.now
        leave_time = self.now + timedelta(hours=1, minutes=30)

        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=join_time,
            leave_time=leave_time,
            duration_minutes=90,
            via_recording=False,
            verified=True,
        )

        self.assertEqual(attendance.class_session, self.class_obj)
        self.assertEqual(attendance.student, self.student)
        self.assertEqual(attendance.join_time, join_time)
        self.assertEqual(attendance.leave_time, leave_time)
        self.assertEqual(attendance.duration_minutes, 90)
        self.assertFalse(attendance.via_recording)
        self.assertTrue(attendance.verified)

    def test_attendance_creation_with_defaults(self):
        """Test creating an attendance record with default values."""
        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
        )

        self.assertEqual(attendance.duration_minutes, 0)  # Default value
        self.assertFalse(attendance.via_recording)  # Default value
        self.assertFalse(attendance.verified)  # Default value
        self.assertIsNone(attendance.leave_time)  # Default value

    def test_attendance_str_representation(self):
        """Test the string representation of attendance."""
        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
        )

        # The model doesn't have a custom __str__ method, so it uses the default
        # which includes the model name and primary key
        self.assertIn("Attendance", str(attendance))
        self.assertIn(str(attendance.id), str(attendance))

    def test_attendance_ordering(self):
        """Test that attendances are ordered by join_time."""
        attendance1 = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now + timedelta(minutes=30),
        )

        attendance2 = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
        )

        attendances = list(Attendance.objects.all())
        self.assertEqual(attendances[0], attendance2)  # Earlier join time first
        self.assertEqual(attendances[1], attendance1)

    def test_attendance_relationships(self):
        """Test attendance relationships with class and student."""
        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
        )

        # Test reverse relationships
        self.assertIn(attendance, self.class_obj.attendances.all())
        self.assertIn(attendance, self.student.attendances.all())

    def test_attendance_duration_calculation(self):
        """Test duration calculation logic."""
        join_time = self.now
        leave_time = self.now + timedelta(hours=1, minutes=30)

        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=join_time,
            leave_time=leave_time,
            duration_minutes=90,
        )

        # Test that duration is stored correctly
        self.assertEqual(attendance.duration_minutes, 90)

        # Test that we can calculate duration from times
        calculated_duration = int((leave_time - join_time).total_seconds() / 60)
        self.assertEqual(calculated_duration, 90)

    def test_attendance_without_leave_time(self):
        """Test attendance record without leave time (student still in class)."""
        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            duration_minutes=45,
        )

        self.assertIsNone(attendance.leave_time)
        self.assertEqual(attendance.duration_minutes, 45)

    def test_attendance_via_recording(self):
        """Test attendance record for recording access."""
        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            via_recording=True,
            duration_minutes=90,
        )

        self.assertTrue(attendance.via_recording)
        self.assertEqual(attendance.duration_minutes, 90)

    def test_attendance_verification(self):
        """Test attendance verification status."""
        # Unverified attendance
        unverified_attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
        )
        self.assertFalse(unverified_attendance.verified)

        # Verified attendance
        verified_attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            verified=True,
        )
        self.assertTrue(verified_attendance.verified)

    def test_multiple_attendances_same_class(self):
        """Test that multiple students can attend the same class."""
        student2 = User.objects.create_user(
            email="student2@example.com",
            password="testpassword123",
            first_name="Test2",
            last_name="Student2",
            role="student",
        )

        attendance1 = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
        )

        attendance2 = Attendance.objects.create(
            class_session=self.class_obj,
            student=student2,
            join_time=self.now + timedelta(minutes=5),
        )

        self.assertEqual(
            Attendance.objects.filter(class_session=self.class_obj).count(), 2
        )
        self.assertIn(attendance1, self.class_obj.attendances.all())
        self.assertIn(attendance2, self.class_obj.attendances.all())

    def test_attendance_foreign_key_constraints(self):
        """Test that attendance records are properly linked to class and student."""
        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
        )

        # Test that we can access related objects
        self.assertEqual(attendance.class_session.course, self.course)
        self.assertEqual(attendance.class_session.lecturer, self.lecturer)
        self.assertEqual(attendance.student.email, "student@example.com")

        # Test that deleting related objects affects attendance
        self.class_obj.delete()
        self.assertFalse(Attendance.objects.filter(id=attendance.id).exists())
