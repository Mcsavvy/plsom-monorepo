from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from logging import getLogger

logger = getLogger(__name__)

User = get_user_model()


def send_password_reset_email(user_id: int, uid: str, token: str):
    """
    Send password reset email to user.

    Args:
        user_id: The user's ID
        uid: Base64 encoded user ID
        token: Password reset token
    """
    try:
        user = User.objects.get(id=user_id)

        # Use different URLs based on user role
        if user.role in ["admin", "lecturer"]:
            base_url = settings.ADMIN_DASHBOARD_URL
        else:
            base_url = settings.FRONTEND_URL

        # Create reset URL
        reset_url = f"{base_url}/reset-password?uid={uid}&token={token}"

        # Prepare email content context
        context = {
            "user": user,
            "reset_url": reset_url,
            "current_time": timezone.now(),
        }

        # Generate email content from templates
        subject = "Password Reset Request - PLSOM"
        html_message = render_to_string("emails/password_reset.html", context)
        plain_message = render_to_string("emails/password_reset.txt", context)

        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    except User.DoesNotExist:
        # Log error if user doesn't exist (shouldn't happen in normal flow)
        pass
    except Exception:
        # Log any other errors that might occur during email sending
        logger.exception(
            f"Error sending password reset email to user {user_id}"
        )
