from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AuditLog

@receiver(post_save, sender=LogEntry)
def sync_admin_logs_to_audit(sender, instance, created, **kwargs):
    """
    Automatically create audit logs from Django admin actions.
    Enhanced to capture more detailed information.
    """
    if created:
        action_map = {
            ADDITION: 'create',
            CHANGE: 'update', 
            DELETION: 'delete',
        }
        
        # Extract more meaningful data from admin log
        audit_data = {
            'change_message': instance.change_message,
            'admin_action': True,
            'object_repr': instance.object_repr,
        }
        
        if instance.content_type and instance.object_id and instance.action_flag != DELETION:
            try:
                model_class = instance.content_type.model_class()
                if model_class:
                    obj = model_class.objects.get(pk=instance.object_id)
                    # Serialize the object data (basic implementation)
                    from django.forms.models import model_to_dict
                    audit_data.update(model_to_dict(obj))
            except (model_class.DoesNotExist, AttributeError):
                pass
        
        AuditLog.objects.create(
            resource=instance.content_type.model if instance.content_type else 'unknown',
            action=action_map.get(instance.action_flag, 'update'),
            author=instance.user,
            author_name=instance.user.get_full_name() or instance.user.username if instance.user else 'System',
            content_type=instance.content_type,
            object_id=instance.object_id,
            data=audit_data,
            meta={
                'id': instance.object_id,
                'admin_action': True,
                'object_repr': instance.object_repr,
                'admin_log_id': instance.id,
            }
        )