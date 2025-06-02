from rest_framework import serializers
from .models import Invitation


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = [
            "id",
            "email",
            "role",
            "program_type",
            "cohort",
            "token",
            "expires_at",
            "used_at",
            "created_by",
            "is_expired",
            "is_used",
        ]
        read_only_fields = [
            "id",
            "token",
            "used_at",
            "created_by",
            "is_expired",
            "is_used",
        ]

    def validate(self, data):
        role = data.get("role")
        program_type = data.get("program_type")
        cohort = data.get("cohort")
        if role == "student":
            if not program_type:
                raise serializers.ValidationError(
                    {"program_type": "This field is required for students."}
                )
            if not cohort:
                raise serializers.ValidationError(
                    {"cohort": "This field is required for students."}
                )
        return data
