from rest_framework import serializers

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "title",
            "role",
            "program_type",
            "whatsapp_number",
            "profile_picture",
            "is_setup_complete",
            "is_staff",
            "is_active",
        )
        read_only_fields = ("is_staff", "is_active", "role")


class PromoteDemoteResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
