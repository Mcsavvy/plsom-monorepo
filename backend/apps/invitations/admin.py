from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Invitation

# Register your models here.


@admin.register(Invitation)
class InvitationAdmin(ModelAdmin):
    pass
