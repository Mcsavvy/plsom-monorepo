from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
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
        # TODO: Use a proper HTML template and sender address
        # Use different URLs based on user role
        if user.role in ["admin", "lecturer"]:
            base_url = settings.ADMIN_DASHBOARD_URL
        else:
            base_url = settings.FRONTEND_URL

        # Create reset URL
        reset_url = f"{base_url}/reset-password?uid={uid}&token={token}"

        # Email content
        subject = "Password Reset Request - PLSOM"
        message = f"""
        Hello {user.get_full_name()},

        You have requested to reset your password for your PLSOM account.

        Please click the following link to reset your password:
        {reset_url}

        If you did not request this password reset, please ignore this email.

        This link will expire in 24 hours.

        Best regards,
        PLSOM Team
        """

        # Send email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
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
