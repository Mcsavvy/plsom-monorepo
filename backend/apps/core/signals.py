from typing import Any
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import models
from .models import AuditLog


def serialize_model_instance(instance):
    """
    Serialize a model instance to a JSON-serializable dictionary.
    Handles ForeignKey relationships by storing only the ID and string representation.
    """
    data: dict[str, Any] = {}

    for field in instance._meta.fields:
        field_name = field.name
        field_value = getattr(instance, field_name)

        if field_value is None:
            data[field_name] = None
        elif isinstance(field, models.ForeignKey):
            # For ForeignKey fields, store ID and string representation
            data[field_name] = {"id": field_value.pk, "str": str(field_value)}
        elif isinstance(
            field, (models.DateTimeField, models.DateField, models.TimeField)
        ):
            # Convert datetime objects to ISO format strings
            data[field_name] = field_value.isoformat() if field_value else None
        elif isinstance(field, models.JSONField):
            # JSONField should already be serializable
            data[field_name] = field_value
        else:
            # For other field types, convert to string if not already serializable
            try:
                # Test if it's JSON serializable
                import json

                json.dumps(field_value)
                data[field_name] = field_value
            except (TypeError, ValueError):
                data[field_name] = str(field_value)

    return data


@receiver(post_save, sender=LogEntry)
def sync_admin_logs_to_audit(sender, instance, created, **kwargs):
    """
    Automatically create audit logs from Django admin actions.
    Enhanced to capture more detailed information.
    """
    if created:
        action_map = {
            ADDITION: "create",
            CHANGE: "update",
            DELETION: "delete",
        }

        # Extract more meaningful data from admin log
        audit_data = {
            "change_message": instance.change_message,
            "admin_action": True,
            "object_repr": instance.object_repr,
        }

        if (
            instance.content_type
            and instance.object_id
            and instance.action_flag != DELETION
        ):
            try:
                model_class = instance.content_type.model_class()
                if model_class:
                    # skip AuditLog model
                    if model_class == AuditLog:
                        return
                    obj = model_class.objects.get(pk=instance.object_id)
                    # Use our custom serialization function instead of model_to_dict
                    audit_data.update(serialize_model_instance(obj))
            except (model_class.DoesNotExist, AttributeError):
                pass

        AuditLog.objects.create(
            resource=instance.content_type.model
            if instance.content_type
            else "unknown",
            action=action_map.get(instance.action_flag, "update"),
            author=instance.user,
            author_name=instance.user.get_full_name() or instance.user.username
            if instance.user
            else "System",
            content_type=instance.content_type,
            object_id=instance.object_id,
            data=audit_data,
            meta={
                "id": instance.object_id,
                "admin_action": True,
                "object_repr": instance.object_repr,
                "admin_log_id": instance.id,
            },
        )
