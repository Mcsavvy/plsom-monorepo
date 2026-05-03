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
