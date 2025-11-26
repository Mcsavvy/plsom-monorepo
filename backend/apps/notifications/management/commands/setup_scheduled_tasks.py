"""
Management command to set up scheduled tasks for notifications.
This should be run once during deployment or when notification system is first set up.
"""

from django.core.management.base import BaseCommand
from django_q.models import Schedule


class Command(BaseCommand):
    help = "Set up scheduled tasks for notification system"

    def handle(self, *args, **options):
        self.stdout.write("Setting up scheduled notification tasks...")

        # Check for upcoming classes every 5 minutes
        schedule, created = Schedule.objects.update_or_create(
            name="check_upcoming_classes",
            defaults={
                "func": "apps.notifications.tasks.check_upcoming_classes",
                "schedule_type": Schedule.MINUTES,
                "minutes": 5,
                "repeats": -1,  # Repeat indefinitely
            },
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    "Created scheduled task: check_upcoming_classes (every 5 minutes)"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    "Updated scheduled task: check_upcoming_classes (every 5 minutes)"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Successfully set up scheduled notification tasks"
            )
        )
