from django.core.mail import send_mail
from django.conf import settings
from apps.invitations.models import Invitation


def send_invitation_email(invitation_id: int):
    invitation = Invitation.objects.get(id=invitation_id)
    subject = "You're invited to join the platform"
    invite_link = f"{settings.FRONTEND_URL}/onboard/{invitation.token}/"
    message = f"Hello,\n\nYou have been invited to join as a {invitation.role}. Please use the following link to onboard: {invite_link}\n\nThis link will expire on {invitation.expires_at}."
    # TODO: Use a proper HTML template and sender address
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [invitation.email],
        fail_silently=False,
    )
