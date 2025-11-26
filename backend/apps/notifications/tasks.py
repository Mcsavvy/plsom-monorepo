"""
Background tasks for sending notifications using Django Q.
"""

import logging
from typing import List, Optional
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from apps.users.models import User
from apps.classes.models import Class
from apps.assessments.models import Test, Submission
from apps.cohorts.models import Enrollment
from .models import Notification, PushSubscription

logger = logging.getLogger(__name__)


def create_notification(
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    data: dict = None,
    send_push: bool = True,
) -> Optional[int]:
    """
    Create a notification for a user.

    Args:
        user_id: User ID to send notification to
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        data: Additional context data
        send_push: Whether to send push notification

    Returns:
        Notification ID if created successfully, None otherwise
    """
    try:
        user = User.objects.get(id=user_id)
        notification = Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            data=data or {},
        )

        # Send push notification if requested
        if send_push:
            send_push_notification(user_id, notification.id)

        return notification.id

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for notification")
        return None
    except Exception as e:
        logger.error(f"Error creating notification for user {user_id}: {str(e)}")
        return None


def send_push_notification(user_id: int, notification_id: int):
    """
    Send browser push notification to user's subscribed devices.

    Args:
        user_id: User ID
        notification_id: Notification ID
    """
    try:
        from pywebpush import webpush, WebPushException
        import json

        notification = Notification.objects.get(id=notification_id)
        subscriptions = PushSubscription.objects.filter(user_id=user_id)

        if not subscriptions.exists():
            logger.info(f"No push subscriptions found for user {user_id}")
            return

        # Prepare push notification payload
        payload = json.dumps(
            {
                "title": notification.title,
                "body": notification.message,
                "icon": "/icons/icon-192x192.png",
                "badge": "/icons/badge-72x72.png",
                "data": {
                    "notification_id": notification.id,
                    "type": notification.type,
                    **notification.data,
                },
            }
        )

        # VAPID claims
        vapid_claims = {
            "sub": f"mailto:{settings.VAPID_EMAIL}",
        }

        # Send to all user's subscriptions
        for subscription in subscriptions:
            try:
                subscription_info = {
                    "endpoint": subscription.endpoint,
                    "keys": {
                        "p256dh": subscription.p256dh,
                        "auth": subscription.auth,
                    },
                }

                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims=vapid_claims,
                )

                logger.info(
                    f"Push notification sent to user {user_id} endpoint {subscription.endpoint[:50]}"
                )

            except WebPushException as e:
                logger.error(
                    f"WebPush error for user {user_id}: {str(e)}"
                )
                # If subscription is no longer valid, delete it
                if e.response and e.response.status_code in [404, 410]:
                    subscription.delete()
                    logger.info(
                        f"Deleted invalid subscription for user {user_id}"
                    )

    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
    except Exception as e:
        logger.error(
            f"Error sending push notification to user {user_id}: {str(e)}"
        )


def send_class_starting_notification(class_id: int):
    """
    Send notification to all students in a cohort when class is starting soon.

    Args:
        class_id: ID of the class starting soon
    """
    try:
        class_obj = Class.objects.select_related(
            "course", "cohort", "lecturer"
        ).get(id=class_id)

        # Get all students enrolled in the cohort
        enrolled_students = User.objects.filter(
            enrollments__cohort=class_obj.cohort,
            role="student",
            is_active=True,
        ).distinct()

        if not enrolled_students.exists():
            logger.info(f"No students found for class {class_id}")
            return

        # Format time remaining
        time_diff = class_obj.scheduled_at - timezone.now()
        minutes_remaining = int(time_diff.total_seconds() / 60)

        title = f"Class Starting Soon: {class_obj.title}"
        message = (
            f"{class_obj.course.name} starts in {minutes_remaining} minutes. "
            f"Lecturer: {class_obj.lecturer.get_full_name()}"
        )

        data = {
            "class_id": class_id,
            "course_name": class_obj.course.name,
            "class_title": class_obj.title,
            "scheduled_at": class_obj.scheduled_at.isoformat(),
            "zoom_join_url": class_obj.zoom_join_url,
        }

        # Create notification for each student
        for student in enrolled_students:
            create_notification(
                user_id=student.id,
                notification_type="class_starting",
                title=title,
                message=message,
                data=data,
                send_push=True,
            )

        logger.info(
            f"Class starting notifications sent for class {class_id} to {enrolled_students.count()} students"
        )

    except Class.DoesNotExist:
        logger.error(f"Class {class_id} not found")
    except Exception as e:
        logger.error(
            f"Error sending class starting notification for class {class_id}: {str(e)}"
        )


def send_test_notification(
    test_id: int, notification_type: str, user_ids: Optional[List[int]] = None
):
    """
    Send test-related notifications to students in the cohort.

    Args:
        test_id: ID of the test
        notification_type: Type of notification ('test_created', 'test_published', 'test_updated', 'test_deleted')
        user_ids: Optional list of specific user IDs to notify
    """
    try:
        test = Test.objects.select_related("course", "cohort", "created_by").get(
            id=test_id
        )

        # Get recipients
        if user_ids:
            recipients = User.objects.filter(id__in=user_ids, role="student")
        else:
            recipients = User.objects.filter(
                enrollments__cohort=test.cohort,
                role="student",
                is_active=True,
            ).distinct()

        if not recipients.exists():
            logger.info(f"No recipients found for test {test_id} notification")
            return

        # Prepare notification content based on type
        notification_titles = {
            "test_created": f"New Test: {test.title}",
            "test_published": f"Test Published: {test.title}",
            "test_updated": f"Test Updated: {test.title}",
            "test_deleted": f"Test Deleted: {test.title}",
            "test_deadline_reminder": f"Test Deadline Reminder: {test.title}",
        }

        notification_messages = {
            "test_created": f"A new test '{test.title}' has been created for {test.course.name}.",
            "test_published": f"The test '{test.title}' for {test.course.name} is now available.",
            "test_updated": f"The test '{test.title}' has been updated. Please review the changes.",
            "test_deleted": f"The test '{test.title}' has been removed.",
            "test_deadline_reminder": f"Reminder: The test '{test.title}' deadline is today. Don't forget to submit!",
        }

        title = notification_titles.get(notification_type, f"Test Notification: {test.title}")
        message = notification_messages.get(
            notification_type,
            f"Update regarding test: {test.title}",
        )

        data = {
            "test_id": test_id,
            "test_title": test.title,
            "course_name": test.course.name,
            "cohort_name": test.cohort.name,
        }

        # Add deadline info if available
        if test.available_until:
            data["deadline"] = test.available_until.isoformat()

        # Create notification for each recipient
        for recipient in recipients:
            create_notification(
                user_id=recipient.id,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data,
                send_push=False,  # In-app only for test notifications
            )

        logger.info(
            f"Test notifications ({notification_type}) sent for test {test_id} to {recipients.count()} students"
        )

    except Test.DoesNotExist:
        logger.error(f"Test {test_id} not found")
    except Exception as e:
        logger.error(
            f"Error sending test notification for test {test_id}: {str(e)}"
        )


def send_submission_returned_notification_to_student(submission_id: int):
    """
    Send notification to student when their submission is returned.

    Args:
        submission_id: ID of the submission that was returned
    """
    try:
        submission = Submission.objects.select_related(
            "test", "test__course", "student"
        ).get(id=submission_id)

        if submission.status != "returned":
            logger.info(
                f"Submission {submission_id} is not returned, skipping notification"
            )
            return

        title = f"Submission Returned: {submission.test.title}"
        message = (
            f"Your submission for '{submission.test.title}' has been returned. "
            f"Please review the feedback and resubmit."
        )

        data = {
            "submission_id": submission_id,
            "test_id": submission.test.id,
            "test_title": submission.test.title,
            "course_name": submission.test.course.name,
        }

        # Create notification for the student
        create_notification(
            user_id=submission.student.id,
            notification_type="submission_returned",
            title=title,
            message=message,
            data=data,
            send_push=False,  # In-app only
        )

        logger.info(
            f"Submission returned notification sent to student {submission.student.id} for submission {submission_id}"
        )

    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found")
    except Exception as e:
        logger.error(
            f"Error sending submission returned notification for submission {submission_id}: {str(e)}"
        )


def send_submission_notification(submission_id: int, notification_type: str):
    """
    Send submission-related notifications to admins and lecturers.

    Args:
        submission_id: ID of the submission
        notification_type: Type of notification ('submission_created', 'submission_graded', 'submission_returned')
    """
    try:
        submission = Submission.objects.select_related(
            "test", "test__course", "test__created_by", "student"
        ).get(id=submission_id)

        # Get recipients (admins and test creator/course lecturer)
        recipients = User.objects.filter(role="admin", is_active=True)

        # Add test creator if they're a lecturer
        if submission.test.created_by and submission.test.created_by.role in [
            "lecturer",
            "admin",
        ]:
            recipients = recipients | User.objects.filter(
                id=submission.test.created_by.id
            )

        # Add course lecturer if different from test creator
        if (
            submission.test.course.lecturer
            and submission.test.course.lecturer.role in ["lecturer", "admin"]
        ):
            recipients = recipients | User.objects.filter(
                id=submission.test.course.lecturer.id
            )

        recipients = recipients.distinct()

        if not recipients.exists():
            logger.info(
                f"No recipients found for submission {submission_id} notification"
            )
            return

        # Prepare notification content
        student_name = submission.student.get_full_name()

        notification_titles = {
            "submission_created": f"New Submission: {submission.test.title}",
            "submission_graded": f"Submission Graded: {submission.test.title}",
            "submission_returned": f"Submission Returned: {submission.test.title}",
        }

        notification_messages = {
            "submission_created": f"{student_name} has submitted '{submission.test.title}'.",
            "submission_graded": f"Submission by {student_name} for '{submission.test.title}' has been graded.",
            "submission_returned": f"Submission by {student_name} for '{submission.test.title}' has been returned for revision.",
        }

        title = notification_titles.get(
            notification_type, f"Submission Update: {submission.test.title}"
        )
        message = notification_messages.get(
            notification_type,
            f"Update regarding submission for: {submission.test.title}",
        )

        data = {
            "submission_id": submission_id,
            "test_id": submission.test.id,
            "test_title": submission.test.title,
            "student_id": submission.student.id,
            "student_name": student_name,
            "submitted_at": submission.submitted_at.isoformat()
            if submission.submitted_at
            else None,
        }

        # Create notification for each recipient
        for recipient in recipients:
            create_notification(
                user_id=recipient.id,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data,
                send_push=False,  # In-app only for submission notifications
            )

        logger.info(
            f"Submission notifications ({notification_type}) sent for submission {submission_id} to {recipients.count()} users"
        )

    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found")
    except Exception as e:
        logger.error(
            f"Error sending submission notification for submission {submission_id}: {str(e)}"
        )


def check_upcoming_classes():
    """
    Check for classes starting in the next 15-30 minutes and send notifications.
    This should be run as a scheduled task every 5-10 minutes.
    """
    try:
        now = timezone.now()
        # Check for classes starting in 15 minutes (±2 minutes window)
        start_time = now + timezone.timedelta(minutes=13)
        end_time = now + timezone.timedelta(minutes=17)

        upcoming_classes = Class.objects.filter(
            scheduled_at__gte=start_time, scheduled_at__lte=end_time
        ).select_related("course", "cohort")

        for class_obj in upcoming_classes:
            # Check if notification has already been sent
            # We do this by checking if any student in the cohort has a notification for this class
            students = User.objects.filter(
                enrollments__cohort=class_obj.cohort,
                role="student",
                is_active=True,
            ).first()

            if students:
                # Check if notification already exists
                existing = Notification.objects.filter(
                    user=students,
                    type="class_starting",
                    data__class_id=class_obj.id,
                    created_at__gte=now - timezone.timedelta(minutes=20),
                ).exists()

                if not existing:
                    send_class_starting_notification(class_obj.id)
                    logger.info(
                        f"Scheduled class starting notification for class {class_obj.id}"
                    )

        logger.info(
            f"Checked upcoming classes, found {upcoming_classes.count()} classes"
        )

    except Exception as e:
        logger.error(f"Error checking upcoming classes: {str(e)}")

