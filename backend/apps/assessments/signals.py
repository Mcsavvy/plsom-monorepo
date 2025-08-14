"""
Django signals for test notifications.
"""
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django_q.tasks import async_task
import logging

from .models import Test
from .tasks import schedule_deadline_reminder, cancel_deadline_reminder

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Test)
def handle_test_saved(sender, instance, created, **kwargs):
    """
    Handle test creation and updates.
    Send notifications for published tests.
    """
    try:
        # For new tests
        if created:
            if instance.status == 'published':
                # New test created and immediately published
                async_task(
                    'apps.assessments.tasks.send_test_notification_email',
                    instance.id,
                    'created'
                )
                logger.info(f"Scheduled 'created' notification for test {instance.id}")
                
                # Schedule deadline reminder if there's a deadline
                if instance.available_until:
                    schedule_deadline_reminder(instance.id)
        else:
            # Test was updated
            # We need to check what changed
            
            # Get the previous state from the database
            try:
                # Check if status changed from non-published to published
                if hasattr(instance, '_previous_status'):
                    if instance._previous_status != 'published' and instance.status == 'published':
                        # Test was just published
                        async_task(
                            'apps.assessments.tasks.send_test_notification_email',
                            instance.id,
                            'published'
                        )
                        logger.info(f"Scheduled 'published' notification for test {instance.id}")
                        
                        # Schedule deadline reminder if there's a deadline
                        if instance.available_until:
                            schedule_deadline_reminder(instance.id)
                
                # Check if deadline changed for published tests
                if instance.status == 'published':
                    if hasattr(instance, '_previous_deadline'):
                        if instance._previous_deadline != instance.available_until:
                            # Deadline changed, reschedule reminder
                            cancel_deadline_reminder(instance.id)
                            if instance.available_until:
                                schedule_deadline_reminder(instance.id)
                                
                    # Send update notification for published tests
                    if hasattr(instance, '_questions_updated') and instance._questions_updated:
                        async_task(
                            'apps.assessments.tasks.send_test_notification_email',
                            instance.id,
                            'updated'
                        )
                        logger.info(f"Scheduled 'updated' notification for test {instance.id}")
                        
            except Test.DoesNotExist:
                # This shouldn't happen for updates, but handle gracefully
                logger.warning(f"Could not find previous state for test {instance.id}")
                
    except Exception as e:
        logger.error(f"Error in test save signal handler: {str(e)}")


@receiver(pre_delete, sender=Test)
def handle_test_deleted(sender, instance, **kwargs):
    """
    Handle test deletion.
    Send notification if the test was published.
    """
    try:
        if instance.status == 'published':
            # Send deletion notification
            async_task(
                'apps.assessments.tasks.send_test_notification_email',
                instance.id,
                'deleted'
            )
            logger.info(f"Scheduled 'deleted' notification for test {instance.id}")
        
        # Cancel any scheduled deadline reminders
        cancel_deadline_reminder(instance.id)
        
    except Exception as e:
        logger.error(f"Error in test delete signal handler: {str(e)}")


# Custom signal functions that can be called from views
def trigger_test_published_notification(test_id):
    """
    Manually trigger a test published notification.
    Used when a test is published via the publish action.
    """
    async_task(
        'apps.assessments.tasks.send_test_notification_email',
        test_id,
        'published'
    )
    
    # Schedule deadline reminder
    try:
        test = Test.objects.get(id=test_id)
        if test.available_until:
            schedule_deadline_reminder(test_id)
    except Test.DoesNotExist:
        logger.error(f"Test {test_id} not found for deadline scheduling")


def trigger_test_updated_notification(test_id):
    """
    Manually trigger a test updated notification.
    Used when a test's questions are updated.
    """
    async_task(
        'apps.assessments.tasks.send_test_notification_email',
        test_id,
        'updated'
    )
