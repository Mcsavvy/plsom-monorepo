from django.db import models

from apps.cohorts.models import Cohort
from apps.courses.models import Course
from apps.users.models import User


class Class(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="classes"
    )
    lecturer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="classes_taught"
    )
    cohort = models.ForeignKey(
        Cohort, on_delete=models.CASCADE, related_name="classes"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=90)
    zoom_meeting_id = models.CharField(max_length=50, null=True, blank=True)
    zoom_join_url = models.URLField(null=True, blank=True)
    password_for_zoom = models.CharField(max_length=200, null=True, blank=True)
    recording_url = models.URLField(null=True, blank=True)
    password_for_recording = models.CharField(
        max_length=200, null=True, blank=True
    )

    class Meta:
        ordering = ["scheduled_at"]
        verbose_name = "Class"
        verbose_name_plural = "Classes"

    def __str__(self):
        return f"{self.course.name} - {self.title}"


class Attendance(models.Model):
    class_session = models.ForeignKey(
        Class, on_delete=models.CASCADE, related_name="attendances"
    )
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="attendances"
    )
    join_time = models.DateTimeField()
    leave_time = models.DateTimeField(null=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    via_recording = models.BooleanField(default=False)
    verified = models.BooleanField(default=False)

    class Meta:
        ordering = ["join_time"]
        verbose_name = "Attendance"
        verbose_name_plural = "Attendances"
