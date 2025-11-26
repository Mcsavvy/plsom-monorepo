from rest_framework import serializers
from .models import Notification, PushSubscription


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "message",
            "data",
            "read",
            "read_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "type",
            "title",
            "message",
            "data",
            "read_at",
            "created_at",
        ]


class PushSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for PushSubscription model"""

    class Meta:
        model = PushSubscription
        fields = [
            "id",
            "endpoint",
            "p256dh",
            "auth",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        """Create or update push subscription for the user"""
        user = self.context["request"].user
        endpoint = validated_data["endpoint"]

        # Update if subscription already exists for this endpoint
        subscription, created = PushSubscription.objects.update_or_create(
            user=user,
            endpoint=endpoint,
            defaults={
                "p256dh": validated_data["p256dh"],
                "auth": validated_data["auth"],
            },
        )
        return subscription
