from django.test import TestCase
from django.utils import timezone
from apps.users.models import User
from apps.courses.models import Course
from apps.cohorts.models import Cohort
from .models import Test, Question, QuestionOption, Submission, Answer


class TestModelsTest(TestCase):
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.lecturer = User.objects.create_user(
            email='lecturer@test.com',
            password='testpass',
            role='lecturer',
            first_name='Test',
            last_name='Lecturer'
        )
        
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass',
            role='student',
            first_name='Test',
            last_name='Student'
        )
        
        # Create test cohort
        self.cohort = Cohort.objects.create(
            name='Test Cohort 2024',
            program_type='diploma',
            start_date=timezone.now().date(),
            is_active=True
        )
        
        # Create test course
        self.course = Course.objects.create(
            name='Biblical Hermeneutics',
            program_type='diploma',
            module_count=12,
            description='Study of biblical interpretation',
            lecturer=self.lecturer
        )
        
        # Create test test
        self.test = Test.objects.create(
            title='Midterm Examination',
            description='Testing biblical interpretation skills',
            course=self.course,
            cohort=self.cohort,
            created_by=self.lecturer,
            status='published'
        )
    
    def test_test_creation(self):
        """Test that a test can be created with required fields"""
        self.assertEqual(self.test.title, 'Midterm Examination')
        self.assertEqual(self.test.course, self.course)
        self.assertEqual(self.test.cohort, self.cohort)
        self.assertEqual(self.test.created_by, self.lecturer)
        self.assertTrue(self.test.is_available)
    
    def test_question_creation(self):
        """Test creating questions with different types"""
        # Essay question
        essay_q = Question.objects.create(
            test=self.test,
            question_type='essay',
            title='Explain the historical-grammatical method of biblical interpretation',
            description='Provide a comprehensive explanation with examples',
            order=1,
            min_word_count=300,
            max_word_count=800
        )
        self.assertEqual(essay_q.question_type, 'essay')
        self.assertFalse(essay_q.has_predefined_options)
        
        # Scripture reference question
        scripture_q = Question.objects.create(
            test=self.test,
            question_type='scripture_reference',
            title='Cite three verses that support the doctrine of salvation by faith',
            required_translation='ESV',
            order=2
        )
        self.assertEqual(scripture_q.required_translation, 'ESV')
        
        # Multiple choice question
        choice_q = Question.objects.create(
            test=self.test,
            question_type='multiple_choice',
            title='Which of the following are principles of biblical hermeneutics?',
            order=3
        )
        self.assertTrue(choice_q.has_predefined_options)
        
        # Create options for multiple choice
        option1 = QuestionOption.objects.create(
            question=choice_q,
            text='Consider the historical context',
            order=1,
            is_correct=True
        )
        option2 = QuestionOption.objects.create(
            question=choice_q,
            text='Ignore the cultural background',
            order=2,
            is_correct=False
        )
        
        self.assertEqual(choice_q.options.count(), 2)
        self.assertTrue(option1.is_correct)
        self.assertFalse(option2.is_correct)
    
    def test_submission_and_answers(self):
        """Test submission and answer creation"""
        # Create questions
        essay_q = Question.objects.create(
            test=self.test,
            question_type='essay',
            title='Discuss the role of context in biblical interpretation',
            order=1
        )
        
        yes_no_q = Question.objects.create(
            test=self.test,
            question_type='yes_no',
            title='Is literal interpretation always the best approach?',
            order=2
        )
        
        # Create submission
        submission = Submission.objects.create(
            test=self.test,
            student=self.student,
            status='in_progress'
        )
        
        # Create answers
        essay_answer = Answer.objects.create(
            submission=submission,
            question=essay_q,
            text_answer='Context is crucial for proper biblical interpretation because...'
        )
        
        yes_no_answer = Answer.objects.create(
            submission=submission,
            question=yes_no_q,
            boolean_answer=False
        )
        
        # Test answer display
        self.assertTrue(essay_answer.has_answer)
        self.assertTrue(yes_no_answer.has_answer)
        self.assertEqual(yes_no_answer.display_answer, 'No')
        
        # Test submission properties
        self.assertFalse(submission.is_submitted)
        self.assertEqual(submission.completion_percentage, 100.0)  # 2/2 questions answered
    
    def test_test_properties(self):
        """Test test model properties"""
        # Add questions to test
        Question.objects.create(
            test=self.test,
            question_type='text',
            title='Question 1',
            order=1
        )
        Question.objects.create(
            test=self.test,
            question_type='essay',
            title='Question 2',
            order=2
        )
        
        self.assertEqual(self.test.total_questions, 2)
        
        # Create a submission
        Submission.objects.create(
            test=self.test,
            student=self.student
        )
        
        self.assertEqual(self.test.total_submissions, 1)
    
    def test_string_representations(self):
        """Test model string representations"""
        question = Question.objects.create(
            test=self.test,
            question_type='text',
            title='What is your favorite Bible verse?',
            order=1
        )
        
        submission = Submission.objects.create(
            test=self.test,
            student=self.student
        )
        
        answer = Answer.objects.create(
            submission=submission,
            question=question,
            text_answer='John 3:16'
        )
        
        # Test string representations
        self.assertIn('Midterm Examination', str(self.test))
        self.assertIn('Biblical Hermeneutics', str(self.test))
        self.assertIn('Test Cohort 2024', str(self.test))
        
        self.assertIn('Q1:', str(question))
        self.assertIn('What is your favorite', str(question))
        
        self.assertIn('Test Student', str(submission))
        self.assertIn('Midterm Examination', str(submission))
        
        self.assertIn('Test Student', str(answer))
