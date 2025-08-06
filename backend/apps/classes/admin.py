from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Class, Attendance


@admin.register(Class)
class ClassAdmin(ModelAdmin):
    """Admin interface for Class model"""

    list_display = [
        "title",
        "course",
        "lecturer", 
        "cohort",
        "scheduled_at",
        "duration_minutes",
    ]
    list_filter = [
        "course",
        "lecturer",
        "cohort",
        "scheduled_at",
    ]
    search_fields = [
        "title",
        "description",
        "course__name",
        "lecturer__first_name",
        "lecturer__last_name",
    ]
    ordering = ["scheduled_at"]
    readonly_fields = ["zoom_meeting_id"]  # Hide meeting ID from admin
    
    fieldsets = (
        (
            "Class Information",
            {"fields": ("title", "description", "course", "lecturer", "cohort")},
        ),
        (
            "Schedule",
            {"fields": ("scheduled_at", "duration_minutes")},
        ),
        (
            "Zoom Details",
            {"fields": ("zoom_join_url", "password_for_zoom")},
        ),
        (
            "Recording",
            {"fields": ("recording_url", "password_for_recording")},
        ),
        (
            "System",
            {
                "fields": ("zoom_meeting_id",),
                "classes": ("collapse",),
                "description": "Auto-extracted from Zoom URL",
            },
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset for admin listing"""
        return super().get_queryset(request).select_related("course", "lecturer", "cohort")


@admin.register(Attendance)
class AttendanceAdmin(ModelAdmin):
    """Admin interface for Attendance model"""

    list_display = [
        "class_session",
        "student",
        "join_time",
        "leave_time", 
        "duration_minutes",
        "via_recording",
    ]
    list_filter = [
        "class_session__course",
        "class_session__cohort",
        "via_recording",
        "join_time",
    ]
    search_fields = [
        "student__first_name",
        "student__last_name",
        "class_session__title",
    ]
    ordering = ["-join_time"]

    def get_queryset(self, request):
        """Optimize queryset for admin listing"""
        return super().get_queryset(request).select_related("student", "class_session")
