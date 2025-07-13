from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings


class Command(BaseCommand):
    help = "Creates a default admin if one does not exist."

    def handle(self, *args, **options):
        User = get_user_model()
        email = settings.ADMIN_EMAIL
        first_name = settings.ADMIN_FIRST_NAME
        last_name = settings.ADMIN_LAST_NAME
        password = settings.ADMIN_PASSWORD

        if not all([email, password]):
            self.stdout.write(
                self.style.WARNING(
                    "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment."
                )
            )
            return

        user = User.objects.filter(email=email, is_superuser=True).first()

        if user:
            user.role = "admin"
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Admin with email {email} already exists and is updated."
                )
            )
            return

        user = User.objects.create_superuser(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role="admin",
        )
        user.is_superuser = True
        user.is_staff = True
        user.save()
        self.stdout.write(
            self.style.SUCCESS(f"Successfully created admin {email}")
        )
