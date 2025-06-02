from django.db import models

from apps.users.models import User

class Course(models.Model):
    name = models.CharField(max_length=200)
    program_type = models.CharField(max_length=20, choices=User.PROGRAM_TYPES)
    module_count = models.PositiveIntegerField()
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
