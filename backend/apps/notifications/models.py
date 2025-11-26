from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    """
    Represents an in-app notification for a user.
    """

    NOTIFICATION_TYPES = [
        ("class_starting", "Class Starting"),
        ("test_created", "Test Created"),
        ("test_published", "Test Published"),
        ("test_updated", "Test Updated"),
        ("test_deleted", "Test Deleted"),
        ("test_deadline_reminder", "Test Deadline Reminder"),
        ("submission_created", "Submission Created"),
        ("submission_graded", "Submission Graded"),
        ("submission_returned", "Submission Returned"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context data (class_id, test_id, submission_id, etc.)",
    )
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "read", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["type", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone

        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save(update_fields=["read", "read_at"])


class PushSubscription(models.Model):
    """
    Stores Web Push notification subscription details for a user.
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="push_subscriptions"
    )
    endpoint = models.URLField(max_length=500)
    p256dh = models.CharField(
        max_length=255, help_text="Public key for encryption (p256dh)"
    )
    auth = models.CharField(
        max_length=255, help_text="Auth secret for encryption"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "endpoint"], name="unique_user_endpoint"
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.endpoint[:50]}..."
