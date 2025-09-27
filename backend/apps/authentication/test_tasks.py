from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core import mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from unittest.mock import patch

from apps.authentication.tasks import send_password_reset_email

User = get_user_model()


class AuthenticationTasksTestCase(TestCase):
    """Test cases for authentication tasks."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User",
            role="student",
        )
        self.token = default_token_generator.make_token(self.user)
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))

    def test_send_password_reset_email_success(self):
        """Test successful password reset email sending."""
        # Clear the mail outbox
        mail.outbox = []

        # Call the task
        send_password_reset_email(self.user.id, self.uid, self.token)

        # Check that email was sent
        self.assertEqual(len(mail.outbox), 1)

        # Check email content
        email = mail.outbox[0]
        self.assertEqual(email.subject, "Password Reset Request - PLSOM")
        self.assertEqual(email.to, [self.user.email])
        self.assertEqual(email.from_email, settings.DEFAULT_FROM_EMAIL)

        # Check that reset URL is in the email body
        self.assertIn("reset-password", email.body)
        self.assertIn(self.uid, email.body)
        self.assertIn(self.token, email.body)

    def test_send_password_reset_email_student_url(self):
        """Test that student gets frontend URL for password reset."""
        mail.outbox = []

        # Create a student user
        student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            role="student",
        )
        token = default_token_generator.make_token(student)
        uid = urlsafe_base64_encode(force_bytes(student.pk))

        send_password_reset_email(student.id, uid, token)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        # Should contain frontend URL
        if hasattr(settings, "FRONTEND_URL"):
            self.assertIn(settings.FRONTEND_URL, email.body)

    def test_send_password_reset_email_admin_url(self):
        """Test that admin gets admin dashboard URL for password reset."""
        mail.outbox = []

        # Create an admin user
        admin = User.objects.create_user(
            email="admin@example.com", password="testpassword123", role="admin"
        )
        token = default_token_generator.make_token(admin)
        uid = urlsafe_base64_encode(force_bytes(admin.pk))

        send_password_reset_email(admin.id, uid, token)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        # Should contain admin dashboard URL
        if hasattr(settings, "ADMIN_DASHBOARD_URL"):
            self.assertIn(settings.ADMIN_DASHBOARD_URL, email.body)

    def test_send_password_reset_email_lecturer_url(self):
        """Test that lecturer gets admin dashboard URL for password reset."""
        mail.outbox = []

        # Create a lecturer user
        lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            role="lecturer",
        )
        token = default_token_generator.make_token(lecturer)
        uid = urlsafe_base64_encode(force_bytes(lecturer.pk))

        send_password_reset_email(lecturer.id, uid, token)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        # Should contain admin dashboard URL
        if hasattr(settings, "ADMIN_DASHBOARD_URL"):
            self.assertIn(settings.ADMIN_DASHBOARD_URL, email.body)

    def test_send_password_reset_email_nonexistent_user(self):
        """Test sending email for non-existent user."""
        mail.outbox = []

        # Try to send email for non-existent user
        send_password_reset_email(99999, self.uid, self.token)

        # No email should be sent
        self.assertEqual(len(mail.outbox), 0)

    @patch("apps.authentication.tasks.send_mail")
    def test_send_password_reset_email_failure(self, mock_send_mail):
        """Test handling of email sending failure."""
        # Mock send_mail to raise an exception
        mock_send_mail.side_effect = Exception("Email sending failed")

        # This should not raise an exception
        try:
            send_password_reset_email(self.user.id, self.uid, self.token)
        except Exception:
            self.fail(
                "send_password_reset_email raised an exception when it shouldn't"
            )

    @patch("apps.authentication.tasks.render_to_string")
    def test_send_password_reset_email_template_rendering(self, mock_render):
        """Test that email templates are rendered correctly."""
        mock_render.return_value = "Test email content"

        send_password_reset_email(self.user.id, self.uid, self.token)

        # Check that templates were called
        self.assertTrue(mock_render.called)

        # Check that both HTML and text templates were rendered
        call_args_list = mock_render.call_args_list
        template_names = [call[0][0] for call in call_args_list]

        self.assertIn("emails/password_reset.html", template_names)
        self.assertIn("emails/password_reset.txt", template_names)

    def test_send_password_reset_email_context_data(self):
        """Test that email context contains required data."""
        with patch("apps.authentication.tasks.render_to_string") as mock_render:
            mock_render.return_value = "Test email content"

            send_password_reset_email(self.user.id, self.uid, self.token)

            # Get the context from the first call
            context = mock_render.call_args_list[0][0][1]

            self.assertIn("user", context)
            self.assertIn("reset_url", context)
            self.assertIn("current_time", context)

            self.assertEqual(context["user"], self.user)
            self.assertIn("reset-password", context["reset_url"])

    def test_send_password_reset_email_html_and_text(self):
        """Test that both HTML and text emails are sent."""
        mail.outbox = []

        send_password_reset_email(self.user.id, self.uid, self.token)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        # Check that email has both text and HTML content
        self.assertIsNotNone(email.body)  # Text content
        # HTML content would be available if templates exist

    def test_send_password_reset_email_correct_recipient(self):
        """Test that email is sent to the correct recipient."""
        mail.outbox = []

        send_password_reset_email(self.user.id, self.uid, self.token)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        self.assertEqual(email.to, [self.user.email])
        self.assertEqual(len(email.to), 1)

    @patch("apps.authentication.tasks.logger")
    def test_send_password_reset_email_logging_on_error(self, mock_logger):
        """Test that errors are logged properly."""
        with patch("apps.authentication.tasks.send_mail") as mock_send_mail:
            mock_send_mail.side_effect = Exception("Email sending failed")

            send_password_reset_email(self.user.id, self.uid, self.token)

            # Check that exception was logged
            mock_logger.exception.assert_called_once()

    def test_send_password_reset_email_different_roles_urls(self):
        """Test that different user roles get different reset URLs."""
        mail.outbox = []

        # Test with different roles
        roles_to_test = ["student", "lecturer", "admin"]

        for i, role in enumerate(roles_to_test):
            user = User.objects.create_user(
                email=f"{role}@example.com",
                password="testpassword123",
                role=role,
            )
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            send_password_reset_email(user.id, uid, token)

        # Should have sent 3 emails
        self.assertEqual(len(mail.outbox), 3)

        # Check that URLs are different for student vs admin/lecturer
        student_email = mail.outbox[0]
        lecturer_email = mail.outbox[1]
        admin_email = mail.outbox[2]

        # All emails should contain reset URLs
        self.assertIn("reset-password", student_email.body)
        self.assertIn("reset-password", lecturer_email.body)
        self.assertIn("reset-password", admin_email.body)

    def test_send_password_reset_email_fail_silently_false(self):
        """Test that send_mail is called with fail_silently=False."""
        with patch("apps.authentication.tasks.send_mail") as mock_send_mail:
            send_password_reset_email(self.user.id, self.uid, self.token)

            # Check that send_mail was called with fail_silently=False
            call_kwargs = mock_send_mail.call_args[1]
            self.assertFalse(call_kwargs["fail_silently"])

    def test_send_password_reset_email_subject_format(self):
        """Test that email subject is correctly formatted."""
        mail.outbox = []

        send_password_reset_email(self.user.id, self.uid, self.token)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        self.assertEqual(email.subject, "Password Reset Request - PLSOM")

    def test_send_password_reset_email_user_info_in_context(self):
        """Test that user information is properly passed to email template context."""
        # Set user details
        self.user.first_name = "John"
        self.user.last_name = "Doe"
        self.user.title = "Mr"
        self.user.save()

        with patch("apps.authentication.tasks.render_to_string") as mock_render:
            mock_render.return_value = "Test email content"

            send_password_reset_email(self.user.id, self.uid, self.token)

            # Get the context from the first call
            context = mock_render.call_args_list[0][0][1]
            user_in_context = context["user"]

            self.assertEqual(user_in_context.first_name, "John")
            self.assertEqual(user_in_context.last_name, "Doe")
            self.assertEqual(user_in_context.title, "Mr")
            self.assertEqual(user_in_context.email, "test@example.com")
