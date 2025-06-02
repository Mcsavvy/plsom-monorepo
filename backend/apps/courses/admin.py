from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Course

# Register your models here.
@admin.register(Course)
class CourseAdmin(ModelAdmin):
    pass
