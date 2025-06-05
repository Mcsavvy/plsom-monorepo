from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from unfold.admin import ModelAdmin
from .models import User


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "role",
            "program_type",
            "title",
            "whatsapp_number",
            "profile_picture",
            "is_setup_complete",
            "is_staff",
            "is_superuser",
            "is_active",
        )


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "role",
            "program_type",
            "title",
            "whatsapp_number",
            "profile_picture",
            "is_setup_complete",
            "is_staff",
            "is_superuser",
            "is_active",
        )


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    list_display = (
        "email",
        "first_name",
        "last_name",
        "role",
        "is_staff",
        "is_superuser",
        "is_active",
    )
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "title",
                    "whatsapp_number",
                    "profile_picture",
                    "is_setup_complete",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "role",
                    "program_type",
                    "is_staff",
                    "is_superuser",
                    "is_active",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "role",
                    "program_type",
                    "title",
                    "whatsapp_number",
                    "profile_picture",
                    "is_setup_complete",
                    "is_staff",
                    "is_superuser",
                    "is_active",
                ),
            },
        ),
    )
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
