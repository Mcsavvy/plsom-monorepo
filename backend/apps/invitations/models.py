import uuid
from django.db import models
from django.utils import timezone
from apps.users.models import User
from apps.cohorts.models import Cohort


class Invitation(models.Model):
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=User.ROLES)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    cohort = models.ForeignKey(
        Cohort,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="Only required for students.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} - {self.role}"

    @property
    def is_expired(self) -> bool:
        return self.expires_at < timezone.now()

    @property
    def is_used(self) -> bool:
        return self.used_at is not None
