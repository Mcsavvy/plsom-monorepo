from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UserManager(BaseUserManager):
    model: "User"

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must be assigned to is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must be assigned to is_superuser=True")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    objects = UserManager()
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
    title = models.CharField(
        max_length=20, choices=TITLES, null=True, blank=True
    )
    role = models.CharField(max_length=20, choices=ROLES)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(
        upload_to="profiles/", null=True, blank=True
    )
    is_setup_complete = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    def get_full_name(self) -> str:
        if self.title:
            return f"{self.title} {self.first_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
