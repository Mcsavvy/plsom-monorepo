from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from apps.cohorts.models import Cohort, Enrollment
from apps.users.serializers import UserSerializer
from drf_spectacular.utils import extend_schema_field


class CohortSerializer(serializers.ModelSerializer):
    enrolled_students_count = serializers.SerializerMethodField()

    class Meta:
        model = Cohort
        fields = [
            "id",
            "name",
            "program_type",
            "is_active",
            "start_date",
            "end_date",
            "enrolled_students_count",
        ]

    @extend_schema_field(int)
    def get_enrolled_students_count(self, obj):
        return obj.enrollments.count()

    def validate_name(self, value):
        """Validate cohort name is unique within the same program type"""
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
            # If no program type available, skip validation
            return value

        if instance:
            # For updates, exclude current instance and filter by program type
            if (
                Cohort.objects.filter(name=value, program_type=program_type)
                .exclude(id=instance.id)
                .exists()
            ):
                raise serializers.ValidationError(
                    f"Cohort with this name already exists for {program_type} program."
                )
        else:
            # For creates, filter by program type
            if Cohort.objects.filter(
                name=value, program_type=program_type
            ).exists():
                print(
                    f"Cohort with this name already exists for {program_type} program."
                )
                raise serializers.ValidationError(
                    f"Cohort with this name already exists for {program_type} program."
                )
        return value

    def validate_start_date(self, value):
        """Validate start date"""
        today = timezone.now().date()

        # For new cohorts, start date should not be in the past
        instance = getattr(self, "instance", None)
        if not instance and value < today:
            raise serializers.ValidationError(
                "Start date cannot be in the past."
            )

        # For existing cohorts, cannot change start date if cohort has already started
        if (
            instance
            and instance.start_date <= today
            and value != instance.start_date
        ):
            raise serializers.ValidationError(
                "Cannot change start date for a cohort that has already started."
            )

        return value

    def validate_end_date(self, value):
        """Validate end date"""
        if value:
            today = timezone.now().date()

            # End date cannot be in the past
            if value < today:
                raise serializers.ValidationError(
                    "End date cannot be in the past."
                )

        return value

    def validate(self, attrs):
        """Cross-field validation"""
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        is_active = attrs.get("is_active")
        program_type = attrs.get("program_type")

        instance = getattr(self, "instance", None)

        # Get current values for partial updates
        if instance:
            start_date = start_date or instance.start_date
            end_date = end_date or instance.end_date
            is_active = (
                is_active if is_active is not None else instance.is_active
            )
            program_type = program_type or instance.program_type

        # End date must be after start date
        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError(
                {"end_date": "End date must be after start date."}
            )

        # Validate cohort duration (should be reasonable for academic programs)
        if start_date and end_date:
            duration = end_date - start_date
            if duration < timedelta(days=30):  # Minimum 30 days
                raise serializers.ValidationError(
                    {"end_date": "Cohort duration must be at least 30 days."}
                )
            if duration > timedelta(days=730):  # Maximum 2 years
                raise serializers.ValidationError(
                    {"end_date": "Cohort duration cannot exceed 2 years."}
                )

        # Cannot activate a cohort that has already ended
        today = timezone.now().date()
        if is_active and end_date and end_date < today:
            raise serializers.ValidationError(
                {
                    "is_active": "Cannot activate a cohort that has already ended."
                }
            )

        # For existing cohorts with students, validate program type changes
        if instance and instance.program_type != program_type:
            if Enrollment.objects.filter(cohort=instance).exists():
                raise serializers.ValidationError(
                    {
                        "program_type": "Cannot change program type for a cohort with enrolled students."
                    }
                )

        # Validate active cohort business rule
        if is_active:
            existing_active = Cohort.objects.filter(
                program_type=program_type, is_active=True
            )
            if instance:
                existing_active = existing_active.exclude(id=instance.id)

            if existing_active.exists():
                active_cohort = existing_active.first()
                raise serializers.ValidationError(
                    {
                        "is_active": f'Cannot activate this cohort. "{active_cohort.name}" is already active for {program_type} program.'
                    }
                )

        return attrs

    def validate_deactivation(self, instance):
        """Validate if cohort can be deactivated"""
        today = timezone.now().date()

        # Check for ongoing or future classes
        try:
            from apps.classes.models import Class

            future_classes = Class.objects.filter(
                cohort=instance, scheduled_at__date__gte=today
            )
            if future_classes.exists():
                raise serializers.ValidationError(
                    {
                        "is_active": "Cannot deactivate cohort with upcoming classes."
                    }
                )
        except ImportError:
            # Classes app not ready yet
            pass

    def create(self, validated_data):
        program_type = validated_data.get("program_type")
        is_active = validated_data.get("is_active", False)

        if is_active:
            # Ensure only one cohort is active per program type
            with transaction.atomic():
                # Deactivate all other cohorts for this program type
                Cohort.objects.filter(
                    program_type=program_type, is_active=True
                ).update(is_active=False)

                # Create the new cohort
                cohort = Cohort.objects.create(**validated_data)
                return cohort
        else:
            return Cohort.objects.create(**validated_data)

    def update(self, instance, validated_data):
        program_type = validated_data.get("program_type", instance.program_type)
        is_active = validated_data.get("is_active", instance.is_active)

        # If deactivating, validate it's safe to do so
        if instance.is_active and not is_active:
            try:
                self.validate_deactivation(instance)
            except serializers.ValidationError as e:
                # Re-raise with proper field mapping
                raise e

        if is_active and not instance.is_active:
            # If activating this cohort, deactivate all others for this program type
            with transaction.atomic():
                Cohort.objects.filter(
                    program_type=program_type, is_active=True
                ).exclude(id=instance.id).update(is_active=False)

        return super().update(instance, validated_data)


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    cohort = CohortSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "student",
            "cohort",
            "enrolled_at",
        ]

    def validate(self, attrs):
        """Validate enrollment rules"""
        student = attrs.get("student")
        cohort = attrs.get("cohort")

        if student and cohort:
            # Student program type should match cohort program type
            if student.program_type != cohort.program_type:
                raise serializers.ValidationError(
                    f"Student's program type ({student.program_type}) does not match cohort's program type ({cohort.program_type})."
                )

            # Cannot enroll in inactive cohort
            if not cohort.is_active:
                raise serializers.ValidationError(
                    "Cannot enroll in an inactive cohort."
                )

            # Cannot enroll in ended cohort
            today = timezone.now().date()
            if cohort.end_date and cohort.end_date < today:
                raise serializers.ValidationError(
                    "Cannot enroll in a cohort that has already ended."
                )

            # Student should not be enrolled in multiple active cohorts of same program type
            existing_enrollment = Enrollment.objects.filter(
                student=student,
                cohort__program_type=cohort.program_type,
                cohort__is_active=True,
            ).exclude(cohort=cohort)

            if existing_enrollment.exists():
                existing_cohort = existing_enrollment.first().cohort
                raise serializers.ValidationError(
                    f"Student is already enrolled in active cohort '{existing_cohort.name}' for {cohort.program_type} program."
                )

        return attrs


class CurrentCohortSerializer(serializers.ModelSerializer):
    """Serializer for current cohorts - minimal data"""

    enrolled_students_count = serializers.SerializerMethodField()

    class Meta:
        model = Cohort
        fields = [
            "id",
            "name",
            "program_type",
            "start_date",
            "end_date",
            "enrolled_students_count",
        ]

    @extend_schema_field(int)
    def get_enrolled_students_count(self, obj):
        return obj.enrollments.count()
