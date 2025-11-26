import re
from rest_framework import serializers
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field

from apps.classes.models import Class, Attendance
from apps.courses.serializers import CourseSerializer
from apps.users.serializers import UserSerializer
from apps.cohorts.serializers import CohortSerializer
import pytz  # type: ignore
from datetime import datetime


class ClassSerializer(serializers.ModelSerializer):
    """Main serializer for Class model with full details"""

    course = CourseSerializer(read_only=True)
    lecturer = UserSerializer(read_only=True)
    cohort = CohortSerializer(read_only=True)
    attendance_count = serializers.SerializerMethodField()
    is_past = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = [
            "id",
            "course",
            "lecturer",
            "cohort",
            "title",
            "description",
            "scheduled_at",
            "duration_minutes",
            "zoom_join_url",
            "recording_url",
            "password_for_recording",
            "attendance_count",
            "is_past",
            "can_join",
        ]
        # Note: zoom_meeting_id and password_for_zoom are excluded from frontend

    @extend_schema_field(serializers.IntegerField)
    def get_attendance_count(self, obj):
        """Get count of students who attended this class"""
        return obj.attendances.count()

    @extend_schema_field(serializers.BooleanField)
    def get_is_past(self, obj):
        """Check if class is in the past"""
        return obj.scheduled_at < timezone.now()

    @extend_schema_field(serializers.BooleanField)
    def get_can_join(self, obj):
        """Check if class can be joined (within 15 minutes of start time)"""
        now = timezone.now()
        start_time = obj.scheduled_at
        end_time = start_time + timezone.timedelta(minutes=obj.duration_minutes)
        join_window_start = start_time - timezone.timedelta(minutes=15)

        if join_window_start <= now <= end_time and obj.zoom_join_url:
            return True
        return False


class ClassCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating classes (admin/lecturer only)"""

    course_id = serializers.IntegerField(write_only=True)
    lecturer_id = serializers.IntegerField(write_only=True, required=False)
    cohort_id = serializers.IntegerField(write_only=True)
    timezone = serializers.CharField(
        write_only=True, required=False, default="UTC"
    )

    # Read-only nested objects for response
    course = CourseSerializer(read_only=True)
    lecturer = UserSerializer(read_only=True)
    cohort = CohortSerializer(read_only=True)

    class Meta:
        model = Class
        fields = [
            "id",
            "course_id",
            "course",
            "lecturer_id",
            "lecturer",
            "cohort_id",
            "cohort",
            "title",
            "timezone",
            "description",
            "scheduled_at",
            "duration_minutes",
            "zoom_join_url",
            "recording_url",
            "password_for_recording",
        ]

    def validate_course_id(self, value):
        """Validate course exists"""
        from apps.courses.models import Course

        try:
            Course.objects.get(id=value)
            return value
        except Course.DoesNotExist:
            raise serializers.ValidationError(
                "Course with this ID does not exist."
            )

    def validate_lecturer_id(self, value):
        """Validate lecturer exists and has correct role"""
        if value is None:
            return value

        from apps.users.models import User

        try:
            lecturer = User.objects.get(id=value)
            if lecturer.role not in ["lecturer", "admin"]:
                raise serializers.ValidationError(
                    "User must be a lecturer or admin."
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Lecturer with this ID does not exist."
            )

    def validate_cohort_id(self, value):
        """Validate cohort exists"""
        from apps.cohorts.models import Cohort

        try:
            Cohort.objects.get(id=value)
            return value
        except Cohort.DoesNotExist:
            raise serializers.ValidationError(
                "Cohort with this ID does not exist."
            )

    def validate_scheduled_at(self, value):
        """Validate scheduled time"""
        # Allow past scheduling only for updates (not creation)
        if value <= timezone.now() and not self.instance:
            raise serializers.ValidationError(
                "Class cannot be scheduled in the past."
            )
        return value

    def validate(self, attrs):
        """Cross-field validation with timezone handling"""
        # Handle timezone conversion for scheduled_at
        timezone_name = attrs.get("timezone", "UTC")

        # Remove timezone from attrs since it's not a model field
        if "timezone" in attrs:
            del attrs["timezone"]

        # If scheduled_at is provided, convert it to the specified timezone
        if "scheduled_at" in attrs and attrs["scheduled_at"]:
            try:
                # Parse the datetime string (should be ISO format from frontend)
                dt = attrs["scheduled_at"]
                if isinstance(dt, str):
                    # If it's already a timezone-aware datetime, use it as is
                    if dt.endswith("Z") or "+" in dt or dt.endswith("UTC"):
                        # Already timezone-aware, convert to UTC
                        dt = timezone.datetime.fromisoformat(
                            dt.replace("Z", "+00:00")
                        )
                    else:
                        # Assume it's in the specified timezone
                        tz = pytz.timezone(timezone_name)
                        dt = datetime.fromisoformat(dt)
                        dt = tz.localize(dt)

                # Convert to UTC for storage
                attrs["scheduled_at"] = dt.astimezone(pytz.UTC)

            except (ValueError, pytz.exceptions.UnknownTimeZoneError) as e:
                raise serializers.ValidationError(
                    f"Invalid timezone or datetime format: {str(e)}"
                )

        # Check if this is an update to a past class
        instance = self.instance
        if instance and instance.scheduled_at < timezone.now():
            # For past classes, only allow updating recording-related fields
            allowed_fields = {
                'recording_url', 'password_for_recording', 'title', 'description'
            }
            # Filter out restricted fields instead of raising an error
            restricted_fields = set(attrs.keys()) - allowed_fields
            for field in restricted_fields:
                attrs.pop(field, None)

        # Original cross-field validation logic
        course_id = attrs.get("course_id", instance.course_id if instance else None)
        lecturer_id = attrs.get("lecturer_id", instance.lecturer_id if instance else None)
        cohort_id = attrs.get("cohort_id", instance.cohort_id if instance else None)
        scheduled_at = attrs.get("scheduled_at", instance.scheduled_at if instance else None)

        # Import models
        from apps.courses.models import Course
        from apps.cohorts.models import Cohort

        # Get objects for validation
        course = Course.objects.get(id=course_id)
        cohort = Cohort.objects.get(id=cohort_id)

        # Validate course and cohort program types match
        if course.program_type != cohort.program_type:
            raise serializers.ValidationError(
                {
                    "course_id": f"Course program type ({course.program_type}) must match cohort program type ({cohort.program_type})."
                }
            )

        # If no lecturer specified, use course lecturer
        if not lecturer_id and course.lecturer:
            attrs["lecturer_id"] = course.lecturer.id
        elif not lecturer_id and not course.lecturer:
            raise serializers.ValidationError(
                {
                    "lecturer_id": "Lecturer must be specified as course has no assigned lecturer."
                }
            )

        # Check for scheduling conflicts (same lecturer, overlapping time)
        if lecturer_id and scheduled_at:
            duration = attrs.get("duration_minutes", instance.duration_minutes if instance else None)
            scheduled_at + timezone.timedelta(minutes=duration)

        return attrs

    def validate_duration_minutes(self, value):
        """Validate duration is reasonable"""
        if value <= 0:
            raise serializers.ValidationError(
                "Duration must be greater than 0."
            )
        if value > 480:  # 8 hours max
            raise serializers.ValidationError(
                "Duration cannot exceed 8 hours (480 minutes)."
            )
        return value

    def validate_zoom_join_url(self, value):
        """Validate Zoom URL format and extract meeting ID if possible"""
        if not value:
            return value

        # Basic URL validation
        if not value.startswith(
            (
                "https://zoom.us/",
                "https://us02web.zoom.us/",
                "https://us04web.zoom.us/",
                "https://us05web.zoom.us/",
            )
        ):
            raise serializers.ValidationError("Invalid Zoom URL format.")

        return value

    def _extract_meeting_id_from_url(self, url):
        """Extract Zoom meeting ID from URL"""
        if not url:
            return None

        # Pattern to match Zoom meeting URLs and extract meeting ID
        patterns = [
            r"/j/(\d+)",  # Standard join URL
            r"meeting_id=(\d+)",  # Meeting ID parameter
            r"/webinar/(\d+)",  # Webinar URL
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

        return None

    def create(self, validated_data):
        """Create class with extracted meeting ID"""
        course_id = validated_data.pop("course_id")
        lecturer_id = validated_data.pop("lecturer_id", None)
        cohort_id = validated_data.pop("cohort_id")
        zoom_join_url = validated_data.get("zoom_join_url")

        # Extract meeting ID from URL if not provided
        if zoom_join_url and not validated_data.get("zoom_meeting_id"):
            meeting_id = self._extract_meeting_id_from_url(zoom_join_url)
            if meeting_id:
                validated_data["zoom_meeting_id"] = meeting_id

        # Create class
        class_obj = Class.objects.create(
            course_id=course_id,
            lecturer_id=lecturer_id,
            cohort_id=cohort_id,
            **validated_data,
        )

        return class_obj

    def update(self, instance, validated_data):
        """Update class with extracted meeting ID"""
        course_id = validated_data.pop("course_id", None)
        lecturer_id = validated_data.pop("lecturer_id", None)
        cohort_id = validated_data.pop("cohort_id", None)
        zoom_join_url = validated_data.get("zoom_join_url")

        # Extract meeting ID from URL if URL is updated
        if zoom_join_url and zoom_join_url != instance.zoom_join_url:
            meeting_id = self._extract_meeting_id_from_url(zoom_join_url)
            if meeting_id:
                validated_data["zoom_meeting_id"] = meeting_id

        # Update foreign keys
        if course_id:
            instance.course_id = course_id
        if lecturer_id is not None:  # Allow setting to None
            instance.lecturer_id = lecturer_id
        if cohort_id:
            instance.cohort_id = cohort_id

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model"""

    class_session = ClassSerializer(read_only=True)
    duration_display = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            "id",
            "class_session",
            "join_time",
            "leave_time",
            "duration_minutes",
            "duration_display",
            "via_recording",
            "verified",
        ]

    @extend_schema_field(serializers.CharField)
    def get_duration_display(self, obj):
        """Get human-readable duration"""
        if obj.duration_minutes:
            hours = obj.duration_minutes // 60
            minutes = obj.duration_minutes % 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return "0m"


class AttendanceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating attendance records"""

    class_session_id = serializers.IntegerField(write_only=True)
    student_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Attendance
        fields = [
            "class_session_id",
            "student_id",
            "join_time",
            "leave_time",
            "duration_minutes",
            "via_recording",
        ]

    def validate_class_session_id(self, value):
        """Validate class exists"""
        try:
            Class.objects.get(id=value)
            return value
        except Class.DoesNotExist:
            raise serializers.ValidationError(
                "Class with this ID does not exist."
            )

    def validate_student_id(self, value):
        """Validate student exists and has correct role"""
        from apps.users.models import User

        try:
            student = User.objects.get(id=value)
            if student.role != "student":
                raise serializers.ValidationError("User must be a student.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Student with this ID does not exist."
            )

    def validate(self, attrs):
        """Cross-field validation"""
        class_session_id = attrs.get("class_session_id")
        student_id = attrs.get("student_id")

        # Check if attendance already exists
        if Attendance.objects.filter(
            class_session_id=class_session_id, student_id=student_id
        ).exists():
            raise serializers.ValidationError(
                "Attendance record already exists for this student and class."
            )

        # Validate join/leave times
        join_time = attrs.get("join_time")
        leave_time = attrs.get("leave_time")

        if join_time and leave_time and leave_time <= join_time:
            raise serializers.ValidationError(
                {"leave_time": "Leave time must be after join time."}
            )

        return attrs

    def create(self, validated_data):
        """Create attendance record"""
        class_session_id = validated_data.pop("class_session_id")
        student_id = validated_data.pop("student_id")

        attendance = Attendance.objects.create(
            class_session_id=class_session_id,
            student_id=student_id,
            **validated_data,
        )

        return attendance


class AttendanceVerificationSerializer(serializers.Serializer):
    """Serializer for attendance verification"""

    verified = serializers.BooleanField(default=True)
    notes = serializers.CharField(
        max_length=500, required=False, allow_blank=True
    )


class StudentAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for student attendance"""

    class Meta:
        model = Attendance
        fields = [
            "id",
            "class_session",
            "student",
            "join_time",
            "leave_time",
            "duration_minutes",
            "via_recording",
        ]


class StudentClassSerializer(serializers.ModelSerializer):
    """Serializer for classes viewed by students"""

    course_name = serializers.CharField(source="course.name", read_only=True)
    lecturer_name = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()
    my_attendance = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = [
            "id",
            "course_name",
            "lecturer_name",
            "title",
            "description",
            "scheduled_at",
            "duration_minutes",
            "zoom_join_url",
            "recording_url",
            "password_for_recording",
            "can_join",
            "my_attendance",
        ]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_lecturer_name(self, obj):
        """Get lecturer's full name, or None if no lecturer"""
        if obj.lecturer:
            return obj.lecturer.get_full_name()
        return None

    @extend_schema_field(serializers.BooleanField)
    def get_can_join(self, obj):
        """Check if student can join this class"""
        now = timezone.now()
        start_time = obj.scheduled_at
        end_time = start_time + timezone.timedelta(minutes=obj.duration_minutes)
        join_window_start = start_time - timezone.timedelta(minutes=15)

        if join_window_start <= now <= end_time and obj.zoom_join_url:
            return True
        return False

    @extend_schema_field(StudentAttendanceSerializer)
    def get_my_attendance(self, obj):
        """Get student's attendance for this class"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None

        attendance = obj.attendances.filter(student=request.user).first()
        if attendance:
            return StudentAttendanceSerializer(attendance).data
        return None
