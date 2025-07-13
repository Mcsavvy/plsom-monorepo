from django.contrib import admin
from django_q.models import OrmQ, Schedule
from unfold.admin import ModelAdmin

admin.site.unregister(OrmQ)
admin.site.unregister(Schedule)


@admin.register(OrmQ)
class OrmQAdmin(ModelAdmin):
    pass


@admin.register(Schedule)
class ScheduleAdmin(ModelAdmin):
    pass
