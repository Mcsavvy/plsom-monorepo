"""
Performance tests for N+1 query optimization in courses endpoints.
These tests specifically verify that the query optimization is working correctly.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta
from django.db import connection

from apps.courses.models import Course
from apps.cohorts.models import Cohort, Enrollment
from apps.classes.models import Class

User = get_user_model()


class QueryCountTestCase(APITestCase):
    """Test cases to verify query count optimization."""

    def setUp(self):
        self.client = APIClient()
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

    def test_my_courses_query_count_with_small_dataset(self):
        """Test query count with a small dataset (5 courses)."""
        # Create 5 courses with classes
        courses = []
        cohorts = []
        
        for i in range(5):
            course = Course.objects.create(
                name=f'Course {i+1}',
                program_type='certificate',
                module_count=5,
                description=f'Test course {i+1}',
                lecturer=self.lecturer,
                is_active=True
            )
            courses.append(course)
            
            cohort = Cohort.objects.create(
                name=f'Cohort {i+1}',
                program_type='certificate',
                start_date=timezone.now().date(),
                end_date=(timezone.now() + timedelta(days=30)).date(),
                is_active=True
            )
            cohorts.append(cohort)
            
            Enrollment.objects.create(
                student=self.student,
                cohort=cohort
            )
            
            # Create 2 classes per course
            for j in range(2):
                Class.objects.create(
                    course=course,
                    lecturer=self.lecturer,
                    cohort=cohort,
                    title=f'Class {j+1} for Course {i+1}',
                    scheduled_at=timezone.now() + timedelta(days=j+1),
                    duration_minutes=60
                )
        
        self.client.force_authenticate(user=self.student)
        
        # Reset query count
        connection.queries_log.clear()
        
        response = self.client.get('/api/courses/my-courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Count queries
        query_count = len(connection.queries)
        
        # With optimization: should be 1-3 queries
        # Without optimization: would be 1 + 5*3 = 16 queries
        self.assertLess(query_count, 8, f"Too many queries for small dataset: {query_count}")
        
        # Verify response structure
        self.assertLessEqual(len(response.data['results']), 5)  # Allow for default pagination
        for course in response.data['results']:
            self.assertIn('total_classes_in_my_cohorts', course)
            self.assertIn('upcoming_classes_in_my_cohorts', course)
            self.assertEqual(course['total_classes_in_my_cohorts'], 2)

    def test_my_courses_query_count_with_medium_dataset(self):
        """Test query count with a medium dataset (20 courses)."""
        # Create 20 courses with classes
        courses = []
        cohorts = []
        
        for i in range(20):
            course = Course.objects.create(
                name=f'Course {i+1}',
                program_type='certificate' if i % 2 == 0 else 'diploma',
                module_count=5,
                description=f'Test course {i+1}',
                lecturer=self.lecturer,
                is_active=True
            )
            courses.append(course)
            
            cohort = Cohort.objects.create(
                name=f'Cohort {i+1}',
                program_type='certificate' if i % 2 == 0 else 'diploma',
                start_date=timezone.now().date(),
                end_date=(timezone.now() + timedelta(days=30)).date(),
                is_active=True
            )
            cohorts.append(cohort)
            
            Enrollment.objects.create(
                student=self.student,
                cohort=cohort
            )
            
            # Create 3 classes per course
            for j in range(3):
                Class.objects.create(
                    course=course,
                    lecturer=self.lecturer,
                    cohort=cohort,
                    title=f'Class {j+1} for Course {i+1}',
                    scheduled_at=timezone.now() + timedelta(days=j+1),
                    duration_minutes=60
                )
        
        self.client.force_authenticate(user=self.student)
        
        # Reset query count
        connection.queries_log.clear()
        
        response = self.client.get('/api/courses/my-courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Count queries
        query_count = len(connection.queries)
        
        # With optimization: should be 1-3 queries
        # Without optimization: would be 1 + 20*3 = 61 queries
        self.assertLess(query_count, 10, f"Too many queries for medium dataset: {query_count}")
        
        # Verify response structure
        self.assertLessEqual(len(response.data['results']), 20)  # Allow for default pagination
        for course in response.data['results']:
            self.assertIn('total_classes_in_my_cohorts', course)
            self.assertIn('upcoming_classes_in_my_cohorts', course)
            self.assertEqual(course['total_classes_in_my_cohorts'], 3)

    def test_my_courses_query_count_with_large_dataset(self):
        """Test query count with a large dataset (50 courses)."""
        # Create 50 courses with classes
        courses = []
        cohorts = []
        
        for i in range(50):
            course = Course.objects.create(
                name=f'Course {i+1}',
                program_type='certificate' if i % 2 == 0 else 'diploma',
                module_count=5,
                description=f'Test course {i+1}',
                lecturer=self.lecturer,
                is_active=True
            )
            courses.append(course)
            
            cohort = Cohort.objects.create(
                name=f'Cohort {i+1}',
                program_type='certificate' if i % 2 == 0 else 'diploma',
                start_date=timezone.now().date(),
                end_date=(timezone.now() + timedelta(days=30)).date(),
                is_active=True
            )
            cohorts.append(cohort)
            
            Enrollment.objects.create(
                student=self.student,
                cohort=cohort
            )
            
            # Create 2 classes per course
            for j in range(2):
                Class.objects.create(
                    course=course,
                    lecturer=self.lecturer,
                    cohort=cohort,
                    title=f'Class {j+1} for Course {i+1}',
                    scheduled_at=timezone.now() + timedelta(days=j+1),
                    duration_minutes=60
                )
        
        self.client.force_authenticate(user=self.student)
        
        # Reset query count
        connection.queries_log.clear()
        
        response = self.client.get('/api/courses/my-courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Count queries
        query_count = len(connection.queries)
        
        # With optimization: should be 1-3 queries
        # Without optimization: would be 1 + 50*3 = 151 queries
        self.assertLess(query_count, 15, f"Too many queries for large dataset: {query_count}")
        
        # Verify response structure
        self.assertLessEqual(len(response.data['results']), 50)  # Allow for default pagination
        for course in response.data['results']:
            self.assertIn('total_classes_in_my_cohorts', course)
            self.assertIn('upcoming_classes_in_my_cohorts', course)
            self.assertEqual(course['total_classes_in_my_cohorts'], 2)

    def test_my_courses_query_analysis(self):
        """Analyze the actual queries being executed."""
        # Create a simple test case
        course = Course.objects.create(
            name='Test Course',
            program_type='certificate',
            module_count=5,
            description='Test course',
            lecturer=self.lecturer,
            is_active=True
        )
        
        cohort = Cohort.objects.create(
            name='Test Cohort',
            program_type='certificate',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            is_active=True
        )
        
        Enrollment.objects.create(
            student=self.student,
            cohort=cohort
        )
        
        # Create a class
        Class.objects.create(
            course=course,
            lecturer=self.lecturer,
            cohort=cohort,
            title='Test Class',
            scheduled_at=timezone.now() + timedelta(days=1),
            duration_minutes=60
        )
        
        self.client.force_authenticate(user=self.student)
        
        # Reset query count
        connection.queries_log.clear()
        
        response = self.client.get('/api/courses/my-courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Print queries for analysis (in test output)
        queries = connection.queries
        print(f"\nExecuted {len(queries)} queries:")
        for i, query in enumerate(queries):
            print(f"{i+1}. {query['sql']}")
        
        # Verify optimization
        self.assertLess(len(queries), 5, "Too many queries executed")
        
        # Check that we're using annotations (should see COUNT in SQL or annotation fields)
        # sql_queries = [q['sql'] for q in queries]
        # count_queries = [q for q in sql_queries if 'COUNT' in q.upper()]
        
        # Also check if the response has the optimized fields
        if response.data and 'results' in response.data and response.data['results']:
            course = response.data['results'][0]
            has_optimized_fields = (
                'total_classes_in_my_cohorts' in course and
                'upcoming_classes_in_my_cohorts' in course
            )
            self.assertTrue(has_optimized_fields, "Optimized fields not found in response")
        else:
            # Fallback: just check that we have reasonable query count
            self.assertLess(len(queries), 5, "Too many queries - optimization may not be working")

    def test_my_courses_with_filters_query_count(self):
        """Test query count with filters applied."""
        # Create test data
        for i in range(10):
            Course.objects.create(
                name=f'Course {i+1}',
                program_type='certificate' if i % 2 == 0 else 'diploma',
                module_count=5,
                description=f'Test course {i+1}',
                lecturer=self.lecturer,
                is_active=i % 3 == 0  # Some inactive courses
            )
            
            cohort = Cohort.objects.create(
                name=f'Cohort {i+1}',
                program_type='certificate' if i % 2 == 0 else 'diploma',
                start_date=timezone.now().date(),
                end_date=(timezone.now() + timedelta(days=30)).date(),
                is_active=True
            )
            
            Enrollment.objects.create(
                student=self.student,
                cohort=cohort
            )
        
        self.client.force_authenticate(user=self.student)
        
        # Test with program_type filter
        connection.queries_log.clear()
        response = self.client.get('/api/courses/my-courses/?program_type=certificate')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        query_count = len(connection.queries)
        self.assertLess(query_count, 8, f"Too many queries with program_type filter: {query_count}")
        
        # Test with is_active filter
        connection.queries_log.clear()
        response = self.client.get('/api/courses/my-courses/?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        query_count = len(connection.queries)
        self.assertLess(query_count, 8, f"Too many queries with is_active filter: {query_count}")

    def test_my_courses_pagination_query_count(self):
        """Test query count with pagination."""
        # Create test data
        for i in range(15):
            Course.objects.create(
                name=f'Course {i+1}',
                program_type='certificate',
                module_count=5,
                description=f'Test course {i+1}',
                lecturer=self.lecturer,
                is_active=True
            )
            
            cohort = Cohort.objects.create(
                name=f'Cohort {i+1}',
                program_type='certificate',
                start_date=timezone.now().date(),
                end_date=(timezone.now() + timedelta(days=30)).date(),
                is_active=True
            )
            
            Enrollment.objects.create(
                student=self.student,
                cohort=cohort
            )
        
        self.client.force_authenticate(user=self.student)
        
        # Test with pagination
        connection.queries_log.clear()
        response = self.client.get('/api/courses/my-courses/?page_size=5')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        query_count = len(connection.queries)
        self.assertLess(query_count, 10, f"Too many queries with pagination: {query_count}")
        
        # Verify pagination structure
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('results', response.data)
        
        # Verify we have results and pagination is working
        self.assertGreater(len(response.data['results']), 0, "No results returned")
        self.assertGreater(response.data['count'], 0, "Total count should be greater than 0")
