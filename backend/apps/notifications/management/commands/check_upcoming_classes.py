"""
Management command to check for upcoming classes and send notifications.
This command should be run as a scheduled task (e.g., every 5-10 minutes).
"""

from django.core.management.base import BaseCommand
from apps.notifications.tasks import check_upcoming_classes


class Command(BaseCommand):
    help = "Check for classes starting soon and send notifications to students"

    def handle(self, *args, **options):
        self.stdout.write("Checking for upcoming classes...")
        check_upcoming_classes()
        self.stdout.write(
            self.style.SUCCESS("Successfully checked upcoming classes")
        )
