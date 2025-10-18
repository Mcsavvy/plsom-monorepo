from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta

from apps.assessments.models import Test, Question, Submission
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
            email='student@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Student',
            role='student'
        )
        
        self.lecturer = User.objects.create_user(
            email='lecturer@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Lecturer',
            role='lecturer'
        )
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Admin',
            role='admin'
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
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True
        )

        # Create enrollment
        Enrollment.objects.create(
            student=self.student,
            cohort=self.cohort
        )

    def test_create_test_with_questions_no_constraint_violation(self):
        """Test creating a test with questions doesn't violate unique constraint."""
        self.client.force_authenticate(user=self.lecturer)
        
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
        
        response = self.client.post('/api/tests/', test_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify questions were created with correct order
        test = Test.objects.get(id=response.data['id'])
        questions = test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 2)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)

    def test_update_test_with_breaking_changes_no_constraint_violation(self):
        """Test updating a test with breaking changes doesn't violate unique constraint."""
        self.client.force_authenticate(user=self.lecturer)
        
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
        
        Question.objects.create(
            test=test,
            question_type='text',
            title='Original Question 2',
            order=1,
            max_points=5
        )
        
        # Create a submission to trigger the breaking changes path
        Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status='submitted'
        )
        
        # Update test with new questions (this should trigger _create_new_questions_and_update_references)
        update_data = {
            'title': 'Updated Test',
            'course': self.course.id,
            'cohort': self.cohort.id,
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
        
        response = self.client.put(f'/api/tests/{test.id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify questions were updated correctly
        test.refresh_from_db()
        questions = test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 3)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)
        self.assertEqual(questions[2].order, 2)

    def test_duplicate_question_order_violation_handled(self):
        """Test that the unique constraint violation is properly handled."""
        self.client.force_authenticate(user=self.lecturer)
        
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
        Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status='submitted'
        )
        
        # Try to update with questions that would cause order conflicts
        # This should not fail due to our fix
        update_data = {
            'title': 'Updated Test',
            'course': self.course.id,
            'cohort': self.cohort.id,
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
        
        response = self.client.put(f'/api/tests/{test.id}/', update_data, format='json')
        # Should succeed due to our fix that uses non-conflicting order values
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_question_reordering_after_cleanup(self):
        """Test that questions are properly reordered after cleanup."""
        self.client.force_authenticate(user=self.lecturer)
        
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
        Submission.objects.create(
            test=test,
            student=self.student,
            attempt_number=1,
            status='submitted'
        )
        
        # Update test with new questions
        update_data = {
            'title': 'Updated Test',
            'course': self.course.id,
            'cohort': self.cohort.id,
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
        
        response = self.client.put(f'/api/tests/{test.id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify questions are properly reordered
        test.refresh_from_db()
        questions = test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 2)
        self.assertEqual(questions[0].order, 0)
        self.assertEqual(questions[1].order, 1)

    def test_student_cannot_create_test(self):
        """Test that students cannot create tests."""
        self.client.force_authenticate(user=self.student)
        
        test_data = {
            'title': 'Unauthorized Test',
            'description': 'Test description',
            'course': self.course.id,
            'cohort': self.cohort.id,
            'questions': []
        }
        
        response = self.client.post('/api/tests/', test_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lecturer_can_create_test(self):
        """Test that lecturers can create tests."""
        self.client.force_authenticate(user=self.lecturer)
        
        test_data = {
            'title': 'Lecturer Test',
            'description': 'Test description',
            'course': self.course.id,
            'cohort': self.cohort.id,
            'questions': [
                {
                    'question_type': 'text',
                    'title': 'Question 1',
                    'order': 0,
                    'max_points': 10
                }
            ]
        }
        
        response = self.client.post('/api/tests/', test_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_can_create_test(self):
        """Test that admins can create tests."""
        self.client.force_authenticate(user=self.admin)
        
        test_data = {
            'title': 'Admin Test',
            'description': 'Test description',
            'course': self.course.id,
            'cohort': self.cohort.id,
            'questions': [
                {
                    'question_type': 'text',
                    'title': 'Question 1',
                    'order': 0,
                    'max_points': 10
                }
            ]
        }
        
        response = self.client.post('/api/tests/', test_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class TestPerformanceTestCase(APITestCase):
    """Test cases for performance optimization in test creation."""

    def setUp(self):
        self.client = APIClient()
        self.lecturer = User.objects.create_user(
            email='lecturer@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='Lecturer',
            role='lecturer'
        )
        
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

    def test_large_test_creation_performance(self):
        """Test creating a test with many questions doesn't cause performance issues."""
        self.client.force_authenticate(user=self.lecturer)
        
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
        
        response = self.client.post('/api/tests/', test_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify all questions were created with correct order
        test = Test.objects.get(id=response.data['id'])
        questions = test.questions.all().order_by('order')
        self.assertEqual(questions.count(), 50)
        
        # Verify order is sequential
        for i, question in enumerate(questions):
            self.assertEqual(question.order, i)
