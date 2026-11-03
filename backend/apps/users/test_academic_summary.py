from datetime import timedelta

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.assessments.models import Answer, Question, Submission, Test
from apps.classes.models import Attendance, Class
from apps.cohorts.models import Cohort, Enrollment
from apps.courses.models import Course
from apps.users.academic_summary import (
    LOW_SCORE_THRESHOLD,
    build_academic_summary,
    mean,
    percentage,
)
from apps.users.models import User


class HelpersTestCase(APITestCase):
    def test_percentage(self):
        self.assertEqual(percentage(7, 10), 70.0)
        self.assertEqual(percentage(1, 3), 33.3)
        self.assertIsNone(percentage(None, 10))
        self.assertIsNone(percentage(5, 0))

    def test_mean_ignores_missing(self):
        self.assertEqual(mean([50, None, 100]), 75.0)
        self.assertIsNone(mean([None, None]))
        self.assertIsNone(mean([]))


class AcademicSummaryFixture(APITestCase):
    """A student in one cohort with a spread of tests and classes."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        def user(email, role, **kw):
            return User.objects.create_user(
                email=email,
                password="pw",
                first_name=email.split("@")[0].title(),
                last_name="User",
                role=role,
                **kw,
            )

        self.admin = user("admin@x.com", "admin")
        self.lecturer = user("lecturer@x.com", "lecturer")
        self.other_lecturer = user("other@x.com", "lecturer")
        self.student = user("student@x.com", "student")
        self.classmate = user("classmate@x.com", "student")

        self.cohort = Cohort.objects.create(
            name="Cohort A",
            program_type="certificate",
            start_date=(self.now - timedelta(days=60)).date(),
            end_date=(self.now + timedelta(days=60)).date(),
        )
        self.other_cohort = Cohort.objects.create(
            name="Cohort B",
            program_type="diploma",
            start_date=(self.now - timedelta(days=60)).date(),
            end_date=(self.now + timedelta(days=60)).date(),
        )
        Enrollment.objects.create(student=self.student, cohort=self.cohort)
        Enrollment.objects.create(student=self.classmate, cohort=self.cohort)

        self.theology = Course.objects.create(
            name="Theology",
            program_type="certificate",
            module_count=4,
            description="d",
            lecturer=self.lecturer,
        )
        self.homiletics = Course.objects.create(
            name="Homiletics",
            program_type="certificate",
            module_count=4,
            description="d",
            lecturer=self.other_lecturer,
        )

    # -- builders -------------------------------------------------------
    def make_test(self, title, course=None, cohort=None, points=10.0, **kw):
        kw.setdefault("status", "published")
        kw.setdefault("created_by", self.lecturer)
        test = Test.objects.create(
            title=title,
            course=course or self.theology,
            cohort=cohort or self.cohort,
            **kw,
        )
        if points:
            Question.objects.create(
                test=test,
                question_type="text",
                title="Q",
                order=0,
                max_points=points,
            )
            test.calculate_total_points()
        return test

    def submit(self, test, status_, points=None, attempt=1, student=None, **kw):
        sub = Submission.objects.create(
            test=test,
            student=student or self.student,
            status=status_,
            attempt_number=attempt,
            submitted_at=kw.pop("submitted_at", self.now - timedelta(days=1))
            if status_ != "in_progress"
            else None,
            graded_by=self.lecturer if status_ == "graded" else None,
            graded_at=kw.pop("graded_at", self.now)
            if status_ == "graded"
            else None,
            **kw,
        )
        question = test.questions.first()
        if question is not None:
            Answer.objects.create(
                submission=sub,
                question=question,
                text_answer="a",
                points_earned=points,
            )
        return sub

    def make_class(
        self, title, days_ago, course=None, lecturer=None, cohort=None
    ):
        return Class.objects.create(
            course=course or self.theology,
            lecturer=lecturer or self.lecturer,
            cohort=cohort or self.cohort,
            title=title,
            scheduled_at=self.now - timedelta(days=days_ago),
        )

    def attend(self, cls, via_recording=False, minutes=60, student=None):
        return Attendance.objects.create(
            class_session=cls,
            student=student or self.student,
            join_time=cls.scheduled_at,
            duration_minutes=minutes,
            via_recording=via_recording,
        )

    def summary(self, viewer=None):
        return build_academic_summary(
            self.student, viewer or self.admin, now=self.now
        )

    def row(self, data, title):
        return next(t for t in data["tests"] if t["title"] == title)


class TestStatusTestCase(AcademicSummaryFixture):
    def test_every_status_is_derived(self):
        graded = self.make_test("Graded")
        self.submit(graded, "graded", points=8)
        awaiting = self.make_test("Awaiting")
        self.submit(awaiting, "submitted")
        returned = self.make_test("Returned")
        self.submit(returned, "returned")
        progress = self.make_test("Progress")
        self.submit(progress, "in_progress")
        self.make_test("Missed", available_until=self.now - timedelta(days=1))
        self.make_test("Open", available_until=self.now + timedelta(days=1))
        self.make_test("Upcoming", available_from=self.now + timedelta(days=2))

        data = self.summary()
        got = {t["title"]: t["status"] for t in data["tests"]}
        self.assertEqual(
            got,
            {
                "Graded": "graded",
                "Awaiting": "awaiting_grading",
                "Returned": "returned",
                "Progress": "in_progress",
                "Missed": "missed",
                "Open": "not_started",
                "Upcoming": "upcoming",
            },
        )
        counts = data["summary"]["status_counts"]
        self.assertEqual(sum(counts.values()), 7)
        self.assertEqual(counts["missed"], 1)

        # Upcoming tests are not yet due; turned in = graded+awaiting+returned.
        self.assertEqual(data["summary"]["tests_due"], 6)
        self.assertEqual(data["summary"]["tests_turned_in"], 3)
        self.assertEqual(data["summary"]["completion_rate"], 50.0)

    def test_score_only_reported_once_graded(self):
        test = self.make_test("T")
        self.submit(test, "submitted", points=9)  # points set but not graded
        row = self.row(self.summary(), "T")
        self.assertIsNone(row["score"])
        self.assertIsNone(row["percentage"])
        self.assertEqual(row["submission_id"], row["latest_submission_id"])


class BestAttemptTestCase(AcademicSummaryFixture):
    def test_best_graded_attempt_counts(self):
        test = self.make_test("Exam", max_attempts=3)
        self.submit(test, "graded", points=4, attempt=1)
        best = self.submit(test, "graded", points=9, attempt=2)
        self.submit(test, "graded", points=6, attempt=3)

        row = self.row(self.summary(), "Exam")
        self.assertEqual(row["score"], 9.0)
        self.assertEqual(row["percentage"], 90.0)
        self.assertEqual(row["submission_id"], best.id)
        self.assertEqual(row["attempts_used"], 3)
        self.assertEqual(len(row["attempts"]), 3)
        self.assertFalse(row["has_pending_attempt"])

    def test_graded_wins_over_newer_pending_attempt(self):
        test = self.make_test("Exam", max_attempts=2)
        graded = self.submit(test, "graded", points=5, attempt=1)
        pending = self.submit(test, "submitted", attempt=2)

        row = self.row(self.summary(), "Exam")
        self.assertEqual(row["status"], "graded")
        self.assertEqual(row["submission_id"], graded.id)
        self.assertEqual(row["latest_submission_id"], pending.id)
        self.assertTrue(row["has_pending_attempt"])

    def test_multi_question_scores_are_summed(self):
        test = self.make_test("Two", points=10)
        q2 = Question.objects.create(
            test=test, question_type="text", title="Q2", order=1, max_points=10
        )
        test.calculate_total_points()
        sub = self.submit(test, "graded", points=7)
        Answer.objects.create(submission=sub, question=q2, points_earned=8)

        row = self.row(self.summary(), "Two")
        self.assertEqual(row["score"], 15.0)
        self.assertEqual(row["max_score"], 20.0)
        self.assertEqual(row["percentage"], 75.0)


class AveragesTestCase(AcademicSummaryFixture):
    def test_unweighted_average_and_extremes(self):
        small = self.make_test("Quiz", points=5)
        big = self.make_test("Exam", points=100)
        self.submit(small, "graded", points=5)  # 100%
        self.submit(big, "graded", points=40)  # 40%

        s = self.summary()["summary"]
        self.assertEqual(s["average_percentage"], 70.0)
        self.assertEqual(s["highest_percentage"], 100.0)
        self.assertEqual(s["lowest_percentage"], 40.0)
        self.assertEqual(s["low_score_count"], 1)

    def test_low_score_threshold_is_strict(self):
        at = self.make_test("At", points=10)
        below = self.make_test("Below", points=10)
        self.submit(at, "graded", points=LOW_SCORE_THRESHOLD / 10)
        self.submit(below, "graded", points=4.9)
        data = self.summary()
        self.assertFalse(self.row(data, "At")["is_low_score"])
        self.assertTrue(self.row(data, "Below")["is_low_score"])

    def test_zero_point_test_has_no_percentage_and_is_excluded(self):
        zero = self.make_test("Survey", points=0)
        self.submit(zero, "graded")
        real = self.make_test("Real")
        self.submit(real, "graded", points=6)

        data = self.summary()
        self.assertEqual(self.row(data, "Survey")["status"], "graded")
        self.assertIsNone(self.row(data, "Survey")["percentage"])
        self.assertEqual(data["summary"]["average_percentage"], 60.0)

    def test_no_grades_yields_nulls_not_zeros(self):
        self.make_test("Open")
        s = self.summary()["summary"]
        self.assertIsNone(s["average_percentage"])
        self.assertIsNone(s["highest_percentage"])
        self.assertIsNone(s["attendance_rate"])


class TestSelectionTestCase(AcademicSummaryFixture):
    def test_drafts_and_other_cohorts_are_excluded(self):
        self.make_test("Draft", status="draft")
        self.make_test("Elsewhere", cohort=self.other_cohort)
        self.make_test("Mine")
        titles = [t["title"] for t in self.summary()["tests"]]
        self.assertEqual(titles, ["Mine"])

    def test_grades_survive_unenrollment_and_archiving(self):
        old = self.make_test("Old", cohort=self.other_cohort, status="archived")
        self.submit(old, "graded", points=10)
        row = self.row(self.summary(), "Old")
        self.assertEqual(row["percentage"], 100.0)
        self.assertEqual(row["test_status"], "archived")

    def test_classmate_submissions_do_not_leak(self):
        test = self.make_test("Shared")
        self.submit(test, "graded", points=10, student=self.classmate)
        row = self.row(self.summary(), "Shared")
        self.assertEqual(row["status"], "not_started")
        self.assertEqual(row["attempts_used"], 0)


class AttendanceTestCase(AcademicSummaryFixture):
    def test_attendance_counts_past_classes_only(self):
        live = self.make_class("Live", days_ago=3)
        rec = self.make_class("Recording", days_ago=2)
        self.make_class("Skipped", days_ago=1)
        self.make_class("Future", days_ago=-2)
        self.make_class("Other cohort", days_ago=1, cohort=self.other_cohort)
        self.attend(live)
        self.attend(rec, via_recording=True, minutes=30)

        data = self.summary()
        s = data["summary"]
        self.assertEqual(s["classes_held"], 3)
        self.assertEqual(s["classes_attended"], 2)
        self.assertEqual(s["classes_attended_live"], 1)
        self.assertEqual(s["classes_attended_recording"], 1)
        self.assertEqual(s["attendance_rate"], 66.7)
        # Newest first.
        self.assertEqual(
            [c["title"] for c in data["classes"]],
            ["Skipped", "Recording", "Live"],
        )
        by_title = {c["title"]: c for c in data["classes"]}
        self.assertEqual(by_title["Recording"]["attended_via"], "recording")
        self.assertEqual(by_title["Recording"]["minutes_attended"], 30)
        self.assertIsNone(by_title["Skipped"]["attended_via"])

    def test_live_join_beats_recording_for_same_class(self):
        cls = self.make_class("Both", days_ago=1)
        self.attend(cls, via_recording=True)
        self.attend(cls)
        data = self.summary()
        self.assertEqual(data["classes"][0]["attended_via"], "live")
        self.assertEqual(data["summary"]["classes_attended"], 1)

    def test_last_activity_is_latest_of_submission_or_class(self):
        cls = self.make_class("Recent", days_ago=1)
        self.attend(cls)
        test = self.make_test("T")
        self.submit(
            test, "submitted", submitted_at=self.now - timedelta(days=5)
        )
        self.assertEqual(
            self.summary()["summary"]["last_activity_at"],
            cls.scheduled_at.isoformat(),
        )


class CourseRollupTestCase(AcademicSummaryFixture):
    def test_per_course_average_and_attendance(self):
        t1 = self.make_test("T1")
        t2 = self.make_test("T2")
        self.make_test(
            "H1", course=self.homiletics, created_by=self.other_lecturer
        )
        self.submit(t1, "graded", points=10)
        self.submit(t2, "graded", points=5)
        attended = self.make_class("C1", days_ago=2)
        self.make_class("C2", days_ago=1)
        self.attend(attended)

        courses = {c["course_name"]: c for c in self.summary()["courses"]}
        self.assertEqual(list(courses), ["Homiletics", "Theology"])  # sorted
        theo = courses["Theology"]
        self.assertEqual(theo["tests_total"], 2)
        self.assertEqual(theo["tests_graded"], 2)
        self.assertEqual(theo["average_percentage"], 75.0)
        self.assertEqual(theo["classes_held"], 2)
        self.assertEqual(theo["attendance_rate"], 50.0)
        self.assertIsNone(courses["Homiletics"]["average_percentage"])
        self.assertIsNone(courses["Homiletics"]["attendance_rate"])


class LecturerScopeTestCase(AcademicSummaryFixture):
    def test_lecturer_sees_only_own_tests_and_classes(self):
        self.make_test(
            "Mine (created)", course=self.homiletics
        )  # created by me
        self.make_test(
            "Mine (course)",
            course=self.theology,
            created_by=self.other_lecturer,
        )
        self.make_test(
            "Not mine", course=self.homiletics, created_by=self.other_lecturer
        )
        self.make_class("My class", days_ago=1)
        self.make_class(
            "Their class",
            days_ago=1,
            course=self.homiletics,
            lecturer=self.other_lecturer,
        )

        data = self.summary(viewer=self.lecturer)
        self.assertEqual(data["scope"], "lecturer")
        self.assertEqual(
            sorted(t["title"] for t in data["tests"]),
            ["Mine (course)", "Mine (created)"],
        )
        self.assertEqual([c["title"] for c in data["classes"]], ["My class"])

        admin = self.summary(viewer=self.admin)
        self.assertEqual(admin["scope"], "all")
        self.assertEqual(len(admin["tests"]), 3)
        self.assertEqual(len(admin["classes"]), 2)

    def test_superuser_without_role_has_full_scope(self):
        root = User.objects.create_superuser(email="root@x.com", password="pw")
        self.make_test(
            "Any", created_by=self.other_lecturer, course=self.homiletics
        )
        self.assertEqual(len(self.summary(viewer=root)["tests"]), 1)


class QueryCountTestCase(AcademicSummaryFixture):
    def _count(self):
        with CaptureQueriesContext(connection) as ctx:
            self.summary()
        return len(ctx.captured_queries)

    def test_queries_do_not_grow_with_data(self):
        t = self.make_test("T0")
        self.submit(t, "graded", points=5)
        self.attend(self.make_class("C0", days_ago=1))
        baseline = self._count()

        for i in range(1, 8):
            t = self.make_test(f"T{i}")
            self.submit(t, "graded", points=i)
            self.submit(t, "submitted", attempt=2)
            self.attend(self.make_class(f"C{i}", days_ago=i + 1))

        self.assertEqual(self._count(), baseline)


class AcademicSummaryEndpointTestCase(AcademicSummaryFixture):
    def url(self, pk=None):
        return f"/api/students/{pk or self.student.id}/academic-summary/"

    def test_admin_gets_summary(self):
        self.submit(self.make_test("T"), "graded", points=10)
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["student_id"], self.student.id)
        self.assertEqual(response.data["summary"]["average_percentage"], 100.0)
        for key in (
            "summary",
            "courses",
            "tests",
            "classes",
            "low_score_threshold",
        ):
            self.assertIn(key, response.data)

    def test_lecturer_allowed(self):
        self.client.force_authenticate(self.lecturer)
        self.assertEqual(self.client.get(self.url()).status_code, 200)

    def test_students_cannot_read_summaries(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url()).status_code, 403)
        self.client.force_authenticate(self.classmate)
        self.assertEqual(self.client.get(self.url()).status_code, 403)

    def test_unauthenticated_rejected(self):
        self.assertEqual(self.client.get(self.url()).status_code, 401)

    def test_non_student_is_404(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.get(self.url(self.lecturer.id)).status_code, 404
        )
