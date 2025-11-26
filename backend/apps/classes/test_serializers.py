from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.classes.models import Class, Attendance
from apps.classes.serializers import (
    ClassSerializer,
    ClassCreateUpdateSerializer,
    AttendanceSerializer,
    AttendanceCreateSerializer,
    StudentClassSerializer,
    AttendanceVerificationSerializer,
)
from apps.courses.models import Course
from apps.cohorts.models import Cohort

User = get_user_model()


class ClassSerializerTestCase(TestCase):
    """Test cases for ClassSerializer."""

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
            description="Test class description",
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90,
            zoom_meeting_id="123456789",
            zoom_join_url="https://zoom.us/j/123456789",
            password_for_zoom="testpass",
            recording_url="https://example.com/recording",
            password_for_recording="recordingpass",
        )

    def test_class_serializer_serialization(self):
        """Test serializing a class object."""
        serializer = ClassSerializer(self.class_obj)
        data = serializer.data

        self.assertEqual(data["id"], self.class_obj.id)
        self.assertEqual(data["title"], "Test Class")
        self.assertEqual(data["description"], "Test class description")
        self.assertEqual(
            data["scheduled_at"],
            self.class_obj.scheduled_at.isoformat().replace("+00:00", "Z"),
        )
        self.assertEqual(data["duration_minutes"], 90)
        self.assertEqual(data["zoom_join_url"], "https://zoom.us/j/123456789")
        self.assertEqual(data["recording_url"], "https://example.com/recording")
        self.assertEqual(data["password_for_recording"], "recordingpass")

        # Test nested serializers
        self.assertEqual(data["course"]["id"], self.course.id)
        self.assertEqual(data["course"]["name"], "Test Course")
        self.assertEqual(data["lecturer"]["id"], self.lecturer.id)
        self.assertEqual(data["lecturer"]["email"], "lecturer@example.com")
        self.assertEqual(data["cohort"]["id"], self.cohort.id)
        self.assertEqual(data["cohort"]["name"], "Test Cohort")

    def test_class_serializer_can_join_field(self):
        """Test the can_join field calculation."""
        # Class starting in future (cannot join)
        future_class = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Future Class",
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90,
            zoom_join_url="https://zoom.us/j/123456789",
        )

        serializer = ClassSerializer(future_class)
        self.assertFalse(serializer.data["can_join"])

        # Class starting in 15 minutes (can join)
        fifteen_minutes_class = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="15 Minutes Class",
            scheduled_at=self.now + timedelta(minutes=15),
            duration_minutes=90,
            zoom_join_url="https://zoom.us/j/123456789",
        )

        serializer = ClassSerializer(fifteen_minutes_class)
        self.assertTrue(serializer.data["can_join"])

        # Class in the past without recording (cannot join)
        past_class = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Past Class",
            scheduled_at=self.now - timedelta(hours=1),
            duration_minutes=90,
        )

        serializer = ClassSerializer(past_class)
        self.assertFalse(serializer.data["can_join"])


class ClassCreateUpdateSerializerTestCase(TestCase):
    """Test cases for ClassCreateUpdateSerializer."""

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

        # Create test course
        self.course = Course.objects.create(
            name="Test Course",
            description="Test course description",
            module_count=1,
            program_type="certificate",
        )

        # Create test cohort
        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            program_type="certificate",
        )

    def test_class_create_serializer_valid_data(self):
        """Test creating a class with valid data."""
        data = {
            "course_id": self.course.id,
            "lecturer_id": self.lecturer.id,
            "cohort_id": self.cohort.id,
            "title": "New Class",
            "description": "New class description",
            "scheduled_at": (self.now + timedelta(hours=1)).isoformat(),
            "duration_minutes": 90,
            "zoom_meeting_id": "987654321",
            "zoom_join_url": "https://zoom.us/j/987654321",
            "password_for_zoom": "newpass",
            "recording_url": "https://example.com/new-recording",
            "password_for_recording": "newrecordingpass",
        }

        serializer = ClassCreateUpdateSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        class_obj = serializer.save()
        self.assertEqual(class_obj.title, "New Class")
        self.assertEqual(class_obj.course, self.course)
        self.assertEqual(class_obj.lecturer, self.lecturer)
        self.assertEqual(class_obj.cohort, self.cohort)

    def test_class_create_serializer_invalid_duration(self):
        """Test validation with invalid duration."""
        data = {
            "course_id": self.course.id,
            "lecturer_id": self.lecturer.id,
            "cohort_id": self.cohort.id,
            "title": "Invalid Duration Class",
            "scheduled_at": (self.now + timedelta(hours=1)).isoformat(),
            "duration_minutes": 0,  # Invalid duration
        }

        serializer = ClassCreateUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("duration_minutes", serializer.errors)

    def test_class_create_serializer_excessive_duration(self):
        """Test validation with excessive duration."""
        data = {
            "course_id": self.course.id,
            "lecturer_id": self.lecturer.id,
            "cohort_id": self.cohort.id,
            "title": "Excessive Duration Class",
            "scheduled_at": (self.now + timedelta(hours=1)).isoformat(),
            "duration_minutes": 500,  # Exceeds 8 hours
        }

        serializer = ClassCreateUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("duration_minutes", serializer.errors)

    def test_class_create_serializer_missing_required_fields(self):
        """Test validation with missing required fields."""
        data = {
            "title": "Incomplete Class"
            # Missing required fields
        }

        serializer = ClassCreateUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("course_id", serializer.errors)
        self.assertIn("cohort_id", serializer.errors)
        self.assertIn("scheduled_at", serializer.errors)

    def test_class_update_serializer(self):
        """Test updating a class."""
        class_obj = Class.objects.create(
            course=self.course,
            lecturer=self.lecturer,
            cohort=self.cohort,
            title="Original Title",
            scheduled_at=self.now + timedelta(hours=1),
            duration_minutes=90,
        )

        data = {
            "title": "Updated Title",
            "description": "Updated description",
            "duration_minutes": 120,
        }

        serializer = ClassCreateUpdateSerializer(
            class_obj, data=data, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        updated_class = serializer.save()
        self.assertEqual(updated_class.title, "Updated Title")
        self.assertEqual(updated_class.description, "Updated description")
        self.assertEqual(updated_class.duration_minutes, 120)


class AttendanceSerializerTestCase(TestCase):
    """Test cases for AttendanceSerializer."""

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

        # Create test attendance
        self.attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            leave_time=self.now + timedelta(hours=1, minutes=30),
            duration_minutes=90,
            via_recording=False,
            verified=True,
        )

    def test_attendance_serializer_serialization(self):
        """Test serializing an attendance object."""
        serializer = AttendanceSerializer(self.attendance)
        data = serializer.data

        self.assertEqual(data["id"], self.attendance.id)
        self.assertEqual(
            data["join_time"],
            self.attendance.join_time.isoformat().replace("+00:00", "Z"),
        )
        self.assertEqual(
            data["leave_time"],
            self.attendance.leave_time.isoformat().replace("+00:00", "Z"),
        )
        self.assertEqual(data["duration_minutes"], 90)
        self.assertEqual(data["duration_display"], "1h 30m")
        self.assertFalse(data["via_recording"])
        self.assertTrue(data["verified"])

        # Test nested class_session serializer
        self.assertEqual(data["class_session"]["id"], self.class_obj.id)
        self.assertEqual(data["class_session"]["title"], "Test Class")

    def test_attendance_serializer_duration_display(self):
        """Test duration display formatting."""
        # Test hours and minutes
        attendance1 = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            duration_minutes=90,
        )

        serializer = AttendanceSerializer(attendance1)
        self.assertEqual(serializer.data["duration_display"], "1h 30m")

        # Test minutes only
        attendance2 = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            duration_minutes=45,
        )

        serializer = AttendanceSerializer(attendance2)
        self.assertEqual(serializer.data["duration_display"], "45m")

        # Test zero duration
        attendance3 = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            duration_minutes=0,
        )

        serializer = AttendanceSerializer(attendance3)
        self.assertEqual(serializer.data["duration_display"], "0m")

    def test_attendance_serializer_without_leave_time(self):
        """Test serializing attendance without leave time."""
        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            duration_minutes=45,
        )

        serializer = AttendanceSerializer(attendance)
        data = serializer.data

        self.assertIsNone(data["leave_time"])
        self.assertEqual(data["duration_minutes"], 45)


class AttendanceCreateSerializerTestCase(TestCase):
    """Test cases for AttendanceCreateSerializer."""

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

    def test_attendance_create_serializer_valid_data(self):
        """Test creating attendance with valid data."""
        data = {
            "class_session_id": self.class_obj.id,
            "student_id": self.student.id,
            "join_time": self.now.isoformat(),
            "leave_time": (
                self.now + timedelta(hours=1, minutes=30)
            ).isoformat(),
            "duration_minutes": 90,
            "via_recording": False,
        }

        serializer = AttendanceCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        attendance = serializer.save()
        self.assertEqual(attendance.class_session, self.class_obj)
        self.assertEqual(attendance.student, self.student)
        self.assertEqual(attendance.duration_minutes, 90)

    def test_attendance_create_serializer_invalid_student(self):
        """Test validation with invalid student ID."""
        data = {
            "class_session_id": self.class_obj.id,
            "student_id": 99999,  # Non-existent student
            "join_time": self.now.isoformat(),
            "duration_minutes": 90,
        }

        serializer = AttendanceCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("student_id", serializer.errors)

    def test_attendance_create_serializer_duplicate_attendance(self):
        """Test validation with duplicate attendance."""
        # Create existing attendance
        Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
        )

        data = {
            "class_session_id": self.class_obj.id,
            "student_id": self.student.id,
            "join_time": self.now.isoformat(),
            "duration_minutes": 90,
        }

        serializer = AttendanceCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_attendance_create_serializer_invalid_times(self):
        """Test validation with invalid join/leave times."""
        data = {
            "class_session_id": self.class_obj.id,
            "student_id": self.student.id,
            "join_time": (self.now + timedelta(hours=1)).isoformat(),
            "leave_time": self.now.isoformat(),  # Leave time before join time
            "duration_minutes": 90,
        }

        serializer = AttendanceCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("leave_time", serializer.errors)


class StudentClassSerializerTestCase(TestCase):
    """Test cases for StudentClassSerializer."""

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
            zoom_join_url="https://zoom.us/j/123456789",
        )

    def test_student_class_serializer_without_attendance(self):
        """Test serializing a class for a student without attendance."""
        serializer = StudentClassSerializer(
            self.class_obj,
            context={
                "request": type("MockRequest", (), {"user": self.student})()
            },
        )
        data = serializer.data

        self.assertEqual(data["id"], self.class_obj.id)
        self.assertEqual(data["course_name"], "Test Course")
        self.assertEqual(data["lecturer_name"], "Test Lecturer")
        self.assertEqual(data["title"], "Test Class")
        self.assertFalse(data["can_join"])
        self.assertIsNone(data["my_attendance"])

    def test_student_class_serializer_with_attendance(self):
        """Test serializing a class for a student with attendance."""
        # Create attendance record
        attendance = Attendance.objects.create(
            class_session=self.class_obj,
            student=self.student,
            join_time=self.now,
            duration_minutes=90,
        )

        serializer = StudentClassSerializer(
            self.class_obj,
            context={
                "request": type("MockRequest", (), {"user": self.student})()
            },
        )
        data = serializer.data

        self.assertEqual(data["id"], self.class_obj.id)
        self.assertFalse(data["can_join"])
        self.assertIsNotNone(data["my_attendance"])
        self.assertEqual(data["my_attendance"]["id"], attendance.id)
        self.assertEqual(data["my_attendance"]["duration_minutes"], 90)


class AttendanceVerificationSerializerTestCase(TestCase):
    """Test cases for AttendanceVerificationSerializer."""

    def test_attendance_verification_serializer_valid_data(self):
        """Test verification serializer with valid data."""
        data = {"verified": True, "notes": "Student attended the full class"}

        serializer = AttendanceVerificationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["verified"], True)
        self.assertEqual(
            serializer.validated_data["notes"],
            "Student attended the full class",
        )

    def test_attendance_verification_serializer_minimal_data(self):
        """Test verification serializer with minimal data."""
        data = {"verified": False}

        serializer = AttendanceVerificationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["verified"], False)
        self.assertEqual(serializer.validated_data.get("notes"), None)

    def test_attendance_verification_serializer_invalid_data(self):
        """Test verification serializer with invalid data."""
        data = {"verified": "not_a_boolean"}

        serializer = AttendanceVerificationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("verified", serializer.errors)
