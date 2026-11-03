"""
Academic summary for a single student, as seen by staff on the admin
dashboard's student profile.

One call answers "how is this student doing?" without the admin having to
open every test and class:

* every assessment the student is (or was) expected to take, with the grade
  that counts, the attempt history and what is still outstanding;
* per-course roll-ups (average grade, attendance);
* attendance across past classes in the student's cohorts;
* headline numbers and a list of things that need staff attention.

Grading rules (kept here so they live in exactly one place):

* A submission only has a score once its status is ``graded``.
* The grade that counts for a test is the **best graded attempt** (highest
  percentage, ties broken by the most recent grading).
* Percentages are ``score / test.total_points * 100``; a test worth 0 points
  has no percentage and is left out of averages.
* Averages are unweighted means of per-test percentages, so a 5-point quiz
  and a 100-point exam count the same. This matches how staff talk about
  "the student's average" and stops one large test from hiding the rest.

Scope:

* Admins (role ``admin``, ``is_staff`` or ``is_superuser``) see everything.
* Lecturers see only tests they created or tests in courses they lecture,
  and only classes they teach. This mirrors ``SubmissionViewSet`` and
  ``AttendanceViewSet`` so this endpoint never reveals more than the list
  endpoints already do.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Iterable, Optional

from django.db.models import Q, Sum
from django.utils import timezone

from apps.assessments.models import Submission, Test
from apps.classes.models import Attendance, Class
from apps.cohorts.models import Enrollment
from apps.users.models import User

# Percentage under which a graded test is flagged for staff attention.
LOW_SCORE_THRESHOLD = 50.0

# Row statuses, in the order the admin should care about them.
STATUS_GRADED = "graded"
STATUS_AWAITING_GRADING = "awaiting_grading"
STATUS_RETURNED = "returned"
STATUS_IN_PROGRESS = "in_progress"
STATUS_MISSED = "missed"
STATUS_NOT_STARTED = "not_started"
STATUS_UPCOMING = "upcoming"

ALL_STATUSES = (
    STATUS_GRADED,
    STATUS_AWAITING_GRADING,
    STATUS_RETURNED,
    STATUS_IN_PROGRESS,
    STATUS_MISSED,
    STATUS_NOT_STARTED,
    STATUS_UPCOMING,
)


def is_full_scope(viewer: User) -> bool:
    """True when the viewer may see every test and class."""
    return bool(
        viewer.is_superuser
        or viewer.is_staff
        or (viewer.role or "").lower() == "admin"
    )


def percentage(score: Optional[float], max_score: float) -> Optional[float]:
    """Score as a percentage, or None when it cannot be expressed as one."""
    if score is None or not max_score:
        return None
    return round(score / max_score * 100, 1)


def mean(values: Iterable[Optional[float]]) -> Optional[float]:
    """Mean of the non-None values, rounded to one decimal; None if empty."""
    present = [v for v in values if v is not None]
    if not present:
        return None
    return round(sum(present) / len(present), 1)


def rate(part: int, whole: int) -> Optional[float]:
    if not whole:
        return None
    return round(part / whole * 100, 1)


@dataclass
class _Attempt:
    submission: Submission
    score: Optional[float]
    percentage: Optional[float]


def _iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def derive_test_status(
    attempts: list[_Attempt], test: Test, now: datetime
) -> str:
    """
    Status of one test for one student.

    ``attempts`` must be ordered newest first. A graded attempt wins over any
    later activity (the student already has a grade; a newer attempt is
    reported separately as ``has_pending_attempt``).
    """
    if any(a.submission.status == "graded" for a in attempts):
        return STATUS_GRADED
    if attempts:
        latest = attempts[0].submission.status
        if latest == "submitted":
            return STATUS_AWAITING_GRADING
        if latest == "returned":
            return STATUS_RETURNED
        return STATUS_IN_PROGRESS
    if test.available_until and test.available_until < now:
        return STATUS_MISSED
    if test.available_from and test.available_from > now:
        return STATUS_UPCOMING
    return STATUS_NOT_STARTED


def _best_graded(attempts: list[_Attempt]) -> Optional[_Attempt]:
    graded = [a for a in attempts if a.submission.status == "graded"]
    if not graded:
        return None
    epoch = datetime.min.replace(tzinfo=timezone.get_current_timezone())
    return max(
        graded,
        key=lambda a: (
            a.percentage if a.percentage is not None else -1.0,
            a.submission.graded_at or epoch,
        ),
    )


def _visible_tests(student: User, viewer: User, cohort_ids: list[int]):
    """
    Tests the student is accountable for: published tests in any cohort they
    are enrolled in, plus any test they have actually submitted to (so grades
    survive unenrollment or a test being archived later).
    """
    submitted_test_ids = Submission.objects.filter(student=student).values(
        "test_id"
    )
    tests = Test.objects.filter(
        Q(status="published", cohort_id__in=cohort_ids)
        | Q(id__in=submitted_test_ids)
    )
    if not is_full_scope(viewer):
        tests = tests.filter(Q(created_by=viewer) | Q(course__lecturer=viewer))
    return tests.select_related("course", "cohort").distinct()


def _visible_classes(viewer: User, cohort_ids: list[int], now: datetime):
    classes = Class.objects.filter(
        cohort_id__in=cohort_ids, scheduled_at__lte=now
    )
    if not is_full_scope(viewer):
        classes = classes.filter(lecturer=viewer)
    return classes.select_related("course", "cohort", "lecturer")


def build_academic_summary(
    student: User, viewer: User, now: Optional[datetime] = None
) -> dict[str, Any]:
    now = now or timezone.now()

    enrollments = list(
        Enrollment.objects.filter(student=student).select_related("cohort")
    )
    cohort_ids = [e.cohort_id for e in enrollments]

    tests = list(
        _visible_tests(student, viewer, cohort_ids).order_by(
            "available_until", "created_at"
        )
    )
    test_ids = [t.id for t in tests]

    # One query for every attempt, with the score summed in the database
    # instead of the per-submission ``score`` property (which would issue a
    # query per submission).
    submissions = (
        Submission.objects.filter(student=student, test_id__in=test_ids)
        .select_related("graded_by")
        .annotate(points_earned_total=Sum("answers__points_earned"))
        .order_by("-created_at")
    )
    attempts_by_test: dict[int, list[_Attempt]] = defaultdict(list)
    tests_by_id = {t.id: t for t in tests}
    for sub in submissions:
        test = tests_by_id[sub.test_id]
        score = (
            float(sub.points_earned_total or 0.0)
            if sub.status == "graded"
            else None
        )
        attempts_by_test[sub.test_id].append(
            _Attempt(sub, score, percentage(score, test.total_points))
        )

    test_rows: list[dict[str, Any]] = []
    for test in tests:
        attempts = attempts_by_test.get(test.id, [])
        status = derive_test_status(attempts, test, now)
        best = _best_graded(attempts)
        latest = attempts[0] if attempts else None
        has_pending_attempt = bool(
            best
            and latest
            and latest.submission.id != best.submission.id
            and latest.submission.status in ("submitted", "in_progress")
        )
        counted = best or latest
        test_rows.append(
            {
                "test_id": test.id,
                "title": test.title,
                "course_id": test.course_id,
                "course_name": test.course.name,
                "cohort_id": test.cohort_id,
                "cohort_name": test.cohort.name,
                "test_status": test.status,
                "available_from": _iso(test.available_from),
                "available_until": _iso(test.available_until),
                "max_attempts": test.max_attempts,
                "attempts_used": len(attempts),
                "status": status,
                "score": best.score if best else None,
                "max_score": test.total_points,
                "percentage": best.percentage if best else None,
                "is_low_score": bool(
                    best
                    and best.percentage is not None
                    and best.percentage < LOW_SCORE_THRESHOLD
                ),
                "submission_id": counted.submission.id if counted else None,
                "latest_submission_id": (
                    latest.submission.id if latest else None
                ),
                "submitted_at": _iso(
                    counted.submission.submitted_at if counted else None
                ),
                "graded_at": _iso(best.submission.graded_at if best else None),
                "graded_by_name": (
                    best.submission.graded_by.get_full_name()
                    if best and best.submission.graded_by
                    else None
                ),
                "feedback": best.submission.feedback if best else "",
                "has_pending_attempt": has_pending_attempt,
                "attempts": [
                    {
                        "submission_id": a.submission.id,
                        "attempt_number": a.submission.attempt_number,
                        "status": a.submission.status,
                        "score": a.score,
                        "percentage": a.percentage,
                        "submitted_at": _iso(a.submission.submitted_at),
                        "graded_at": _iso(a.submission.graded_at),
                    }
                    for a in attempts
                ],
            }
        )

    # Attendance -----------------------------------------------------------
    past_classes = list(
        _visible_classes(viewer, cohort_ids, now).order_by("-scheduled_at")
    )
    attendance_by_class: dict[int, list[Attendance]] = defaultdict(list)
    for record in Attendance.objects.filter(
        student=student, class_session_id__in=[c.id for c in past_classes]
    ).order_by("join_time"):
        attendance_by_class[record.class_session_id].append(record)

    class_rows = []
    for cls in past_classes:
        records = attendance_by_class.get(cls.id, [])
        attended = bool(records)
        live = any(not r.via_recording for r in records)
        class_rows.append(
            {
                "class_id": cls.id,
                "title": cls.title,
                "course_id": cls.course_id,
                "course_name": cls.course.name,
                "cohort_id": cls.cohort_id,
                "cohort_name": cls.cohort.name,
                "scheduled_at": _iso(cls.scheduled_at),
                "duration_minutes": cls.duration_minutes,
                "attended": attended,
                # A live join beats a recording view of the same class.
                "attended_via": (
                    ("live" if live else "recording") if attended else None
                ),
                "minutes_attended": sum(r.duration_minutes for r in records),
                "verified": any(r.verified for r in records),
            }
        )

    attended_count = sum(1 for c in class_rows if c["attended"])
    live_count = sum(1 for c in class_rows if c["attended_via"] == "live")

    # Per-course roll-up --------------------------------------------------
    courses: dict[int, dict[str, Any]] = {}

    def course_entry(course_id: int, name: str) -> dict[str, Any]:
        if course_id not in courses:
            courses[course_id] = {
                "course_id": course_id,
                "course_name": name,
                "tests": [],
                "classes": [],
            }
        return courses[course_id]

    for row in test_rows:
        course_entry(row["course_id"], row["course_name"])["tests"].append(row)
    for row in class_rows:
        course_entry(row["course_id"], row["course_name"])["classes"].append(
            row
        )

    course_rows = []
    for entry in sorted(courses.values(), key=lambda c: c["course_name"]):
        c_tests, c_classes = entry["tests"], entry["classes"]
        c_attended = sum(1 for c in c_classes if c["attended"])
        course_rows.append(
            {
                "course_id": entry["course_id"],
                "course_name": entry["course_name"],
                "tests_total": len(c_tests),
                "tests_graded": sum(
                    1 for t in c_tests if t["status"] == STATUS_GRADED
                ),
                "average_percentage": mean(t["percentage"] for t in c_tests),
                "classes_held": len(c_classes),
                "classes_attended": c_attended,
                "attendance_rate": rate(c_attended, len(c_classes)),
            }
        )

    # Headline numbers ----------------------------------------------------
    status_counts = {s: 0 for s in ALL_STATUSES}
    for row in test_rows:
        status_counts[row["status"]] += 1

    graded_percentages = [
        t["percentage"] for t in test_rows if t["percentage"] is not None
    ]
    due_tests = [t for t in test_rows if t["status"] != STATUS_UPCOMING]
    turned_in = [
        t
        for t in due_tests
        if t["status"]
        in (STATUS_GRADED, STATUS_AWAITING_GRADING, STATUS_RETURNED)
    ]

    summary = {
        "average_percentage": mean(graded_percentages),
        "highest_percentage": (
            max(graded_percentages) if graded_percentages else None
        ),
        "lowest_percentage": (
            min(graded_percentages) if graded_percentages else None
        ),
        "tests_total": len(test_rows),
        "tests_due": len(due_tests),
        "tests_turned_in": len(turned_in),
        "completion_rate": rate(len(turned_in), len(due_tests)),
        "status_counts": status_counts,
        "low_score_count": sum(1 for t in test_rows if t["is_low_score"]),
        "classes_held": len(class_rows),
        "classes_attended": attended_count,
        "classes_attended_live": live_count,
        "classes_attended_recording": attended_count - live_count,
        "attendance_rate": rate(attended_count, len(class_rows)),
        "last_activity_at": _latest_activity(test_rows, class_rows),
    }

    return {
        "student_id": student.id,
        "generated_at": now.isoformat(),
        "scope": "all" if is_full_scope(viewer) else "lecturer",
        "low_score_threshold": LOW_SCORE_THRESHOLD,
        "summary": summary,
        "courses": course_rows,
        "tests": test_rows,
        "classes": class_rows,
    }


def _latest_activity(
    test_rows: list[dict[str, Any]], class_rows: list[dict[str, Any]]
) -> Optional[str]:
    """Most recent submission or attended class, as an ISO timestamp."""
    stamps = [
        a["submitted_at"]
        for t in test_rows
        for a in t["attempts"]
        if a["submitted_at"]
    ]
    stamps += [c["scheduled_at"] for c in class_rows if c["attended"]]
    # ISO-8601 strings from the same timezone sort chronologically.
    return max(stamps) if stamps else None
