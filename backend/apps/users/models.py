from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLES = (
        ('admin', 'Admin'),
        ('lecturer', 'Lecturer'),
        ('student', 'Student'),
    )
    PROGRAM_TYPES = (
        ('certificate', 'Certificate'),
        ('diploma', 'Diploma'),
    )
    
    role = models.CharField(max_length=20, choices=ROLES)
    program_type = models.CharField(max_length=20, choices=PROGRAM_TYPES, null=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True)
    is_setup_complete = models.BooleanField(default=False)