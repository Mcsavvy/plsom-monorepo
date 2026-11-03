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

from apps.cohorts.models import Cohort, Enrollment

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


class OneActiveCohortPerProgramPerStudentTestCase(APITestCase):
    """
    Cohorts of a program can run side by side, but a student belongs to at
    most one active cohort per program, whichever path enrolls them.
    """

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.now().date()
        self.admin = User.objects.create_user(
            email="admin@example.com", password="pw", role="admin"
        )
        self.student = User.objects.create_user(
            email="ama@example.com",
            password="pw",
            first_name="Ama",
            last_name="Mensah",
            role="student",
        )
        self.client.force_authenticate(self.admin)

        def cohort(name, program="certificate", active=True):
            return Cohort.objects.create(
                name=name,
                program_type=program,
                is_active=active,
                start_date=self.today,
                end_date=self.today + timedelta(days=180),
            )

        self.morning = cohort("Morning")
        self.evening = cohort("Evening")
        self.later = cohort("Later", active=False)
        self.diploma = cohort("Diploma", program="diploma")
        Enrollment.objects.create(student=self.student, cohort=self.morning)

    def enroll(self, cohort):
        return self.client.post(
            f"/api/students/{self.student.id}/enroll/", {"cohort_id": cohort.id}
        )

    def test_admin_enroll_into_second_active_cohort_rejected(self):
        response = self.enroll(self.evening)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Morning", str(response.data))
        self.assertFalse(
            Enrollment.objects.filter(
                student=self.student, cohort=self.evening
            ).exists()
        )

    def test_other_program_and_inactive_cohorts_allowed(self):
        self.assertEqual(self.enroll(self.diploma).status_code, 200)
        self.assertEqual(self.enroll(self.later).status_code, 200)

    def test_move_between_cohorts_by_unenrolling_first(self):
        response = self.client.post(
            f"/api/students/{self.student.id}/unenroll/",
            {"cohort_id": self.morning.id},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.enroll(self.evening).status_code, 200)

    def test_model_enforces_rule_for_every_path(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            Enrollment.objects.create(student=self.student, cohort=self.evening)

    def test_activating_cohort_that_would_clash_is_rejected(self):
        Enrollment.objects.create(student=self.student, cohort=self.later)
        response = self.client.patch(
            f"/api/cohorts/{self.later.id}/", {"is_active": True}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Ama Mensah", str(response.data))
        self.assertIn("Morning", str(response.data))
        self.later.refresh_from_db()
        self.assertFalse(self.later.is_active)

    def test_activating_cohort_without_clash_is_allowed(self):
        response = self.client.patch(
            f"/api/cohorts/{self.later.id}/", {"is_active": True}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

    def test_existing_enrollments_stay_savable(self):
        """Rows from before the rule (or bulk updates) must not break saves."""
        clash = Enrollment.objects.create(student=self.student, cohort=self.later)
        Cohort.objects.filter(pk=self.later.pk).update(is_active=True)
        clash.refresh_from_db()
        clash.save()  # no ValidationError
