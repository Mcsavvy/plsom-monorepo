import uuid
from django.db import models

from apps.users.models import User

class Invitation(models.Model):
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=User.ROLES)
    program_type = models.CharField(max_length=20, choices=User.PROGRAM_TYPES, null=True)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.email} - {self.role} - {self.program_type}"
