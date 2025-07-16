from rest_framework import serializers

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

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
            "program_type",
            "whatsapp_number",
            "profile_picture",
            "is_setup_complete",
            "is_staff",
            "is_active",
        )
        read_only_fields = (
            "is_staff",
            "is_active",
            "role",
            "program_type",
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
            raise serializers.ValidationError("Image file size must be less than 5MB.")

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
