from django.contrib import admin
from .models import Application


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "email",
        "phone",
        "gender",
        "program_type",
        "employment_status",
        "nationality",
        "submitted_at",
    ]
    list_filter = ["program_type", "gender", "employment_status", "nationality"]
    search_fields = ["full_name", "email", "phone", "nationality"]
    readonly_fields = ["submitted_at"]
    ordering = ["-submitted_at"]
