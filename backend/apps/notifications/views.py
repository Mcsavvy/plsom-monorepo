from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Notification, PushSubscription
from .serializers import NotificationSerializer, PushSubscriptionSerializer


@extend_schema_view(
    list=extend_schema(
        description="List user's notifications with pagination and filtering",
        summary="List notifications",
    ),
    retrieve=extend_schema(
        description="Get detailed notification information",
        summary="Get notification details",
    ),
)
@extend_schema(tags=["Notifications"])
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing user notifications.
    Provides read-only access to notifications with marking as read functionality.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["read", "type"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return notifications for the current user"""
        return Notification.objects.filter(user=self.request.user)

    @extend_schema(
        description="Get count of unread notifications",
        summary="Get unread count",
        responses={200: {"type": "object", "properties": {"count": {"type": "integer"}}}},
    )
    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(read=False).count()
        return Response({"count": count})

    @extend_schema(
        description="Mark a notification as read",
        summary="Mark as read",
        responses={200: NotificationSerializer},
    )
    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @extend_schema(
        description="Mark all notifications as read",
        summary="Mark all as read",
        responses={200: {"type": "object", "properties": {"updated": {"type": "integer"}}}},
    )
    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        """Mark all user's notifications as read"""
        now = timezone.now()
        updated = self.get_queryset().filter(read=False).update(
            read=True, read_at=now
        )
        return Response({"updated": updated})


@extend_schema_view(
    create=extend_schema(
        description="Register a browser push notification subscription",
        summary="Subscribe to push notifications",
    ),
    destroy=extend_schema(
        description="Unregister a browser push notification subscription",
        summary="Unsubscribe from push notifications",
    ),
)
@extend_schema(tags=["Notifications"])
class PushSubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing push notification subscriptions.
    """

    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["post", "delete"]

    def get_queryset(self):
        """Return subscriptions for the current user"""
        return PushSubscription.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create or update a push subscription"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        description="Unsubscribe from push notifications by endpoint",
        summary="Unsubscribe",
        request={"application/json": {"endpoint": "string"}},
        responses={204: None},
    )
    @action(detail=False, methods=["delete"])
    def unsubscribe(self, request):
        """Delete a push subscription by endpoint"""
        endpoint = request.data.get("endpoint")
        if not endpoint:
            return Response(
                {"error": "endpoint is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        deleted_count, _ = PushSubscription.objects.filter(
            user=request.user, endpoint=endpoint
        ).delete()

        if deleted_count > 0:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND
        )

