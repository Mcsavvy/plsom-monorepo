from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Cohort, Enrollment

# Register your models here.
@admin.register(Cohort)
class CohortAdmin(ModelAdmin):
    pass

@admin.register(Enrollment)
class EnrollmentAdmin(ModelAdmin):
    pass
