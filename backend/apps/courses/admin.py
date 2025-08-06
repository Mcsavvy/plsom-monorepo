from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Course


@admin.register(Course)
class CourseAdmin(ModelAdmin):
    """Admin interface for Course model"""

    list_display = [
        "name",
        "program_type",
        "lecturer",
        "module_count",
        "is_active",
        "created_at",
    ]
    list_filter = ["program_type", "is_active", "lecturer", "created_at"]
    search_fields = [
        "name",
        "description",
        "lecturer__first_name",
        "lecturer__last_name",
    ]
    ordering = ["name"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (
            "Course Information",
            {"fields": ("name", "program_type", "module_count", "description")},
        ),
        ("Assignment", {"fields": ("lecturer",)}),
        ("Status", {"fields": ("is_active",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset for admin listing"""
        return super().get_queryset(request).select_related()
