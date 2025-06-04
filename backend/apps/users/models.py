from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLES = (
        ("admin", "Admin"),
        ("lecturer", "Lecturer"),
        ("student", "Student"),
    )
    PROGRAM_TYPES = (
        ("certificate", "Certificate"),
        ("diploma", "Diploma"),
    )
    TITLES = (
        ("Mr", "Mr"),
        ("Mrs", "Mrs"),
        ("Dr", "Dr"),
        ("Prof", "Prof"),
        ("Ms", "Ms"),
        ("Miss", "Miss"),
        ("Rev", "Rev"),
        ("Min", "Minister"),
        ("Pastor", "Pastor"),
        ("Apostle", "Apostle"),
        ("Bishop", "Bishop"),
        ("Evangelist", "Evangelist"),
        ("Deacon", "Deacon"),
        ("Elder", "Elder"),
    )

    # Remove username, use email as USERNAME_FIELD
    username = None
    email = models.EmailField(unique=True)
    title = models.CharField(max_length=20, choices=TITLES, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLES)
    program_type = models.CharField(
        max_length=20, choices=PROGRAM_TYPES, null=True, blank=True
    )
    whatsapp_number = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to="profiles/", null=True)
    is_setup_complete = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def get_full_name(self) -> str:
        if self.title:
            return f"{self.title} {self.first_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
