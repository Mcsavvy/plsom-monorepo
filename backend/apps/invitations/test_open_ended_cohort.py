"""Inviting a student to a cohort with no end date."""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.cohorts.models import Cohort

User = get_user_model()


@patch("apps.invitations.views.async_task")
class InvitationOpenEndedCohortTestCase(APITestCase):
    def test_cohort_without_end_date_does_not_crash(self, _task):
        """Regression: end_date=None hit `None < date` and returned 500."""
        admin = User.objects.create_user(
            email="admin@example.com", password="pw", role="admin"
        )
        self.client.force_authenticate(admin)
        today = timezone.now().date()
        cohort = Cohort(
            name="Rolling",
            program_type="certificate",
            is_active=True,
            start_date=today,
            end_date=None,
        )
        cohort.save()
        response = self.client.post(
            "/api/invitations/",
            {"email": "new@example.com", "role": "student", "cohort": cohort.id},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
