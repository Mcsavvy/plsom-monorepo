from rest_framework import serializers

from apps.users.models import User
from apps.cohorts.models import Cohort, Enrollment
from apps.courses.models import Course
from apps.classes.models import Class
from drf_spectacular.utils import extend_schema_field


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    @extend_schema_field(serializers.CharField)
    def get_profile_picture(self, obj):
        request = self.context.get("request")
        # check if the profile picture is not empty
        if obj.profile_picture:
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    class Meta:
        model = User
        fields = (
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
        )
        read_only_fields = (
            "is_staff",
            "is_active",
            "role",
            "is_setup_complete",
            "profile_picture",
        )


class PromoteDemoteResponseSerializer(serializers.Serializer):
    status = serializers.CharField()


class ProfilePictureUploadSerializer(serializers.Serializer):
    profile_picture = serializers.ImageField()

    def validate_profile_picture(self, value):
        # Validate file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Image file size must be less than 5MB."
            )

        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Only JPEG, PNG, and GIF images are allowed."
            )

        return value

    def save(self, user):
        profile_picture = self.validated_data["profile_picture"]

        # Delete old profile picture if it exists
        if user.profile_picture:
            user.profile_picture.delete(save=False)

        # Save new profile picture
        user.profile_picture = profile_picture
        user.save()

        return user


class StudentEnrollmentActionSerializer(serializers.Serializer):
    """Serializer for enrolling/unenrolling a student from a cohort."""

    cohort_id = serializers.IntegerField()

    def validate_cohort_id(self, value):
        """Check that the cohort exists."""
        if not Cohort.objects.filter(id=value).exists():
            raise serializers.ValidationError(
                "Cohort with this ID does not exist."
            )
        return value


class StudentEnrollmentCohortSerializer(serializers.ModelSerializer):
    """Serializer for cohort information in student enrollment context"""

    class Meta:
        model = Cohort
        fields = (
            "id",
            "name",
            "program_type",
            "is_active",
            "start_date",
            "end_date",
        )


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for student enrollment information"""

    cohort = StudentEnrollmentCohortSerializer()

    class Meta:
        model = Enrollment
        fields = (
            "id",
            "cohort",
            "enrolled_at",
            "end_date",
        )


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for student users with their enrollments"""

    enrollments = StudentEnrollmentSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "title",
            "whatsapp_number",
            "profile_picture",
            "is_setup_complete",
            "is_active",
            "enrollments",
        )
        read_only_fields = (
            "enrollments",
            "is_active",
            "is_setup_complete",
            "profile_picture",
        )


class StaffCourseSerializer(serializers.ModelSerializer):
    """Serializer for courses taught by staff"""

    class Meta:
        model = Course
        fields = (
            "id",
            "name",
            "program_type",
            "module_count",
            "description",
            "is_active",
        )


class StaffClassSerializer(serializers.ModelSerializer):
    """Serializer for classes taught by staff"""

    course_name = serializers.CharField(source="course.name", read_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)

    class Meta:
        model = Class
        fields = (
            "id",
            "course",
            "course_name",
            "cohort",
            "cohort_name",
            "title",
            "description",
            "scheduled_at",
            "duration_minutes",
            "zoom_meeting_id",
            "zoom_join_url",
            "recording_url",
        )
        read_only_fields = ("course_name", "cohort_name")


class StaffSerializer(serializers.ModelSerializer):
    """Serializer for staff users (lecturers and admins) with their teaching information"""

    # Get courses taught by this staff member
    courses_taught = StaffCourseSerializer(many=True, read_only=True)

    # get classes taught by this staff member
    # classes_taught = StaffClassSerializer(many=True, read_only=True)

    # Get total classes count
    total_classes = serializers.SerializerMethodField()

    @extend_schema_field(serializers.IntegerField)
    def get_total_classes(self, obj):
        """Get total number of classes taught by this staff member"""
        return Class.objects.filter(lecturer=obj).count()

    class Meta:
        model = User
        fields = (
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
            "courses_taught",
            # "classes_taught",
            "total_classes",
        )
        read_only_fields = (
            "is_staff",
            "is_active",
            "role",
            "is_setup_complete",
            "profile_picture",
            "courses_taught",
            # "classes_taught",
            "total_classes",
        )
