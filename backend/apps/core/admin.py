from django.contrib import admin
from django_q.models import OrmQ, Schedule
from unfold.admin import ModelAdmin
from .models import AuditLog

admin.site.unregister(OrmQ)
admin.site.unregister(Schedule)


@admin.register(OrmQ)
class OrmQAdmin(ModelAdmin):
    pass


@admin.register(Schedule)
class ScheduleAdmin(ModelAdmin):
    pass


@admin.register(AuditLog)
class AuditLogAdmin(ModelAdmin):
    list_display = ("resource", "action", "author", "timestamp")
    list_filter = ("resource", "action", "author", "timestamp")
    search_fields = ("resource", "author", "timestamp")
    ordering = ("-timestamp",)
    list_per_page = 20
    list_max_show_all = 20
    list_editable = ("action",)
