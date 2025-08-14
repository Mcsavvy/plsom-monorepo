from django_q.tasks import async_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Test


def send_test_available_notification(test_id, student_email, student_name):
    """
    Send email notification when test becomes available to a student
    """
    try:
        test = Test.objects.select_related('course', 'cohort').get(id=test_id)
        
        subject = f"New Test Available: {test.title}"
        
        context = {
            'student_name': student_name,
            'test_title': test.title,
            'course_name': test.course.name,
            'cohort_name': test.cohort.name,
            'available_until': test.available_until,
            'time_limit': test.time_limit_minutes,
            'max_attempts': test.max_attempts,
            'instructions': test.instructions,
        }
        
        # Render email templates
        html_message = render_to_string('emails/test_available.html', context)
        plain_message = render_to_string('emails/test_available.txt', context)
        
        send_mail(
            subject=subject,
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student_email],
            fail_silently=False,
        )
        
        return f"Email sent successfully to {student_email}"
        
    except Test.DoesNotExist:
        return f"Test with ID {test_id} not found"
    except Exception as e:
        return f"Failed to send email to {student_email}: {str(e)}"


def send_bulk_test_notifications(test_id):
    """
    Send test notifications to all students in a cohort
    """
    try:
        test = Test.objects.select_related('course', 'cohort').get(id=test_id)
        
        # Get all students in the cohort
        students = test.cohort.enrollments.select_related('student').all()
        
        success_count = 0
        error_count = 0
        
        for enrollment in students:
            student = enrollment.student
            try:
                async_task(
                    'apps.assessments.tasks.send_test_available_notification',
                    test_id, student.email, student.get_full_name()
                )
                success_count += 1
            except Exception as e:
                error_count += 1
                print(f"Failed to queue email for {student.email}: {e}")
        
        return f"Queued {success_count} notifications, {error_count} errors"
        
    except Test.DoesNotExist:
        return f"Test with ID {test_id} not found"
    except Exception as e:
        return f"Failed to send bulk notifications: {str(e)}"


def send_test_reminder(test_id, hours_before_deadline=24):
    """
    Send reminder email before test deadline
    """
    try:
        test = Test.objects.select_related('course', 'cohort').get(id=test_id)
        
        if not test.available_until:
            return "Test has no deadline set"
        
        # Get students who haven't submitted yet
        submitted_students = test.submissions.filter(
            status__in=['submitted', 'graded']
        ).values_list('student_id', flat=True)
        
        pending_students = test.cohort.enrollments.exclude(
            student_id__in=submitted_students
        ).select_related('student')
        
        subject = f"Reminder: Test Due Soon - {test.title}"
        
        for enrollment in pending_students:
            student = enrollment.student
            
            # Simple reminder message
            message = f"""
Dear {student.get_full_name()},

This is a friendly reminder that your test "{test.title}" for {test.course.name} is due in {hours_before_deadline} hours.

Deadline: {test.available_until.strftime('%B %d, %Y at %I:%M %p')}

Please log into your student portal to complete the test if you haven't already.

May God bless your studies.

PLSOM Academic Team
            """.strip()
            
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[student.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Failed to send reminder to {student.email}: {e}")
        
        return f"Sent reminders to {pending_students.count()} students"
        
    except Test.DoesNotExist:
        return f"Test with ID {test_id} not found"
    except Exception as e:
        return f"Failed to send reminders: {str(e)}"


def send_grade_notification(submission_id):
    """
    Send notification when a test has been graded
    """
    try:
        from .models import Submission
        
        submission = Submission.objects.select_related(
            'test', 'student', 'graded_by'
        ).get(id=submission_id)
        
        subject = f"Test Graded: {submission.test.title}"
        
        context = {
            'student_name': submission.student.get_full_name(),
            'test_title': submission.test.title,
            'course_name': submission.test.course.name,
            'score': submission.score,
            'max_score': submission.max_score,
            'percentage': round((submission.score / submission.max_score) * 100, 1) if submission.max_score else None,
            'feedback': submission.feedback,
            'graded_by': submission.graded_by.get_full_name() if submission.graded_by else 'System',
        }
        
        message = f"""
Dear {context['student_name']},

Your test "{context['test_title']}" for {context['course_name']} has been graded.

Score: {context['score']}/{context['max_score']} ({context['percentage']}%)

{f"Feedback: {context['feedback']}" if context['feedback'] else ""}

You can view your detailed results in the student portal.

{"Well done! Continue to seek the Lord in your studies." if context['percentage'] and context['percentage'] >= 70 else "Keep studying and growing in knowledge and wisdom."}

Blessings,
{context['graded_by']}
PLSOM Academic Team
        """.strip()
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[submission.student.email],
            fail_silently=False,
        )
        
        return f"Grade notification sent to {submission.student.email}"
        
    except Exception as e:
        return f"Failed to send grade notification: {str(e)}"
