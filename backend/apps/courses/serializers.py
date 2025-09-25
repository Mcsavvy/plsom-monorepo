from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from apps.courses.models import Course
from apps.users.serializers import UserSerializer
from apps.users.models import User


class CourseSerializer(serializers.ModelSerializer):
    """Main serializer for Course model with validation"""

    lecturer = UserSerializer(read_only=True)
    total_classes = serializers.SerializerMethodField()
    active_classes_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "program_type",
            "module_count",
            "description",
            "lecturer",
            "is_active",
            "created_at",
            "updated_at",
            "total_classes",
            "active_classes_count",
        ]
        read_only_fields = ("created_at", "updated_at")

    @extend_schema_field(serializers.IntegerField)
    def get_total_classes(self, obj):
        """Get total number of classes for this course"""
        try:
            from apps.classes.models import Class

            return Class.objects.filter(course=obj).count()
        except ImportError:
            return 0

    @extend_schema_field(serializers.IntegerField)
    def get_active_classes_count(self, obj):
        """Get number of upcoming classes for this course"""
        try:
            from apps.classes.models import Class
            from django.utils import timezone

            return Class.objects.filter(
                course=obj, scheduled_at__gte=timezone.now()
            ).count()
        except ImportError:
            return 0

    def validate_name(self, value):
        """Validate course name is unique within the same program type"""
        instance = getattr(self, "instance", None)

        # Get the program type from the data or instance
        program_type = None
        if (
            hasattr(self, "initial_data")
            and "program_type" in self.initial_data
        ):
            program_type = self.initial_data["program_type"]
        elif instance:
            program_type = instance.program_type

        if not program_type:
            return value

        if instance:
            # For updates, exclude current instance and filter by program type
            if (
                Course.objects.filter(name=value, program_type=program_type)
                .exclude(id=instance.id)
                .exists()
            ):
                raise serializers.ValidationError(
                    f"Course with this name already exists for {program_type} program."
                )
        else:
            # For creates, filter by program type
            if Course.objects.filter(
                name=value, program_type=program_type
            ).exists():
                raise serializers.ValidationError(
                    f"Course with this name already exists for {program_type} program."
                )

        return value

    def validate_module_count(self, value):
        """Validate module count is reasonable"""
        if value <= 0:
            raise serializers.ValidationError(
                "Module count must be greater than 0."
            )
        if value > 50:
            raise serializers.ValidationError("Module count cannot exceed 50.")
        return value

    def validate_program_type(self, value):
        """Validate program type is valid"""
        valid_types = [choice[0] for choice in User.PROGRAM_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Program type must be one of: {', '.join(valid_types)}"
            )
        return value


class LecturerAssignmentSerializer(serializers.Serializer):
    """Serializer for assigning lecturers to courses"""

    lecturer_id = serializers.IntegerField()

    def validate_lecturer_id(self, value):
        """Validate lecturer exists and is actually a lecturer"""
        try:
            lecturer = User.objects.get(id=value)
            if lecturer.role != "lecturer":
                raise serializers.ValidationError("User must be a lecturer.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Lecturer with this ID does not exist."
            )


class LecturerCourseSerializer(serializers.ModelSerializer):
    """Serializer for courses viewed by lecturers"""

    my_classes_count = serializers.SerializerMethodField()
    next_class = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "program_type",
            "module_count",
            "description",
            "is_active",
            "my_classes_count",
            "next_class",
        ]

    @extend_schema_field(serializers.IntegerField)
    def get_my_classes_count(self, obj):
        """Get count of classes this lecturer teaches for this course"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return 0

        try:
            from apps.classes.models import Class

            return Class.objects.filter(
                course=obj, lecturer=request.user
            ).count()
        except ImportError:
            return 0

    @extend_schema_field(serializers.DictField)
    def get_next_class(self, obj):
        """Get next upcoming class for this course taught by this lecturer"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None

        try:
            from apps.classes.models import Class
            from django.utils import timezone

            next_class = (
                Class.objects.filter(
                    course=obj,
                    lecturer=request.user,
                    scheduled_at__gte=timezone.now(),
                )
                .order_by("scheduled_at")
                .first()
            )

            if next_class:
                return {
                    "id": next_class.id,
                    "title": next_class.title,
                    "scheduled_at": next_class.scheduled_at,
                    "cohort_name": next_class.cohort.name,
                }
            return None
        except ImportError:
            return None


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating courses (admin only)"""

    lecturer_id = serializers.IntegerField(
        required=False, allow_null=True, write_only=True
    )
    lecturer = UserSerializer(read_only=True)

    class Meta:
        model = Course
        fields = [
            "name",
            "program_type",
            "module_count",
            "description",
            "lecturer_id",
            "lecturer",
            "is_active",
        ]

    def validate_lecturer_id(self, value):
        """Validate lecturer exists and is actually a lecturer"""
        if value is None:
            return value

        try:
            User.objects.get(id=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Lecturer with this ID does not exist."
            )

    def validate_name(self, value):
        """Validate course name is unique within the same program type"""
        instance = getattr(self, "instance", None)
        program_type = self.initial_data.get("program_type")

        if not program_type and instance:
            program_type = instance.program_type

        if not program_type:
            return value

        queryset = Course.objects.filter(name=value, program_type=program_type)
        if instance:
            queryset = queryset.exclude(id=instance.id)

        if queryset.exists():
            raise serializers.ValidationError(
                f"Course with this name already exists for {program_type} program."
            )

        return value

    def validate_module_count(self, value):
        """Validate module count is reasonable"""
        if value <= 0:
            raise serializers.ValidationError(
                "Module count must be greater than 0."
            )
        if value > 50:
            raise serializers.ValidationError("Module count cannot exceed 50.")
        return value

    def create(self, validated_data):
        """Create course with lecturer assignment"""
        lecturer_id = validated_data.pop("lecturer_id", None)

        course = Course.objects.create(**validated_data)

        if lecturer_id:
            course.lecturer_id = lecturer_id
            course.save()

        return course

    def update(self, instance, validated_data):
        """Update course with lecturer assignment"""
        lecturer_id = validated_data.pop("lecturer_id", None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle lecturer assignment
        if (
            "lecturer_id" in self.initial_data
        ):  # Only update if explicitly provided
            instance.lecturer_id = lecturer_id

        instance.save()
        return instance


class StudentCourseSerializer(serializers.ModelSerializer):
    """Serializer for courses viewed by students with relevant information"""

    lecturer_name = serializers.CharField(
        source="lecturer.get_full_name", read_only=True
    )
    total_classes_in_my_cohorts = serializers.SerializerMethodField()
    upcoming_classes_in_my_cohorts = serializers.SerializerMethodField()
    next_class_in_my_cohorts = serializers.SerializerMethodField()
    has_classes_in_my_cohorts = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "program_type",
            "module_count",
            "description",
            "lecturer_name",
            "is_active",
            "total_classes_in_my_cohorts",
            "upcoming_classes_in_my_cohorts",
            "next_class_in_my_cohorts",
            "has_classes_in_my_cohorts",
        ]

    @extend_schema_field(serializers.BooleanField)
    def get_has_classes_in_my_cohorts(self, obj):
        """Check if this course has any classes in student's enrolled cohorts"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return False

        try:
            from apps.classes.models import Class
            from apps.cohorts.models import Enrollment

            # Get student's enrolled cohorts
            enrolled_cohorts = Enrollment.objects.filter(
                student=request.user
            ).values_list("cohort_id", flat=True)

            return Class.objects.filter(
                course=obj, cohort_id__in=enrolled_cohorts
            ).exists()
        except ImportError:
            return False

    @extend_schema_field(serializers.IntegerField)
    def get_total_classes_in_my_cohorts(self, obj):
        """Get total number of classes for this course in student's cohorts"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return 0

        try:
            from apps.classes.models import Class
            from apps.cohorts.models import Enrollment

            # Get student's enrolled cohorts
            enrolled_cohorts = Enrollment.objects.filter(
                student=request.user
            ).values_list("cohort_id", flat=True)

            return Class.objects.filter(
                course=obj, cohort_id__in=enrolled_cohorts
            ).count()
        except ImportError:
            return 0

    @extend_schema_field(serializers.IntegerField)
    def get_upcoming_classes_in_my_cohorts(self, obj):
        """Get number of upcoming classes for this course in student's cohorts"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return 0

        try:
            from apps.classes.models import Class
            from apps.cohorts.models import Enrollment
            from django.utils import timezone

            # Get student's enrolled cohorts
            enrolled_cohorts = Enrollment.objects.filter(
                student=request.user
            ).values_list("cohort_id", flat=True)

            return Class.objects.filter(
                course=obj,
                cohort_id__in=enrolled_cohorts,
                scheduled_at__gte=timezone.now(),
            ).count()
        except ImportError:
            return 0

    @extend_schema_field(serializers.DictField)
    def get_next_class_in_my_cohorts(self, obj):
        """Get next upcoming class for this course in student's cohorts"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None

        try:
            from apps.classes.models import Class
            from apps.cohorts.models import Enrollment
            from django.utils import timezone

            # Get student's enrolled cohorts
            enrolled_cohorts = Enrollment.objects.filter(
                student=request.user
            ).values_list("cohort_id", flat=True)

            next_class = (
                Class.objects.filter(
                    course=obj,
                    cohort_id__in=enrolled_cohorts,
                    scheduled_at__gte=timezone.now(),
                )
                .order_by("scheduled_at")
                .first()
            )

            if next_class:
                return {
                    "id": next_class.id,
                    "title": next_class.title,
                    "scheduled_at": next_class.scheduled_at,
                    "cohort_name": next_class.cohort.name,
                }
            return None
        except ImportError:
            return None
