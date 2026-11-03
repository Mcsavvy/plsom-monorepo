"""Invitations and the cohorts they point at."""

from datetime import timedelta
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
            {
                "email": "new@example.com",
                "role": "student",
                "cohort": cohort.id,
            },
        )
        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED, response.data
        )


@patch("apps.invitations.views.async_task")
class InvitationCohortNameTestCase(APITestCase):
    """Invitations expose the cohort's name so admins can tell cohorts apart."""

    def setUp(self):
        from apps.invitations.models import Invitation

        self.admin = User.objects.create_user(
            email="admin@example.com", password="pw", role="admin"
        )
        self.client.force_authenticate(self.admin)
        today = timezone.now().date()
        self.cohorts = [
            Cohort.objects.create(
                name=f"Certificate {label}",
                program_type="certificate",
                is_active=True,
                start_date=today,
                end_date=today + timedelta(days=180),
            )
            for label in ("Morning", "Evening")
        ]
        expires = timezone.now() + timedelta(days=7)
        for i, cohort in enumerate(self.cohorts):
            Invitation.objects.create(
                email=f"s{i}@example.com",
                role="student",
                cohort=cohort,
                expires_at=expires,
                created_by=self.admin,
            )
        Invitation.objects.create(
            email="lec@example.com",
            role="lecturer",
            expires_at=expires,
            created_by=self.admin,
        )

    def test_list_includes_cohort_name_and_program(self, _task):
        response = self.client.get("/api/invitations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )
        by_email = {r["email"]: r for r in rows}
        self.assertEqual(
            by_email["s0@example.com"]["cohort_name"], "Certificate Morning"
        )
        self.assertEqual(
            by_email["s1@example.com"]["cohort_name"], "Certificate Evening"
        )
        self.assertEqual(
            by_email["s1@example.com"]["cohort_program_type"], "certificate"
        )
        self.assertIsNone(by_email["lec@example.com"]["cohort_name"])
        self.assertIsNone(by_email["lec@example.com"]["cohort_program_type"])

    def test_list_does_not_query_per_cohort(self, _task):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        with CaptureQueriesContext(connection) as before:
            self.client.get("/api/invitations/")
        from apps.invitations.models import Invitation

        today = timezone.now().date()
        for i in range(5):
            cohort = Cohort.objects.create(
                name=f"Extra {i}",
                program_type="diploma",
                start_date=today,
                end_date=today + timedelta(days=90),
            )
            Invitation.objects.create(
                email=f"x{i}@example.com",
                role="student",
                cohort=cohort,
                expires_at=timezone.now() + timedelta(days=7),
                created_by=self.admin,
            )
        with CaptureQueriesContext(connection) as after:
            self.client.get("/api/invitations/")
        self.assertEqual(
            len(after.captured_queries), len(before.captured_queries)
        )
