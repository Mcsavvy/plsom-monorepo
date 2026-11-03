"""
Several cohorts of the same program can run at the same time.

Previously creating or activating a cohort silently deactivated the other
active cohort of its program, activating a second one was rejected, and
cohorts of one program could not overlap in time at all.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.cohorts.models import Cohort

User = get_user_model()


class ConcurrentCohortsTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.today = timezone.now().date()
        self.admin = User.objects.create_user(
            email="admin@example.com", password="pw", role="admin"
        )
        self.client.force_authenticate(self.admin)
        self.morning = Cohort.objects.create(
            name="2026 Morning",
            program_type="certificate",
            is_active=True,
            start_date=self.today - timedelta(days=10),
            end_date=self.today + timedelta(days=170),
        )

    def payload(self, **over):
        data = {
            "name": "2026 Evening",
            "program_type": "certificate",
            # Starts while "2026 Morning" is running: an overlap.
            "start_date": self.today + timedelta(days=5),
            "end_date": self.today + timedelta(days=175),
        }
        data.update(over)
        return data

    def active_names(self, program="certificate"):
        return set(
            Cohort.objects.filter(
                program_type=program, is_active=True
            ).values_list("name", flat=True)
        )

    def test_create_second_active_cohort_keeps_first_active(self):
        response = self.client.post(
            "/api/cohorts/", self.payload(is_active=True)
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(self.active_names(), {"2026 Morning", "2026 Evening"})

    def test_activating_existing_cohort_keeps_others_active(self):
        evening = Cohort.objects.create(
            name="2026 Evening",
            program_type="certificate",
            start_date=self.today,
            end_date=self.today + timedelta(days=180),
        )
        response = self.client.patch(
            f"/api/cohorts/{evening.id}/", {"is_active": True}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(self.active_names(), {"2026 Morning", "2026 Evening"})

    def test_overlapping_dates_allowed_on_create(self):
        response = self.client.post("/api/cohorts/", self.payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_overlapping_dates_allowed_on_update(self):
        later = Cohort.objects.create(
            name="2027 Intake",
            program_type="certificate",
            start_date=self.today + timedelta(days=200),
            end_date=self.today + timedelta(days=380),
        )
        response = self.client.patch(
            f"/api/cohorts/{later.id}/",
            {"start_date": self.today + timedelta(days=1)},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

    def test_other_program_untouched(self):
        diploma = Cohort.objects.create(
            name="Diploma A",
            program_type="diploma",
            is_active=True,
            start_date=self.today,
            end_date=self.today + timedelta(days=300),
        )
        response = self.client.post(
            "/api/cohorts/", self.payload(is_active=True)
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        diploma.refresh_from_db()
        self.assertTrue(diploma.is_active)

    def test_rules_that_still_apply(self):
        # Duplicate name within a program is still rejected.
        response = self.client.post(
            "/api/cohorts/", self.payload(name="2026 Morning")
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already exists", str(response.data))
        # An ended cohort still cannot be activated.
        ended = Cohort.objects.create(
            name="Old",
            program_type="certificate",
            start_date=self.today - timedelta(days=200),
            end_date=self.today - timedelta(days=1),
        )
        response = self.client.patch(
            f"/api/cohorts/{ended.id}/", {"is_active": True}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already ended", str(response.data))

    def test_current_endpoint_lists_every_active_cohort(self):
        created = self.client.post(
            "/api/cohorts/", self.payload(is_active=True)
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)
        response = self.client.get("/api/cohorts/current/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {c["name"] for c in response.data}, {"2026 Morning", "2026 Evening"}
        )
