from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Notification, PushSubscription


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ["user", "type", "title", "read", "created_at"]
    list_filter = ["type", "read", "created_at"]
    search_fields = ["user__email", "title", "message"]
    readonly_fields = ["created_at", "read_at"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "Notification Details",
            {
                "fields": (
                    "user",
                    "type",
                    "title",
                    "message",
                    "data",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "read",
                    "read_at",
                    "created_at",
                )
            },
        ),
    )

    def has_add_permission(self, request):
        """Notifications should be created programmatically"""
        return False


@admin.register(PushSubscription)
class PushSubscriptionAdmin(ModelAdmin):
    list_display = ["user", "endpoint_short", "created_at", "updated_at"]
    list_filter = ["created_at", "updated_at"]
    search_fields = ["user__email", "endpoint"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def endpoint_short(self, obj):
        """Show shortened endpoint URL"""
        return (
            f"{obj.endpoint[:50]}..."
            if len(obj.endpoint) > 50
            else obj.endpoint
        )

    endpoint_short.short_description = "Endpoint"

    fieldsets = (
        (
            "Subscription Details",
            {
                "fields": (
                    "user",
                    "endpoint",
                    "p256dh",
                    "auth",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )
