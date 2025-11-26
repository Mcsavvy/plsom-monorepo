"""
Django Q tasks for assessment notifications.
"""

import datetime
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django_q.tasks import schedule
from django.utils import timezone
import logging

from .models import Test, Submission
from apps.users.models import User

logger = logging.getLogger(__name__)


def send_test_notification_email(test_id, notification_type, user_ids=None):
    """
    Send test notification email to students.

    Args:
        test_id: ID of the test
        notification_type: Type of notification ('created', 'updated', 'deleted', 'published', 'deadline_reminder')
        user_ids: List of user IDs to notify (if None, notify all cohort students)
    """
    try:
        test = Test.objects.select_related(
            "course", "cohort", "created_by"
        ).get(id=test_id)

        # Only send notifications for published tests (except for 'published' notification)
        if notification_type != "published" and test.status != "published":
            logger.info(
                f"Skipping notification for non-published test {test_id}"
            )
            return

        # Get recipients
        if user_ids:
            recipients = User.objects.filter(id__in=user_ids, role="student")
        else:
            # Get students enrolled in the cohort through the Enrollment model
            recipients = User.objects.filter(
                enrollments__cohort=test.cohort, role="student", is_active=True
            )

        if not recipients.exists():
            logger.info(f"No recipients found for test {test_id} notification")
            return

        # Prepare email content
        context = {
            "test": test,
            "course": test.course,
            "cohort": test.cohort,
            "instructor": test.created_by,
            "notification_type": notification_type,
        }

        # Generate subject and template based on notification type
        subject_map = {
            "created": f"New Test Available: {test.title}",
            "updated": f"Test Updated: {test.title}",
            "deleted": f"Test Removed: {test.title}",
            "published": f"New Test Published: {test.title}",
            "deadline_reminder": f"Test Deadline Reminder: {test.title}",
        }

        html_template_map = {
            "created": "emails/test_created.html",
            "updated": "emails/test_updated.html",
            "deleted": "emails/test_deleted.html",
            "published": "emails/test_published.html",
            "deadline_reminder": "emails/test_deadline_reminder.html",
        }

        text_template_map = {
            "created": "emails/test_created.txt",
            "updated": "emails/test_updated.txt",
            "deleted": "emails/test_deleted.txt",
            "published": "emails/test_published.txt",
            "deadline_reminder": "emails/test_deadline_reminder.txt",
        }

        subject = subject_map.get(
            notification_type, f"Test Notification: {test.title}"
        )
        html_template = html_template_map.get(
            notification_type, "emails/test_notification.html"
        )
        text_template = text_template_map.get(
            notification_type, "emails/test_notification.txt"
        )

        # Generate email content
        html_message = render_to_string(html_template, context)
        plain_message = render_to_string(text_template, context)

        # Send to each recipient
        recipient_emails = [user.email for user in recipients if user.email]

        if recipient_emails:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_emails,
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(
                f"Sent {notification_type} notification for test {test_id} to {len(recipient_emails)} recipients"
            )
        else:
            logger.warning(
                f"No email addresses found for test {test_id} notification"
            )

    except Test.DoesNotExist:
        logger.error(f"Test {test_id} not found for notification")
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")


def send_submission_returned_notification(submission_id):
    """
    Send notification to student when their submission is returned due to breaking changes.

    Args:
        submission_id: ID of the submission that was returned
    """
    try:
        submission = Submission.objects.select_related(
            "test",
            "test__course",
            "test__cohort",
            "test__created_by",
            "student",
        ).get(id=submission_id)

        if submission.status != "returned":
            logger.info(
                f"Submission {submission_id} is not returned, skipping notification"
            )
            return

        # Prepare email content
        context = {
            "submission": submission,
            "test": submission.test,
            "course": submission.test.course,
            "cohort": submission.test.cohort,
            "instructor": submission.test.created_by,
            "student": submission.student,
        }

        subject = f"Submission Returned: {submission.test.title}"
        html_template = "emails/submission_returned.html"
        text_template = "emails/submission_returned.txt"

        # Generate email content
        html_message = render_to_string(html_template, context)
        plain_message = render_to_string(text_template, context)

        # Send to student
        if submission.student.email:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[submission.student.email],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(
                f"Sent submission returned notification for submission {submission_id} to {submission.student.email}"
            )
        else:
            logger.warning(
                f"No email address found for student {submission.student.id}"
            )

    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found for notification")
    except Exception as e:
        logger.error(
            f"Error sending submission returned notification: {str(e)}"
        )


def schedule_deadline_reminder(test_id):
    """
    Schedule a deadline reminder to be sent the day of the test deadline.
    Now uses in-app notifications instead of email.
    """
    try:
        test = Test.objects.get(id=test_id)

        if not test.available_until:
            logger.info(
                f"Test {test_id} has no deadline, skipping reminder scheduling"
            )
            return

        # Calculate when to send the reminder (day of deadline, 9 AM)
        deadline_date = test.available_until.date()
        reminder_datetime = timezone.make_aware(
            timezone.datetime.combine(deadline_date, datetime.time(9, 0))
        )

        # Only schedule if the reminder is in the future
        if reminder_datetime > timezone.now():
            schedule(
                "apps.notifications.tasks.send_test_notification",
                test_id,
                "test_deadline_reminder",
                schedule_type="O",  # One-time task
                next_run=reminder_datetime,
                task_name=f"deadline_reminder_test_{test_id}",
            )
            logger.info(
                f"Scheduled deadline reminder for test {test_id} at {reminder_datetime}"
            )
        else:
            logger.info(
                f"Deadline {reminder_datetime} is in the past, not scheduling reminder for test {test_id}"
            )

    except Test.DoesNotExist:
        logger.error(
            f"Test {test_id} not found for deadline reminder scheduling"
        )
    except Exception as e:
        logger.error(f"Error scheduling deadline reminder: {str(e)}")


def cancel_deadline_reminder(test_id):
    """
    Cancel any scheduled deadline reminder for a test.
    """
    try:
        from django_q.models import Schedule

        # Cancel existing deadline reminder
        Schedule.objects.filter(
            name=f"deadline_reminder_test_{test_id}"
        ).delete()

        logger.info(f"Cancelled deadline reminder for test {test_id}")

    except Exception as e:
        logger.error(f"Error cancelling deadline reminder: {str(e)}")


def send_bulk_test_notification(test_id, notification_type, chunk_size=50):
    """
    Send notifications in chunks to avoid overwhelming the email server.
    """
    try:
        test = Test.objects.get(id=test_id)
        # Get students enrolled in the cohort through the Enrollment model
        recipients = User.objects.filter(
            enrollments__cohort=test.cohort, role="student", is_active=True
        )

        # Process in chunks
        recipient_ids = list(recipients.values_list("id", flat=True))

        for i in range(0, len(recipient_ids), chunk_size):
            chunk = recipient_ids[i : i + chunk_size]
            send_test_notification_email(test_id, notification_type, chunk)

    except Exception as e:
        logger.error(f"Error in bulk notification: {str(e)}")
