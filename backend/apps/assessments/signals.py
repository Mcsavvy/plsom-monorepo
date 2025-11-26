"""
Django signals for test notifications.
"""

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django_q.tasks import async_task
import logging

from .models import Test, Submission
from .tasks import schedule_deadline_reminder, cancel_deadline_reminder

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Test)
def handle_test_saved(sender, instance, created, **kwargs):
    """
    Handle test creation and updates.
    Send notifications for published tests.
    """
    try:
        # Skip notifications for internal saves where signals are explicitly
        # suppressed (e.g., when recalculating total_points).
        if getattr(instance, "_suppress_notification_signals", False):
            return

        # For new tests
        if created:
            if instance.status == "published":
                # New test created and immediately published
                # Send in-app notification
                async_task(
                    "apps.notifications.tasks.send_test_notification",
                    instance.id,
                    "test_created",
                )
                logger.info(
                    f"Scheduled 'created' notification for test {instance.id}"
                )

                # Schedule deadline reminder if there's a deadline
                if instance.available_until:
                    schedule_deadline_reminder(instance.id)
        else:
            # Test was updated
            # We need to check what changed

            # Get the previous state from the database
            try:
                # Check if status changed from non-published to published
                if hasattr(instance, "_previous_status"):
                    if (
                        instance._previous_status != "published"
                        and instance.status == "published"
                    ):
                        # Test was just published
                        # Send in-app notification
                        async_task(
                            "apps.notifications.tasks.send_test_notification",
                            instance.id,
                            "test_published",
                        )
                        logger.info(
                            f"Scheduled 'published' notification for test {instance.id}"
                        )

                        # Schedule deadline reminder if there's a deadline
                        if instance.available_until:
                            schedule_deadline_reminder(instance.id)

                # Check if deadline changed for published tests
                if instance.status == "published":
                    if hasattr(instance, "_previous_deadline"):
                        if (
                            instance._previous_deadline
                            != instance.available_until
                        ):
                            # Deadline changed, reschedule reminder
                            cancel_deadline_reminder(instance.id)
                            if instance.available_until:
                                schedule_deadline_reminder(instance.id)

                    # Send update notification for published tests
                    if (
                        hasattr(instance, "_questions_updated")
                        and instance._questions_updated
                    ):
                        # Send in-app notification
                        async_task(
                            "apps.notifications.tasks.send_test_notification",
                            instance.id,
                            "test_updated",
                        )
                        logger.info(
                            f"Scheduled 'updated' notification for test {instance.id}"
                        )

            except Test.DoesNotExist:
                # This shouldn't happen for updates, but handle gracefully
                logger.warning(
                    f"Could not find previous state for test {instance.id}"
                )

    except Exception as e:
        logger.error(f"Error in test save signal handler: {str(e)}")


@receiver(post_save, sender=Submission)
def handle_submission_saved(sender, instance, created, **kwargs):
    """
    Handle submission creation and status changes.
    Send notifications when submissions are created, graded, or returned.
    """
    try:
        # New submission created
        if created:
            # Send notification to admins/lecturers
            async_task(
                "apps.notifications.tasks.send_submission_notification",
                instance.id,
                "submission_created",
            )
            logger.info(
                f"Scheduled 'submission_created' notification for submission {instance.id}"
            )
        else:
            # Check for status changes
            if instance.status == "graded":
                # Send notification to admins/lecturers
                async_task(
                    "apps.notifications.tasks.send_submission_notification",
                    instance.id,
                    "submission_graded",
                )
                logger.info(
                    f"Scheduled 'submission_graded' notification for submission {instance.id}"
                )
            elif instance.status == "returned":
                # Send in-app notification to student about returned submission
                async_task(
                    "apps.notifications.tasks.send_submission_returned_notification_to_student",
                    instance.id,
                )
                # Send notification to admins/lecturers
                async_task(
                    "apps.notifications.tasks.send_submission_notification",
                    instance.id,
                    "submission_returned",
                )
                logger.info(
                    f"Scheduled 'returned' notification for submission {instance.id}"
                )

    except Exception as e:
        logger.error(f"Error in submission save signal handler: {str(e)}")


@receiver(pre_delete, sender=Test)
def handle_test_deleted(sender, instance, **kwargs):
    """
    Handle test deletion.
    Send notification if the test was published.
    """
    try:
        if instance.status == "published":
            # Send in-app notification
            async_task(
                "apps.notifications.tasks.send_test_notification",
                instance.id,
                "test_deleted",
            )
            logger.info(
                f"Scheduled 'deleted' notification for test {instance.id}"
            )

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
        "apps.notifications.tasks.send_test_notification",
        test_id,
        "test_published",
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
        "apps.notifications.tasks.send_test_notification",
        test_id,
        "test_updated",
    )


def trigger_submission_returned_notification(submission_id):
    """
    Manually trigger a submission returned notification.
    Used when a submission is returned due to breaking changes.
    """
    async_task(
        "apps.notifications.tasks.send_submission_returned_notification_to_student",
        submission_id,
    )
