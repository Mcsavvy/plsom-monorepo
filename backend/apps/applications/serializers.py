from rest_framework import serializers
from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            "id",
            "full_name",
            "father_name",
            "mother_name",
            "gender",
            "phone",
            "email",
            "full_residential_address",
            "nationality",
            "employment_status",
            "program_type",
            "program_interest",
            "submitted_at",
        ]
        read_only_fields = ["id", "submitted_at"]

    def validate_email(self, value):
        normalized = value.strip().lower()
        # Skip duplicate check on update (shouldn't happen but safe)
        instance = self.instance
        qs = Application.objects.filter(email__iexact=normalized)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "An application with this email has already been submitted."
            )
        return normalized


class InviteFromApplicationSerializer(serializers.Serializer):
    """Payload for inviting a student directly from an application."""

    cohort = serializers.IntegerField(help_text="Cohort ID to assign the student to.")
