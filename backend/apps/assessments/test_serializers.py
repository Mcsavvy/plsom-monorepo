"""
Tests for assessment serializers with focus on unique constraint handling.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework.exceptions import ValidationError as DRFValidationError
from datetime import timedelta
from unittest.mock import patch

from apps.assessments.models import (
    Test,
    Question,
    Submission,
    Answer,
)
from apps.assessments.serializers import TestSerializer
from apps.courses.models import Course
from apps.cohorts.models import Cohort, Enrollment

User = get_user_model()


class TestSerializerTestCase(APITestCase):
    """Test cases for TestSerializer with unique constraint handling."""

    def setUp(self):
        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
        )

        self.student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Student",
            role="student",
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
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            is_active=True,
        )

        # Create enrollment
        Enrollment.objects.create(student=self.student, cohort=self.cohort)

    def test_create_test_with_questions_no_constraint_violation(self):
        """Test creating a test with questions doesn't violate unique constraint."""
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

        serializer = TestSerializer(data=test_data)
        self.assertTrue(
            serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        )

        test = serializer.save(created_by=self.lecturer)

        # Verify questions were created with correct order
        questions = test.questions.all().order_by("order")
        self.assertEqual(questions.count(), 2)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)

    def test_update_test_with_breaking_changes_no_constraint_violation(self):
        """Test updating a test with breaking changes doesn't violate unique constraint."""
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

        # No active submissions — tests the simple delete+recreate path
        # (submitted submissions require force=True which is tested in BreakingChangeSerializerTestCase)

        # Update test with new questions (this triggers _safe_update_questions → _update_questions_simple)
        update_data = {
            "title": "Updated Test",
            "questions": [
                {
                    "id": str(question1.id),  # Keep existing question (stripped by serializer, but order preserved)
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

        serializer = TestSerializer(test, data=update_data, partial=True)
        self.assertTrue(
            serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        )

        updated_test = serializer.save()

        # Verify questions were updated correctly
        questions = updated_test.questions.all().order_by("order")
        self.assertEqual(questions.count(), 3)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)
        self.assertEqual(questions[2].order, 2)

    def test_duplicate_question_order_violation_handled(self):
        """Test that the unique constraint violation is properly handled."""
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
        # No active submissions — tests the simple delete+recreate path

        # Try to update with questions that would cause order conflicts
        # This should not fail due to our fix
        update_data = {
            "title": "Updated Test",
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

        serializer = TestSerializer(test, data=update_data, partial=True)
        self.assertTrue(
            serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        )

        updated_test = serializer.save()

        # Verify questions were created successfully
        questions = updated_test.questions.all().order_by("order")
        self.assertEqual(questions.count(), 2)

    def test_question_reordering_after_cleanup(self):
        """Test that questions are properly reordered after cleanup."""
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

        # No active submissions — tests simple delete+recreate path

        # Update test with new questions (this triggers _safe_update_questions → _update_questions_simple)
        update_data = {
            "title": "Updated Test",
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

        serializer = TestSerializer(test, data=update_data, partial=True)
        self.assertTrue(
            serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        )

        updated_test = serializer.save()

        # Verify questions are properly reordered
        questions = updated_test.questions.all().order_by("order")
        self.assertEqual(questions.count(), 2)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)

    def test_large_test_creation_performance(self):
        """Test creating a test with many questions doesn't cause performance issues."""
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

        serializer = TestSerializer(data=test_data)
        self.assertTrue(
            serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        )

        test = serializer.save(created_by=self.lecturer)

        # Verify all questions were created with correct order
        questions = test.questions.all().order_by("order")
        self.assertEqual(questions.count(), 50)

        # Verify order is sequential
        for i, question in enumerate(questions):
            self.assertEqual(question.order, i)

    def test_question_option_creation_with_mapping(self):
        """Test that question options are created correctly with mapping."""
        test_data = {
            "title": "Test with Options",
            "description": "Test description",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [
                {
                    "question_type": "single_choice",
                    "title": "Multiple Choice Question",
                    "order": 0,
                    "max_points": 10,
                    "options": [
                        {"text": "Option A", "is_correct": True, "order": 0},
                        {"text": "Option B", "is_correct": False, "order": 1},
                        {"text": "Option C", "is_correct": False, "order": 2},
                    ],
                }
            ],
        }

        serializer = TestSerializer(data=test_data)
        self.assertTrue(
            serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        )

        test = serializer.save(created_by=self.lecturer)

        # Verify question and options were created
        question = test.questions.first()
        self.assertEqual(question.question_type, "single_choice")

        options = question.options.all().order_by("order")
        self.assertEqual(options.count(), 3)
        self.assertEqual(options[0].order, 0)
        self.assertEqual(options[1].order, 1)
        self.assertEqual(options[2].order, 2)

    def test_serializer_validation_errors(self):
        """Test that serializer validation works correctly."""
        # Test with invalid data
        invalid_data = {
            "title": "",  # Empty title should fail
            "description": "Test description",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [],
        }

        serializer = TestSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("title", serializer.errors)

    def test_serializer_without_questions(self):
        """Test creating a test without questions."""
        test_data = {
            "title": "Test Without Questions",
            "description": "Test description",
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": [],
        }

        serializer = TestSerializer(data=test_data)
        self.assertTrue(
            serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        )

        test = serializer.save(created_by=self.lecturer)

        # Verify test was created without questions
        self.assertEqual(test.questions.count(), 0)
        self.assertEqual(test.title, "Test Without Questions")


class BreakingChangeSerializerTestCase(APITestCase):
    """Test cases for breaking-change detection in TestSerializer (A.6.2)."""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()

        self.lecturer = User.objects.create_user(
            email="lecturer@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
        )
        self.student = User.objects.create_user(
            email="student@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="Student",
            role="student",
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

        # Create a test with one question
        self.test = Test.objects.create(
            title="Test",
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
            status="published",
            available_from=self.now - timedelta(hours=1),
            available_until=self.now + timedelta(hours=1),
        )
        self.question = Question.objects.create(
            test=self.test,
            question_type="text",
            title="Question 1",
            order=0,
            max_points=10.0,
            is_required=False,
        )

    def _make_submitted_submission(self):
        """Create a submitted submission with an answer."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="submitted",
            attempt_number=1,
            submitted_at=self.now,
        )
        Answer.objects.create(
            submission=sub, question=self.question, text_answer="Answer"
        )
        return sub

    def _serialize_update(self, questions_data, force=False):
        """Run a serializer update with optional force context."""
        context = {"request": None, "force": force}
        data = {
            "title": self.test.title,
            "course": self.course.id,
            "cohort": self.cohort.id,
            "questions": questions_data,
        }
        serializer = TestSerializer(self.test, data=data, context=context, partial=True)
        serializer.is_valid(raise_exception=True)
        return serializer.save(created_by=self.lecturer)

    def test_breaking_change_rejected_without_force(self):
        """400 with breaking_change: True when force=False and submissions exist."""
        self._make_submitted_submission()
        with self.assertRaises(DRFValidationError) as ctx:
            self._serialize_update(
                [{"id": str(self.question.id), "question_type": "essay", "title": "Q1", "max_points": 10}],
                force=False,
            )
        self.assertTrue(ctx.exception.detail.get("breaking_change"))

    def test_breaking_change_accepted_with_force(self):
        """With force=True, submissions are returned and test updated."""
        sub = self._make_submitted_submission()
        self._serialize_update(
            [{"id": str(self.question.id), "question_type": "essay", "title": "Q1", "max_points": 10}],
            force=True,
        )
        sub.refresh_from_db()
        self.assertEqual(sub.status, "returned")

    def test_new_question_with_uuid_detected_as_breaking(self):
        """A new question with a client-generated UUID is detected as breaking."""
        import uuid
        self._make_submitted_submission()
        with self.assertRaises(DRFValidationError) as ctx:
            self._serialize_update(
                [
                    {"id": str(self.question.id), "question_type": "text", "title": "Q1", "max_points": 10},
                    {"id": str(uuid.uuid4()), "question_type": "text", "title": "New Q", "max_points": 5},
                ],
                force=False,
            )
        self.assertTrue(ctx.exception.detail.get("breaking_change"))

    def test_max_points_no_op_not_breaking(self):
        """1.0 → 1.0000001 is NOT a breaking change (epsilon guard)."""
        sub = self._make_submitted_submission()
        # This should NOT raise
        self._serialize_update(
            [{"id": str(self.question.id), "question_type": "text", "title": "Q1", "max_points": 10.0000001}],
            force=False,
        )
        sub.refresh_from_db()
        self.assertEqual(sub.status, "submitted")  # unchanged

    def test_max_points_real_change_is_breaking(self):
        """1.0 → 2.0 IS a breaking change."""
        self._make_submitted_submission()
        with self.assertRaises(DRFValidationError) as ctx:
            self._serialize_update(
                [{"id": str(self.question.id), "question_type": "text", "title": "Q1", "max_points": 20.0}],
                force=False,
            )
        self.assertTrue(ctx.exception.detail.get("breaking_change"))

    def test_is_required_toggle_with_all_answered_not_breaking(self):
        """false→true on is_required when all submissions have an answer is NOT breaking."""
        sub = self._make_submitted_submission()
        # All submissions already answered the question → not breaking
        self._serialize_update(
            [{"id": str(self.question.id), "question_type": "text", "title": "Q1", "max_points": 10, "is_required": True}],
            force=False,
        )
        sub.refresh_from_db()
        self.assertEqual(sub.status, "submitted")  # not returned

    def test_is_required_toggle_with_unanswered_is_breaking(self):
        """false→true on is_required when some submissions have no answer IS breaking."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="submitted",
            attempt_number=1,
            submitted_at=self.now,
        )
        # No answer for the question in this submission
        with self.assertRaises(DRFValidationError) as ctx:
            self._serialize_update(
                [{"id": str(self.question.id), "question_type": "text", "title": "Q1", "max_points": 10, "is_required": True}],
                force=False,
            )
        self.assertTrue(ctx.exception.detail.get("breaking_change"))

    def test_in_progress_not_orphaned_on_edit(self):
        """in_progress submissions are preserved when teacher makes non-breaking edit."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="in_progress",
            attempt_number=1,
        )
        # Non-breaking edit (no submitted/graded submissions)
        self._serialize_update(
            [{"id": str(self.question.id), "question_type": "text", "title": "Updated Q1", "max_points": 10}],
            force=False,
        )
        sub.refresh_from_db()
        self.assertEqual(sub.status, "in_progress")  # not orphaned

    def test_submitted_returned_on_breaking_change(self):
        """submitted (not just graded) submissions are returned on breaking change."""
        sub = self._make_submitted_submission()
        self._serialize_update(
            [{"id": str(self.question.id), "question_type": "essay", "title": "Q1", "max_points": 10}],
            force=True,
        )
        sub.refresh_from_db()
        self.assertEqual(sub.status, "returned")

    def test_score_null_on_returned_serializer(self):
        """score property returns None for 'returned' status."""
        sub = Submission.objects.create(
            test=self.test,
            student=self.student,
            status="graded",
            attempt_number=1,
            submitted_at=self.now,
        )
        Answer.objects.create(
            submission=sub, question=self.question, text_answer="A", points_earned=5.0
        )
        self.assertIsNotNone(sub.score)
        sub.status = "returned"
        sub.save()
        sub.refresh_from_db()
        self.assertIsNone(sub.score)
