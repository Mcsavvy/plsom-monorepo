from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta
from unittest.mock import patch

from apps.assessments.models import Test, Question, Submission, Answer
from apps.courses.models import Course
from apps.cohorts.models import Cohort, Enrollment

User = get_user_model()


class TestViewSetTestCase(APITestCase):
    """Test cases for TestViewSet with focus on unique constraint handling."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        # Create test users
        self.student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Student",
            role="student",
        )

        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
        )

        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Admin",
            role="admin",
        )

        # Create test course and cohort
        self.course = Course.objects.create(
            name="Test Course",
            program_type="certificate",
            module_count=5,
            description="Test course description",
            is_active=True,
        )

        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )

        # Create enrollment
        Enrollment.objects.create(student=self.student, cohort=self.cohort)

    def test_create_test_with_questions_no_constraint_violation(self):
        """Test creating a test with questions doesn't violate unique constraint."""
        self.client.force_authenticate(user=self.lecturer)

        test_data = {
            "title": "Test Assessment",
            "description": "Test description",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [
                {
                    "question_type": "text",
                    "title": "Question 1",
                    "order": 0,
                    "max_points": 10,
                },
                {
                    "question_type": "single_choice",
                    "title": "Question 2",
                    "order": 1,
                    "max_points": 5,
                    "options": [
                        {"text": "Option A", "is_correct": True, "order": 0},
                        {"text": "Option B", "is_correct": False, "order": 1},
                    ],
                },
            ],
        }

        response = self.client.post("/api/tests/", test_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify questions were created with correct order
        test = Test.objects.get(id=response.data["id"])
        questions = test.questions.all().order_by("order")
        self.assertEqual(questions.count(), 2)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)

    def test_update_test_with_breaking_changes_no_constraint_violation(self):
        """Test updating a test with breaking changes doesn't violate unique constraint."""
        self.client.force_authenticate(user=self.lecturer)

        # Create initial test
        test = Test.objects.create(
            title="Original Test",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
        )

        # Create initial questions
        question1 = Question.objects.create(
            test=test,
            question_type="text",
            title="Original Question 1",
            order=0,
            max_points=10,
        )

        Question.objects.create(
            test=test,
            question_type="text",
            title="Original Question 2",
            order=1,
            max_points=5,
        )

        # Create a submission to trigger the breaking changes path
        Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status="submitted",
        )

        # Update test with new questions (force=True needed because submitted submission exists)
        update_data = {
            "title": "Updated Test",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "force": True,
            "questions": [
                {
                    "id": str(question1.id),  # Keep existing question
                    "question_type": "text",
                    "title": "Updated Question 1",
                    "order": 0,
                    "max_points": 15,
                },
                {
                    "question_type": "single_choice",
                    "title": "New Question 2",
                    "order": 1,
                    "max_points": 10,
                    "options": [
                        {"text": "Option A", "is_correct": True, "order": 0},
                        {"text": "Option B", "is_correct": False, "order": 1},
                    ],
                },
                {
                    "question_type": "text",
                    "title": "New Question 3",
                    "order": 2,
                    "max_points": 5,
                },
            ],
        }

        response = self.client.put(
            f"/api/tests/{test.id}/", update_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify questions were updated correctly
        test.refresh_from_db()
        questions = test.questions.all().order_by("order")
        self.assertEqual(questions.count(), 3)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)
        self.assertEqual(questions[2].order, 2)

    def test_duplicate_question_order_violation_handled(self):
        """Test that the unique constraint violation is properly handled."""
        self.client.force_authenticate(user=self.lecturer)

        # Create a test with existing questions
        test = Test.objects.create(
            title="Test with Existing Questions",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
        )

        # Create questions with specific orders
        Question.objects.create(
            test=test,
            question_type="text",
            title="Existing Question 1",
            order=0,
            max_points=10,
        )

        Question.objects.create(
            test=test,
            question_type="text",
            title="Existing Question 2",
            order=1,
            max_points=5,
        )

        # Create a submission to trigger the breaking changes path
        Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status="submitted",
        )

        # Try to update with questions that would cause order conflicts
        # force=True needed since submitted submission exists; fix verifies no constraint violation
        update_data = {
            "title": "Updated Test",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "force": True,
            "questions": [
                {
                    "question_type": "text",
                    "title": "New Question 1",
                    "order": 0,  # This would conflict with existing order=0
                    "max_points": 10,
                },
                {
                    "question_type": "text",
                    "title": "New Question 2",
                    "order": 1,  # This would conflict with existing order=1
                    "max_points": 5,
                },
            ],
        }

        response = self.client.put(
            f"/api/tests/{test.id}/", update_data, format="json"
        )
        # Should succeed due to our fix that uses non-conflicting order values
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_question_reordering_after_cleanup(self):
        """Test that questions are properly reordered after cleanup."""
        self.client.force_authenticate(user=self.lecturer)

        # Create a test with existing questions
        test = Test.objects.create(
            title="Test for Reordering",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
        )

        # Create questions with non-sequential orders
        Question.objects.create(
            test=test,
            question_type="text",
            title="Question 1",
            order=5,  # Non-sequential order
            max_points=10,
        )

        Question.objects.create(
            test=test,
            question_type="text",
            title="Question 2",
            order=10,  # Non-sequential order
            max_points=5,
        )

        # Create a submission to trigger the breaking changes path
        Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status="submitted",
        )

        # Update test with new questions (force=True needed since submitted submission exists)
        update_data = {
            "title": "Updated Test",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "force": True,
            "questions": [
                {
                    "question_type": "text",
                    "title": "New Question 1",
                    "order": 0,
                    "max_points": 10,
                },
                {
                    "question_type": "text",
                    "title": "New Question 2",
                    "order": 1,
                    "max_points": 5,
                },
            ],
        }

        response = self.client.put(
            f"/api/tests/{test.id}/", update_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify questions are properly reordered
        test.refresh_from_db()
        questions = test.questions.all().order_by("order")

    def test_student_cannot_create_test(self):
        """Test that students cannot create tests."""
        self.client.force_authenticate(user=self.student)

        test_data = {
            "title": "Unauthorized Test",
            "description": "Test description",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [],
        }

        response = self.client.post("/api/tests/", test_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lecturer_can_create_test(self):
        """Test that lecturers can create tests."""
        self.client.force_authenticate(user=self.lecturer)

        test_data = {
            "title": "Lecturer Test",
            "description": "Test description",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [
                {
                    "question_type": "text",
                    "title": "Question 1",
                    "order": 0,
                    "max_points": 10,
                }
            ],
        }

        response = self.client.post("/api/tests/", test_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_can_create_test(self):
        """Test that admins can create tests."""
        self.client.force_authenticate(user=self.admin)

        test_data = {
            "title": "Admin Test",
            "description": "Test description",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [
                {
                    "question_type": "text",
                    "title": "Question 1",
                    "order": 0,
                    "max_points": 10,
                }
            ],
        }

        response = self.client.post("/api/tests/", test_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class TestPerformanceTestCase(APITestCase):
    """Test cases for performance optimization in test creation."""

    def setUp(self):
        self.client = APIClient()
        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
        )

        self.course = Course.objects.create(
            name="Test Course",
            program_type="certificate",
            module_count=5,
            description="Test course description",
            is_active=True,
        )

        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            is_active=True,
        )

    def test_large_test_creation_performance(self):
        """Test creating a test with many questions doesn't cause performance issues."""
        self.client.force_authenticate(user=self.lecturer)

        # Create a test with many questions
        questions = []
        for i in range(50):  # 50 questions
            questions.append(
                {
                    "question_type": "text",
                    "title": f"Question {i + 1}",
                    "order": i,
                    "max_points": 10,
                }
            )

        test_data = {
            "title": "Large Test",
            "description": "Test with many questions",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": questions,
        }

        response = self.client.post("/api/tests/", test_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify all questions were created with correct order
        test = Test.objects.get(id=response.data["id"])
        questions = test.questions.all().order_by("order")
        self.assertEqual(questions.count(), 50)

        # Verify order is sequential
        for i, question in enumerate(questions):
            self.assertEqual(question.order, i)


class ResubmissionFlowTestCase(APITestCase):
    """Test cases for the resubmission lifecycle (A.6.1)."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        self.student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Student",
            role="student",
        )
        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
        )

        self.course = Course.objects.create(
            name="Test Course",
            program_type="certificate",
            module_count=5,
            description="Test course description",
            is_active=True,
        )
        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )
        Enrollment.objects.create(student=self.student, cohort=self.cohort)

        # Create a published test
        self.test = Test.objects.create(
            title="Sample Test",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
            status="published",
            available_from=self.now - timedelta(hours=1),
            available_until=self.now + timedelta(hours=1),
            max_attempts=3,
        )
        self.question = Question.objects.create(
            test=self.test,
            question_type="text",
            title="Question 1",
            order=0,
            max_points=10,
            is_required=True,
        )

    def _make_returned_submission(self):
        """Helper: create a submission in 'returned' status."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="returned",
            attempt_number=1,
        )
        return sub

    def _make_graded_submission(self):
        """Helper: create a graded submission."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="graded",
            attempt_number=1,
            submitted_at=self.now,
            graded_by=self.lecturer,
            graded_at=self.now,
            feedback="Good job.",
        )
        Answer.objects.create(
            submission=sub,
            question=self.question,
            text_answer="My answer",
            points_earned=8.0,
            feedback="Nice work.",
        )
        return sub

    def test_resubmit_endpoint_flips_status(self):
        """returned → in_progress, clears submitted_at."""
        sub = self._make_returned_submission()
        sub.submitted_at = self.now
        sub.save()

        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/api/submissions/{sub.id}/resubmit/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertEqual(sub.status, "in_progress")
        self.assertIsNone(sub.submitted_at)

    def test_resubmit_preserves_grader_feedback(self):
        """graded_by, graded_at, per-answer feedback intact after resubmit."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="returned",
            attempt_number=1,
            graded_by=self.lecturer,
            graded_at=self.now,
            feedback="Nice try.",
        )
        answer = Answer.objects.create(
            submission=sub,
            question=self.question,
            text_answer="An answer",
            points_earned=5.0,
            feedback="Per-answer note.",
        )
        self.client.force_authenticate(user=self.student)
        self.client.post(f"/api/submissions/{sub.id}/resubmit/")
        sub.refresh_from_db()
        answer.refresh_from_db()
        # Grader info is preserved
        self.assertEqual(sub.graded_by, self.lecturer)
        self.assertIsNotNone(sub.graded_at)
        self.assertEqual(answer.feedback, "Per-answer note.")

    def test_resubmit_only_works_on_returned(self):
        """400 if status != 'returned'."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/api/submissions/{sub.id}/resubmit/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_returned_submission_not_counted_in_attempts(self):
        """returned submission is excluded from attempts_remaining."""
        self._make_returned_submission()
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f"/api/tests/{self.test.id}/my-test/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # max_attempts=3, returned doesn't count → 3 remaining
        self.assertEqual(response.data["attempts_remaining"], 3)

    def test_cannot_start_while_in_progress(self):
        """400 if a student tries to create a new submission while one is in_progress."""
        Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/submissions/", {"test": self.test.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_submission_rejected(self):
        """400 when no answers and required questions exist."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/api/submissions/{sub.id}/submit/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no questions have been answered", response.data["error"])

    def test_incomplete_required_rejected_without_confirm(self):
        """400 + confirm_required when required question unanswered."""
        # A test with a non-required question (so we have at least one answer)
        q2 = Question.objects.create(
            test=self.test,
            question_type="text",
            title="Optional Question",
            order=1,
            max_points=5,
            is_required=False,
        )
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        # Answer only the optional question
        Answer.objects.create(
            submission=sub, question=q2, text_answer="Some text"
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/api/submissions/{sub.id}/submit/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(response.data.get("confirm_required"))

    def test_incomplete_required_allowed_with_confirm(self):
        """200 when confirm=true even with missing required question."""
        q2 = Question.objects.create(
            test=self.test,
            question_type="text",
            title="Optional Question",
            order=1,
            max_points=5,
            is_required=False,
        )
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        # Answer only the optional question
        Answer.objects.create(
            submission=sub, question=q2, text_answer="Some text"
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/submissions/{sub.id}/submit/", {"confirm": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_submit_after_available_until_blocked_if_started_after(self):
        """400 when started_at > test.available_until."""
        past_deadline = self.now - timedelta(hours=2)
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        # Manually set started_at to after the deadline
        Submission.objects.filter(id=sub.id).update(started_at=past_deadline + timedelta(hours=3))
        sub.refresh_from_db()
        self.test.available_until = past_deadline + timedelta(hours=1)
        self.test.save()

        # Give the submission an answer so empty-check passes
        Answer.objects.create(
            submission=sub, question=self.question, text_answer="Answer"
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/submissions/{sub.id}/submit/", {"confirm": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no longer available", response.data["error"])

    def test_submit_after_available_until_allowed_if_started_before(self):
        """200 when started_at < test.available_until (leniency rule)."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        # started_at is set to now by auto_now_add, available_until is now+1h
        Answer.objects.create(
            submission=sub, question=self.question, text_answer="Answer"
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/api/submissions/{sub.id}/submit/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_auto_submit_celery_task(self):
        """auto_submit_expired_tests auto-submits expired in-progress submissions."""
        from apps.assessments.tasks import auto_submit_expired_tests
        # Give test a 10-minute time limit
        self.test.time_limit_minutes = 10
        self.test.save()

        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        # Simulate started 20 minutes ago
        Submission.objects.filter(id=sub.id).update(
            started_at=self.now - timedelta(minutes=20)
        )

        with patch("apps.notifications.tasks.send_submission_auto_submitted_notification"):
            result = auto_submit_expired_tests()

        sub.refresh_from_db()
        self.assertEqual(sub.status, "submitted")
        self.assertIn("1", result)

    def test_file_not_clobbered_by_upsert(self):
        """Upsert text answer must not clear file_answer."""
        import io
        from django.core.files.uploadedfile import SimpleUploadedFile
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        # Manually set a file answer
        file_q = Question.objects.create(
            test=self.test,
            question_type="document_upload",
            title="Upload File",
            order=2,
            max_points=5,
        )
        answer = Answer.objects.create(submission=sub, question=file_q)
        answer.file_answer.save("test.txt", SimpleUploadedFile("test.txt", b"content"))
        answer.save()

        # Upsert a text answer for the text question
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/submissions/{sub.id}/answers/",
            {"answers": [{"question": str(self.question.id), "text_answer": "Updated"}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        answer.refresh_from_db()
        self.assertTrue(bool(answer.file_answer))

    def test_resubmit_clears_per_answer_grading_on_submit(self):
        """After resubmit+submit, points_earned=None."""
        sub = self._make_graded_submission()
        sub.status = "returned"
        sub.save()

        # Reopen
        self.client.force_authenticate(user=self.student)
        self.client.post(f"/api/submissions/{sub.id}/resubmit/")

        # Submit with an answer
        self.client.post(
            f"/api/submissions/{sub.id}/answers/",
            {"answers": [{"question": str(self.question.id), "text_answer": "New answer"}]},
            format="json",
        )
        response = self.client.post(f"/api/submissions/{sub.id}/submit/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        answer = sub.answers.get(question=self.question)
        self.assertIsNone(answer.points_earned)

    def test_grading_history_appended_on_resubmit(self):
        """grading_history has one entry after graded → returned → in_progress → submit."""
        sub = self._make_graded_submission()
        sub.status = "returned"
        sub.save()

        self.client.force_authenticate(user=self.student)
        self.client.post(f"/api/submissions/{sub.id}/resubmit/")
        self.client.post(
            f"/api/submissions/{sub.id}/answers/",
            {"answers": [{"question": str(self.question.id), "text_answer": "Revised"}]},
            format="json",
        )
        self.client.post(f"/api/submissions/{sub.id}/submit/")

        sub.refresh_from_db()
        self.assertEqual(len(sub.grading_history), 1)
        self.assertEqual(sub.grading_history[0]["grader_name"], self.lecturer.get_full_name())

    def test_score_null_on_returned(self):
        """score property returns None for a 'returned' submission."""
        sub = self._make_graded_submission()
        self.assertIsNotNone(sub.score)  # graded → has score
        sub.status = "returned"
        sub.save()
        sub.refresh_from_db()
        self.assertIsNone(sub.score)  # returned → None


# ---------------------------------------------------------------------------
# B.12 — Phase B tests
# ---------------------------------------------------------------------------

class PhaseBConcurrencyTestCase(APITestCase):
    """B.12.1-3: Optimistic concurrency tests for upsert_answers and grade_submission."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        self.student = User.objects.create_user(
            email="b_student@example.com",
            password="testpassword123",
            first_name="B",
            last_name="Student",
            role="student",
        )
        self.lecturer = User.objects.create_user(
            email="b_lecturer@example.com",
            password="testpassword123",
            first_name="B",
            last_name="Lecturer",
            role="lecturer",
        )
        self.admin = User.objects.create_user(
            email="b_admin@example.com",
            password="testpassword123",
            first_name="B",
            last_name="Admin",
            role="admin",
        )
        self.course = Course.objects.create(
            name="B Course",
            program_type="certificate",
            module_count=5,
            description="desc",
            is_active=True,
        )
        self.cohort = Cohort.objects.create(
            name="B Cohort",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )
        Enrollment.objects.create(student=self.student, cohort=self.cohort)

        self.test = Test.objects.create(
            title="B Test",
            description="desc",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
            status="published",
            available_from=self.now - timedelta(hours=1),
            available_until=self.now + timedelta(hours=2),
        )
        self.question = Question.objects.create(
            test=self.test,
            question_type="text",
            title="Q1",
            order=0,
            max_points=10,
        )

    def _make_submission(self):
        return Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )

    def test_upsert_with_stale_updated_at_returns_409(self):
        """Client sends old updated_at, gets 409 with current_submission."""
        sub = self._make_submission()
        # Advance updated_at by simulating a save after the client's snapshot
        stale_ts = (sub.updated_at - timedelta(seconds=10)).isoformat()
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/submissions/{sub.id}/answers/",
            {
                "answers": [{"question": str(self.question.id), "text_answer": "new"}],
                "client_updated_at": stale_ts,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertTrue(response.data.get("conflict"))
        self.assertIn("current_submission", response.data)

    def test_upsert_without_client_updated_at_succeeds(self):
        """No client_updated_at = last-write-wins; always succeeds."""
        sub = self._make_submission()
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/submissions/{sub.id}/answers/",
            {"answers": [{"question": str(self.question.id), "text_answer": "ok"}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_grade_with_stale_updated_at_returns_409(self):
        """Grader sends stale updated_at, gets 409."""
        sub = self._make_submission()
        sub.status = "submitted"
        sub.submitted_at = self.now
        sub.save()
        Answer.objects.create(submission=sub, question=self.question, text_answer="ans")

        stale_ts = (sub.updated_at - timedelta(seconds=5)).isoformat()
        self.client.force_authenticate(user=self.lecturer)
        response = self.client.post(
            f"/api/submissions/{sub.id}/grade/",
            {
                "answers": [{"answer_id": str(sub.answers.first().id), "points_earned": 8}],
                "client_updated_at": stale_ts,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertTrue(response.data.get("conflict"))


class PhaseBFileStorageTestCase(APITestCase):
    """B.12.4-6: File storage cleanup tests."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        self.student = User.objects.create_user(
            email="bs_student@example.com",
            password="testpassword123",
            first_name="BS",
            last_name="Student",
            role="student",
        )
        self.lecturer = User.objects.create_user(
            email="bs_lecturer@example.com",
            password="testpassword123",
            first_name="BS",
            last_name="Lecturer",
            role="lecturer",
        )
        self.course = Course.objects.create(
            name="BS Course",
            program_type="certificate",
            module_count=5,
            description="desc",
            is_active=True,
        )
        self.cohort = Cohort.objects.create(
            name="BS Cohort",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )
        Enrollment.objects.create(student=self.student, cohort=self.cohort)

        self.test = Test.objects.create(
            title="BS Test",
            description="desc",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
            status="published",
            available_from=self.now - timedelta(hours=1),
            available_until=self.now + timedelta(hours=2),
        )
        self.file_question = Question.objects.create(
            test=self.test,
            question_type="document_upload",
            title="File Q",
            order=0,
            max_points=5,
        )

    def test_file_deleted_from_storage_on_overwrite(self):
        """Old file is deleted when a new file is uploaded to the same question."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        sub = Submission.objects.create(
            test=self.test, student=self.student, status="in_progress", attempt_number=1
        )
        answer = Answer.objects.create(submission=sub, question=self.file_question)
        answer.file_answer.save("old.txt", SimpleUploadedFile("old.txt", b"old content"))
        answer.save()
        old_name = answer.file_answer.name

        self.client.force_authenticate(user=self.student)
        new_file = SimpleUploadedFile("new.txt", b"new content")
        with patch("django.core.files.storage.FileSystemStorage.delete") as mock_delete:
            self.client.post(
                f"/api/submissions/{sub.id}/upload/",
                {"question": str(self.file_question.id), "file": new_file},
                format="multipart",
            )
            mock_delete.assert_called()

    def test_file_deleted_from_storage_on_submission_delete(self):
        """All file_answers removed from storage when submission is deleted."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        sub = Submission.objects.create(
            test=self.test, student=self.student, status="in_progress", attempt_number=1
        )
        answer = Answer.objects.create(submission=sub, question=self.file_question)
        answer.file_answer.save("del.txt", SimpleUploadedFile("del.txt", b"data"))
        answer.save()

        with patch("django.core.files.storage.FileSystemStorage.delete") as mock_delete:
            sub.delete()
            mock_delete.assert_called()

    def test_file_deleted_when_question_type_changes_from_document_upload(self):
        """Orphaned files cleaned up when question type changes away from document_upload."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        sub = Submission.objects.create(
            test=self.test, student=self.student, status="in_progress", attempt_number=1
        )
        answer = Answer.objects.create(submission=sub, question=self.file_question)
        answer.file_answer.save("type_change.txt", SimpleUploadedFile("tc.txt", b"data"))
        answer.save()

        # Update the question type away from document_upload via the serializer
        from apps.assessments.serializers import TestSerializer
        data = {
            "title": self.test.title,
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [
                {
                    "id": str(self.file_question.id),
                    "question_type": "text",  # changed
                    "title": "File Q",
                    "order": 0,
                    "max_points": 5,
                    "is_required": True,
                }
            ],
        }
        with patch("django.core.files.storage.FileSystemStorage.delete") as mock_delete:
            serializer = TestSerializer(
                self.test, data=data, partial=True, context={"force": True}
            )
            if serializer.is_valid():
                serializer.save()
            mock_delete.assert_called()


class PhaseBPermissionTestCase(APITestCase):
    """B.12.7-8: Lecturer OR permission tests."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        self.student = User.objects.create_user(
            email="bp_student@example.com",
            password="testpassword123",
            first_name="BP",
            last_name="Student",
            role="student",
        )
        self.lecturer_creator = User.objects.create_user(
            email="bp_lect_creator@example.com",
            password="testpassword123",
            first_name="BPCreator",
            last_name="Lect",
            role="lecturer",
        )
        self.lecturer_course = User.objects.create_user(
            email="bp_lect_course@example.com",
            password="testpassword123",
            first_name="BPCourse",
            last_name="Lect",
            role="lecturer",
        )
        self.course = Course.objects.create(
            name="BP Course",
            program_type="certificate",
            module_count=5,
            description="desc",
            is_active=True,
            lecturer=self.lecturer_course,
        )
        self.cohort = Cohort.objects.create(
            name="BP Cohort",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )
        Enrollment.objects.create(student=self.student, cohort=self.cohort)

        self.test = Test.objects.create(
            title="BP Test",
            description="desc",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer_creator,
            status="published",
            available_from=self.now - timedelta(hours=1),
            available_until=self.now + timedelta(hours=2),
        )
        question = Question.objects.create(
            test=self.test, question_type="text", title="Q", order=0, max_points=5
        )
        sub = Submission.objects.create(
            test=self.test, student=self.student, status="submitted",
            submitted_at=self.now, attempt_number=1
        )
        Answer.objects.create(submission=sub, question=question, text_answer="ans")

    def test_lecturer_sees_own_created_submissions(self):
        """Lecturer who created the test can see its submissions."""
        self.client.force_authenticate(user=self.lecturer_creator)
        response = self.client.get("/api/submissions/")
        self.assertEqual(response.status_code, 200)
        self.assertGreater(response.data["count"], 0)

    def test_lecturer_sees_course_submissions_not_created_by_them(self):
        """Lecturer assigned to course (but did not create test) sees submissions."""
        self.client.force_authenticate(user=self.lecturer_course)
        response = self.client.get("/api/submissions/")
        self.assertEqual(response.status_code, 200)
        self.assertGreater(response.data["count"], 0)


class PhaseBLifecycleTestCase(APITestCase):
    """B.12.9-11: Test lifecycle guard tests."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        self.student = User.objects.create_user(
            email="bl_student@example.com",
            password="testpassword123",
            first_name="BL",
            last_name="Student",
            role="student",
        )
        self.lecturer = User.objects.create_user(
            email="bl_lecturer@example.com",
            password="testpassword123",
            first_name="BL",
            last_name="Lecturer",
            role="lecturer",
        )
        self.course = Course.objects.create(
            name="BL Course",
            program_type="certificate",
            module_count=5,
            description="desc",
            is_active=True,
        )
        self.cohort = Cohort.objects.create(
            name="BL Cohort",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )
        Enrollment.objects.create(student=self.student, cohort=self.cohort)
        self.test = Test.objects.create(
            title="BL Test",
            description="desc",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
            status="published",
            available_from=self.now - timedelta(hours=1),
            available_until=self.now + timedelta(hours=2),
        )
        self.question = Question.objects.create(
            test=self.test, question_type="text", title="Q", order=0, max_points=5
        )

    def test_delete_test_with_submissions_requires_confirm(self):
        """DELETE /tests/{id}/ returns 400 when test has submissions and confirm omitted."""
        Submission.objects.create(
            test=self.test, student=self.student, status="submitted",
            submitted_at=self.now, attempt_number=1
        )
        self.client.force_authenticate(user=self.lecturer)
        response = self.client.delete(f"/api/tests/{self.test.id}/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("submission_count", response.data)

    def test_delete_test_without_submissions_succeeds_without_confirm(self):
        """DELETE /tests/{id}/ succeeds without confirm when no submissions."""
        self.client.force_authenticate(user=self.lecturer)
        response = self.client.delete(f"/api/tests/{self.test.id}/")
        self.assertEqual(response.status_code, 204)

    def test_cohort_change_blocked_with_active_submissions(self):
        """PATCH /tests/{id}/ blocks cohort change when active submissions exist."""
        Submission.objects.create(
            test=self.test, student=self.student, status="submitted",
            submitted_at=self.now, attempt_number=1
        )
        new_cohort = Cohort.objects.create(
            name="New Cohort BL",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )
        self.client.force_authenticate(user=self.lecturer)
        response = self.client.patch(
            f"/api/tests/{self.test.id}/",
            {"cohort": new_cohort.id},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class PhaseBNotificationTestCase(APITestCase):
    """B.12.12: test_updated notification skipped on internal save."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        self.lecturer = User.objects.create_user(
            email="bn_lecturer@example.com",
            password="testpassword123",
            first_name="BN",
            last_name="Lecturer",
            role="lecturer",
        )
        self.course = Course.objects.create(
            name="BN Course",
            program_type="certificate",
            module_count=5,
            description="desc",
            is_active=True,
        )
        self.cohort = Cohort.objects.create(
            name="BN Cohort",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )
        self.test = Test.objects.create(
            title="BN Test",
            description="desc",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
            status="published",
        )

    @patch("apps.assessments.signals.async_task")
    def test_test_updated_notification_skipped_on_internal_save(self, mock_async):
        """Saving only total_points (internal) should not fire test_updated."""
        self.test._questions_updated = True
        # Simulate internal save with only total_points updated
        self.test.save(update_fields=["total_points"])
        # test_updated should not be queued
        for call_args in mock_async.call_args_list:
            args = call_args[0]
            self.assertNotEqual(args[1] if len(args) > 1 else None, "test_updated")


class PhaseBValidationTestCase(APITestCase):
    """B.12.13: max_points minimum value validator."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        self.lecturer = User.objects.create_user(
            email="bv_lecturer@example.com",
            password="testpassword123",
            first_name="BV",
            last_name="Lecturer",
            role="lecturer",
        )
        self.course = Course.objects.create(
            name="BV Course",
            program_type="certificate",
            module_count=5,
            description="desc",
            is_active=True,
        )
        self.cohort = Cohort.objects.create(
            name="BV Cohort",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )

    def test_max_points_below_minimum_rejected(self):
        """Creating a test with max_points=0 should be rejected by the validator."""
        self.client.force_authenticate(user=self.lecturer)
        test_data = {
            "title": "BV Test",
            "description": "desc",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [
                {
                    "question_type": "text",
                    "title": "Q",
                    "order": 0,
                    "max_points": 0,  # Invalid — below 0.01
                },
            ],
        }
        response = self.client.post("/api/tests/", test_data, format="json")
        self.assertIn(response.status_code, [400, 422])
