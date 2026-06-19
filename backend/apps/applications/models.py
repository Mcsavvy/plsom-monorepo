from django.db import models


class Application(models.Model):
    GENDER_CHOICES = [
        ("MALE", "Male"),
        ("FEMALE", "Female"),
    ]
    EMPLOYMENT_STATUS_CHOICES = [
        ("EMPLOYED", "Employed"),
        ("UNEMPLOYED", "Unemployed"),
        ("STUDENT", "Student"),
    ]
    PROGRAM_TYPE_CHOICES = [
        ("CERTIFICATE", "Certificate"),
        ("DIPLOMA", "Diploma"),
    ]

    full_name = models.CharField(max_length=255)
    father_name = models.CharField(max_length=255)
    mother_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=30)
    email = models.EmailField(unique=True)
    full_residential_address = models.TextField()
    nationality = models.CharField(max_length=100)
    employment_status = models.CharField(
        max_length=20, choices=EMPLOYMENT_STATUS_CHOICES
    )
    program_type = models.CharField(max_length=20, choices=PROGRAM_TYPE_CHOICES)
    program_interest = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.full_name} <{self.email}> — {self.program_type}"
