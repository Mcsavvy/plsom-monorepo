from django.db import models

from apps.users.models import User

class Cohort(models.Model):
    name = models.CharField(max_length=100)
    program_type = models.CharField(max_length=20, choices=User.PROGRAM_TYPES)
    is_active = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField(null=True)

    def __str__(self):
        return f"{self.name} - {self.program_type}"

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.cohort.name}"
