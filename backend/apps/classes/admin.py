from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Class, Attendance

# Register your models here.
@admin.register(Class)
class ClassAdmin(ModelAdmin):
    pass

@admin.register(Attendance)
class AttendanceAdmin(ModelAdmin):
    pass
