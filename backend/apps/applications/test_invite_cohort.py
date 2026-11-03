from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.applications.models import Application
from apps.cohorts.models import Cohort
from apps.invitations.models import Invitation

User = get_user_model()


@patch("apps.applications.views.async_task")
class InviteFromApplicationTestCase(APITestCase):
    """More cohorts in the picker makes a wrong choice likelier: guard it."""

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.now().date()
        self.admin = User.objects.create_user(
            email="admin@example.com", password="pw", role="admin"
        )
        self.client.force_authenticate(self.admin)
        self.application = Application.objects.create(
            full_name="Ruth Okon",
            father_name="F",
            mother_name="M",
            gender="FEMALE",
            phone="1",
            email="ruth@example.com",
            full_residential_address="A",
            nationality="NG",
            employment_status="EMPLOYED",
            program_type="CERTIFICATE",
            program_interest="I",
        )

        def cohort(name, program, active=True):
            return Cohort.objects.create(
                name=name,
                program_type=program,
                is_active=active,
                start_date=self.today,
                end_date=self.today + timedelta(days=180),
            )

        self.cert_a = cohort("Cert A", "certificate")
        self.cert_b = cohort("Cert B", "certificate")
        self.diploma = cohort("Dip A", "diploma")
        self.inactive = cohort("Cert Old", "certificate", active=False)

    def invite(self, cohort):
        return self.client.post(
            f"/api/applications/{self.application.id}/invite/",
            {"cohort": cohort.id},
        )

    def test_either_matching_active_cohort_works(self, _task):
        response = self.invite(self.cert_b)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(
            Invitation.objects.get(email="ruth@example.com").cohort, self.cert_b
        )

    def test_wrong_program_rejected(self, _task):
        response = self.invite(self.diploma)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("diploma", str(response.data))
        self.assertFalse(Invitation.objects.exists())

    def test_inactive_cohort_rejected(self, _task):
        response = self.invite(self.inactive)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not active", str(response.data))
