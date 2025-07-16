from datetime import timedelta
from typing import Any, Optional
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings

from apps.cohorts.models import Cohort
from .models import Invitation

User = get_user_model()


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = [
            "id",
            "email",
            "role",
            "program_type",
            "cohort",
            "expires_at",
            "used_at",
            "created_by",
            "is_expired",
            "is_used",
        ]
        read_only_fields = [
            "id",
            "used_at",
            "created_by",
            "is_expired",
            "is_used",
            "expires_at",
        ]

    def create(self, validated_data: dict[str, Any]) -> Invitation:
        # Automatically set expiry date to 7 days from now
        expires_at = timezone.now() + settings.INVITATION_EXPIRATION_TIME
        validated_data["expires_at"] = expires_at
        return super().create(validated_data)

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        role: str = data.get("role", "")
        program_type: str = data.get("program_type", "")
        cohort: Optional[Cohort] = data.get("cohort")
        email: str = data.get("email", "")

        # Only check for existing invitations during creation, not updates
        if self.instance is None:  # Creating a new instance
            if Invitation.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "User already invited."})
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "User already exists."})
        else:  # Updating existing instance
            # Check if email conflicts with other invitations (excluding current one)
            if (
                Invitation.objects.filter(email=email)
                .exclude(pk=self.instance.pk)
                .exists()
            ):
                raise serializers.ValidationError({"email": "User already invited."})
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "User already exists."})

        if role == "student":
            if not program_type:
                raise serializers.ValidationError(
                    {"program_type": "This field is required for students."}
                )
            if not cohort:
                raise serializers.ValidationError(
                    {"cohort": "This field is required for students."}
                )
            # the cohort's program type must match the student's program type
            if cohort.program_type != program_type:
                raise serializers.ValidationError(
                    {
                        "cohort": "The cohort's program type must match the student's program type."
                    }
                )
            # the cohort must not be ending soon
            if cohort.end_date < (timezone.now() + timedelta(days=30)).date():
                raise serializers.ValidationError(
                    {"cohort": "The cohort is ending soon. Please select a different cohort."}
                )
        return data


class InvitationVerifySerializer(serializers.Serializer):
    """Serializer for verifying invitation tokens"""

    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            invitation = Invitation.objects.get(token=value)
        except Invitation.DoesNotExist:
            raise serializers.ValidationError("Invalid invitation token.")

        if invitation.is_expired:
            raise serializers.ValidationError("Invitation has expired.")

        if invitation.is_used:
            raise serializers.ValidationError("Invitation has already been used.")

        return value


class OnboardingSerializer(serializers.Serializer):
    """Serializer for user onboarding after invitation"""

    token = serializers.UUIDField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(min_length=8, write_only=True)
    title = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    whatsapp_number = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )

    def validate_token(self, value):
        try:
            invitation = Invitation.objects.get(token=value)
        except Invitation.DoesNotExist:
            raise serializers.ValidationError("Invalid invitation token.")

        if invitation.is_expired:
            raise serializers.ValidationError("Invitation has expired.")

        if invitation.is_used:
            raise serializers.ValidationError(
                "Invitation has already been used."
            )

        # Check if user already exists
        if User.objects.filter(email=invitation.email).exists():
            raise serializers.ValidationError(
                "User with this email already exists."
            )

        self.invitation = invitation
        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        invitation = self.invitation

        # Remove password_confirm from validated_data
        validated_data.pop("password_confirm")
        validated_data.pop("token")

        # Create user with invitation details
        user = User.objects.create_user(
            email=invitation.email,
            role=invitation.role,
            program_type=invitation.program_type,
            is_active=True,
            is_setup_complete=True,
            **validated_data,
        )

        # Mark invitation as used
        invitation.used_at = timezone.now()
        invitation.save()

        # If student, create enrollment
        if invitation.role == "student" and invitation.cohort:
            from apps.cohorts.models import Enrollment

            Enrollment.objects.create(student=user, cohort=invitation.cohort)

        return user


class InvitationDetailsSerializer(serializers.Serializer):
    """Serializer for returning invitation details for onboarding"""
    email = serializers.EmailField()
    role = serializers.CharField()
    program_type = serializers.CharField()
    cohort_name = serializers.CharField()


class OnboardingResponseSerializer(serializers.Serializer):
    """Serializer for onboarding response"""
    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    role = serializers.CharField()
