"""
Tests for assessment serializers with focus on unique constraint handling.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta
from django.db import IntegrityError

from apps.assessments.models import Test, Question, QuestionOption, Submission, Answer
from apps.assessments.serializers import TestSerializer
from apps.courses.models import Course
from apps.cohorts.models import Cohort, Enrollment

User = get_user_model()


class TestSerializerTestCase(APITestCase):
    """Test cases for TestSerializer with unique constraint handling."""

    def setUp(self):
        self.lecturer = User.objects.create_user(
            email='lecturer@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Lecturer',
            role='lecturer'
        )
        
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Student',
            role='student'
        )

        # Create test course and cohort
        self.course = Course.objects.create(
            name='Test Course',
            program_type='certificate',
            module_count=5,
            description='Test course description',
            is_active=True
        )
        
        self.cohort = Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            is_active=True
        )

        # Create enrollment
        Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )

    def test_create_test_with_questions_no_constraint_violation(self):
        """Test creating a test with questions doesn't violate unique constraint."""
        test_data = {
            'title': 'Test Assessment',
            'description': 'Test description',
            'course': self.course.id,
            'cohort': self.cohort.id,
            'questions': [
                {
                    'question_type': 'text',
                    'title': 'Question 1',
                    'order': 0,
                    'max_points': 10
                },
                {
                    'question_type': 'single_choice',
                    'title': 'Question 2',
                    'order': 1,
                    'max_points': 5,
                    'options': [
                        {'text': 'Option A', 'is_correct': True, 'order': 0},
                        {'text': 'Option B', 'is_correct': False, 'order': 1}
                    ]
                }
            ]
        }
        
        serializer = TestSerializer(data=test_data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        
        test = serializer.save(created_by=self.lecturer)
        
        # Verify questions were created with correct order
        questions = test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 2)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)

    def test_update_test_with_breaking_changes_no_constraint_violation(self):
        """Test updating a test with breaking changes doesn't violate unique constraint."""
        # Create initial test
        test = Test.objects.create(
            title='Original Test',
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer
        )
        
        # Create initial questions
        question1 = Question.objects.create(
            test=test,
            question_type='text',
            title='Original Question 1',
            order=0,
            max_points=10
        )
        
        question2 = Question.objects.create(
            test=test,
            question_type='text',
            title='Original Question 2',
            order=1,
            max_points=5
        )
        
        # Create a submission to trigger the breaking changes path
        submission = Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status='submitted'
        )
        
        # Update test with new questions (this should trigger _create_new_questions_and_update_references)
        update_data = {
            'title': 'Updated Test',
            'questions': [
                {
                    'id': str(question1.id),  # Keep existing question
                    'question_type': 'text',
                    'title': 'Updated Question 1',
                    'order': 0,
                    'max_points': 15
                },
                {
                    'question_type': 'single_choice',
                    'title': 'New Question 2',
                    'order': 1,
                    'max_points': 10,
                    'options': [
                        {'text': 'Option A', 'is_correct': True, 'order': 0},
                        {'text': 'Option B', 'is_correct': False, 'order': 1}
                    ]
                },
                {
                    'question_type': 'text',
                    'title': 'New Question 3',
                    'order': 2,
                    'max_points': 5
                }
            ]
        }
        
        serializer = TestSerializer(test, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        
        updated_test = serializer.save()
        
        # Verify questions were updated correctly
        questions = updated_test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 3)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)
        self.assertEqual(questions[2].order, 2)

    def test_duplicate_question_order_violation_handled(self):
        """Test that the unique constraint violation is properly handled."""
        # Create a test with existing questions
        test = Test.objects.create(
            title='Test with Existing Questions',
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer
        )
        
        # Create questions with specific orders
        Question.objects.create(
            test=test,
            question_type='text',
            title='Existing Question 1',
            order=0,
            max_points=10
        )
        
        Question.objects.create(
            test=test,
            question_type='text',
            title='Existing Question 2',
            order=1,
            max_points=5
        )
        
        # Create a submission to trigger the breaking changes path
        submission = Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status='submitted'
        )
        
        # Try to update with questions that would cause order conflicts
        # This should not fail due to our fix
        update_data = {
            'title': 'Updated Test',
            'questions': [
                {
                    'question_type': 'text',
                    'title': 'New Question 1',
                    'order': 0,  # This would conflict with existing order=0
                    'max_points': 10
                },
                {
                    'question_type': 'text',
                    'title': 'New Question 2',
                    'order': 1,  # This would conflict with existing order=1
                    'max_points': 5
                }
            ]
        }
        
        serializer = TestSerializer(test, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        
        updated_test = serializer.save()
        
        # Verify questions were created successfully
        questions = updated_test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 2)

    def test_question_reordering_after_cleanup(self):
        """Test that questions are properly reordered after cleanup."""
        # Create a test with existing questions
        test = Test.objects.create(
            title='Test for Reordering',
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer
        )
        
        # Create questions with non-sequential orders
        Question.objects.create(
            test=test,
            question_type='text',
            title='Question 1',
            order=5,  # Non-sequential order
            max_points=10
        )
        
        Question.objects.create(
            test=test,
            question_type='text',
            title='Question 2',
            order=10,  # Non-sequential order
            max_points=5
        )
        
        # Create a submission to trigger the breaking changes path
        submission = Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status='submitted'
        )
        
        # Update test with new questions
        update_data = {
            'title': 'Updated Test',
            'questions': [
                {
                    'question_type': 'text',
                    'title': 'New Question 1',
                    'order': 0,
                    'max_points': 10
                },
                {
                    'question_type': 'text',
                    'title': 'New Question 2',
                    'order': 1,
                    'max_points': 5
                }
            ]
        }
        
        serializer = TestSerializer(test, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        
        updated_test = serializer.save()
        
        # Verify questions are properly reordered
        questions = updated_test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 2)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)

    def test_large_test_creation_performance(self):
        """Test creating a test with many questions doesn't cause performance issues."""
        # Create a test with many questions
        questions = []
        for i in range(50):  # 50 questions
            questions.append({
                'question_type': 'text',
                'title': f'Question {i+1}',
                'order': i,
                'max_points': 10
            })
        
        test_data = {
            'title': 'Large Test',
            'description': 'Test with many questions',
            'course': self.course.id,
            'cohort': self.cohort.id,
            'questions': questions
        }
        
        serializer = TestSerializer(data=test_data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        
        test = serializer.save(created_by=self.lecturer)
        
        # Verify all questions were created with correct order
        questions = test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 50)
        
        # Verify order is sequential
        for i, question in enumerate(questions):
            self.assertEqual(question.order, i)

    def test_question_option_creation_with_mapping(self):
        """Test that question options are created correctly with mapping."""
        test_data = {
            'title': 'Test with Options',
            'description': 'Test description',
            'course': self.course.id,
            'cohort': self.cohort.id,
            'questions': [
                {
                    'question_type': 'single_choice',
                    'title': 'Multiple Choice Question',
                    'order': 0,
                    'max_points': 10,
                    'options': [
                        {'text': 'Option A', 'is_correct': True, 'order': 0},
                        {'text': 'Option B', 'is_correct': False, 'order': 1},
                        {'text': 'Option C', 'is_correct': False, 'order': 2}
                    ]
                }
            ]
        }
        
        serializer = TestSerializer(data=test_data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        
        test = serializer.save(created_by=self.lecturer)
        
        # Verify question and options were created
        question = test.questions.first()
        self.assertEqual(question.question_type, 'single_choice')
        
        options = question.options.all().order_by('order')
        self.assertEqual(options.count(), 3)
        self.assertEqual(options[0].order, 0)
        self.assertEqual(options[1].order, 1)
        self.assertEqual(options[2].order, 2)

    def test_serializer_validation_errors(self):
        """Test that serializer validation works correctly."""
        # Test with invalid data
        invalid_data = {
            'title': '',  # Empty title should fail
            'description': 'Test description',
            'course': self.course.id,
            'cohort': self.cohort.id,
            'questions': []
        }
        
        serializer = TestSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)

    def test_serializer_without_questions(self):
        """Test creating a test without questions."""
        test_data = {
            'title': 'Test Without Questions',
            'description': 'Test description',
            'course': self.course.id,
            'cohort': self.cohort.id,
            'questions': []
        }
        
        serializer = TestSerializer(data=test_data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        
        test = serializer.save(created_by=self.lecturer)
        
        # Verify test was created without questions
        self.assertEqual(test.questions.count(), 0)
        self.assertEqual(test.title, 'Test Without Questions')
