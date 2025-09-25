from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from apps.invitations.models import Invitation


def send_invitation_email(invitation_id: int):
    invitation = Invitation.objects.select_related("created_by", "cohort").get(
        id=invitation_id
    )

    # Use different URLs based on user role
    if invitation.role in ["admin", "lecturer"]:
        base_url = settings.ADMIN_DASHBOARD_URL
    else:
        base_url = settings.FRONTEND_URL

    invite_link = f"{base_url}/onboard/{invitation.token}/"

    # Prepare email content context
    context = {
        "invitation": invitation,
        "invite_link": invite_link,
    }

    # Generate email content from templates
    subject = "You're Invited to Join PLSOM"
    html_message = render_to_string("emails/invitation.html", context)
    plain_message = render_to_string("emails/invitation.txt", context)

    # Send email
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [invitation.email],
        html_message=html_message,
        fail_silently=False,
    )
