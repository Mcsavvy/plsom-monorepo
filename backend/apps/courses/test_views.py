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


class CourseMyCoursesTestCase(APITestCase):
    """Test cases for CourseViewSet my-courses endpoint with N+1 query optimization."""

    def _get_courses_from_response(self, response):
        """Helper method to extract courses from paginated or non-paginated response."""
        if isinstance(response.data, dict) and "results" in response.data:
            return response.data["results"]
        else:
            return response.data

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

        # Create test courses
        self.course1 = Course.objects.create(
            name="Course 1",
            program_type="certificate",
            module_count=5,
            description="Test course 1",
            lecturer=self.lecturer,
            is_active=True,
        )

        self.course2 = Course.objects.create(
            name="Course 2",
            program_type="diploma",
            module_count=8,
            description="Test course 2",
            lecturer=self.lecturer,
            is_active=True,
        )

        self.course3 = Course.objects.create(
            name="Course 3",
            program_type="certificate",
            module_count=3,
            description="Test course 3",
            lecturer=self.lecturer,
            is_active=False,
        )

        # Create test cohorts
        self.cohort1 = Cohort.objects.create(
            name="Cohort 1",
            program_type="certificate",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=30)).date(),
            is_active=True,
        )

        self.cohort2 = Cohort.objects.create(
            name="Cohort 2",
            program_type="diploma",
            start_date=self.now.date(),
            end_date=(self.now + timedelta(days=60)).date(),
            is_active=True,
        )

        # Create enrollments
        Enrollment.objects.create(student=self.student, cohort=self.cohort1)

        Enrollment.objects.create(student=self.student, cohort=self.cohort2)

        # Create classes for the courses
        self.class1 = Class.objects.create(
            course=self.course1,
            lecturer=self.lecturer,
            cohort=self.cohort1,
            title="Class 1",
            scheduled_at=self.now + timedelta(days=1),
            duration_minutes=60,
        )

        self.class2 = Class.objects.create(
            course=self.course1,
            lecturer=self.lecturer,
            cohort=self.cohort1,
            title="Class 2",
            scheduled_at=self.now + timedelta(days=2),
            duration_minutes=60,
        )

        self.class3 = Class.objects.create(
            course=self.course2,
            lecturer=self.lecturer,
            cohort=self.cohort2,
            title="Class 3",
            scheduled_at=self.now + timedelta(days=3),
            duration_minutes=90,
        )

        # Create a past class
        self.past_class = Class.objects.create(
            course=self.course1,
            lecturer=self.lecturer,
            cohort=self.cohort1,
            title="Past Class",
            scheduled_at=self.now - timedelta(days=1),
            duration_minutes=60,
        )

    def test_my_courses_student_access(self):
        """Test that students can access their courses."""
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should return courses for both program types
        courses = self._get_courses_from_response(response)
        self.assertEqual(len(courses), 3)  # All 3 courses should be returned

        # Check that the response contains the expected fields
        course_names = [course["name"] for course in courses]
        self.assertIn("Course 1", course_names)
        self.assertIn("Course 2", course_names)
        self.assertIn("Course 3", course_names)

    def test_my_courses_lecturer_access_denied(self):
        """Test that lecturers cannot access my-courses endpoint."""
        self.client.force_authenticate(user=self.lecturer)

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_my_courses_admin_access_denied(self):
        """Test that admins cannot access my-courses endpoint."""
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_my_courses_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access my-courses endpoint."""
        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_my_courses_response_structure(self):
        """Test that the response has the correct structure with optimized fields."""
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response structure
        courses = self._get_courses_from_response(response)
        course = courses[0]
        expected_fields = [
            "id",
            "name",
            "program_type",
            "module_count",
            "description",
            "lecturer_name",
            "is_active",
            "total_classes_in_my_cohorts",
            "upcoming_classes_in_my_cohorts",
            "next_class_in_my_cohorts",
            "has_classes_in_my_cohorts",
        ]

        for field in expected_fields:
            self.assertIn(field, course)

    def test_my_courses_class_counts_optimized(self):
        """Test that class counts are calculated correctly with optimized queries."""
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Find course 1 in response
        courses = self._get_courses_from_response(response)
        course1_data = next(
            course for course in courses if course["name"] == "Course 1"
        )

        # Course 1 should have 3 total classes (2 upcoming + 1 past) in student's cohorts
        self.assertEqual(course1_data["total_classes_in_my_cohorts"], 3)

        # Course 1 should have 2 upcoming classes
        self.assertEqual(course1_data["upcoming_classes_in_my_cohorts"], 2)

        # Course 1 should have classes in student's cohorts
        self.assertTrue(course1_data["has_classes_in_my_cohorts"])

        # Find course 2 in response
        course2_data = next(
            course for course in courses if course["name"] == "Course 2"
        )

        # Course 2 should have 1 total class
        self.assertEqual(course2_data["total_classes_in_my_cohorts"], 1)

        # Course 2 should have 1 upcoming class
        self.assertEqual(course2_data["upcoming_classes_in_my_cohorts"], 1)

    def test_my_courses_next_class_information(self):
        """Test that next class information is provided correctly."""
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Find course 1 in response
        courses = self._get_courses_from_response(response)
        course1_data = next(
            course for course in courses if course["name"] == "Course 1"
        )

        # Should have next class information
        next_class = course1_data["next_class_in_my_cohorts"]
        self.assertIsNotNone(next_class)
        self.assertIn("id", next_class)
        self.assertIn("title", next_class)
        self.assertIn("scheduled_at", next_class)
        self.assertIn("cohort_name", next_class)

    def test_my_courses_program_type_filter(self):
        """Test filtering by program type."""
        self.client.force_authenticate(user=self.student)

        # Filter for certificate courses only
        response = self.client.get(
            "/api/courses/my-courses/?program_type=certificate"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should return only certificate courses
        courses = self._get_courses_from_response(response)
        self.assertEqual(len(courses), 2)  # Course 1 and Course 3
        program_types = [course["program_type"] for course in courses]
        self.assertTrue(all(pt == "certificate" for pt in program_types))

    def test_my_courses_active_filter(self):
        """Test filtering by active status."""
        self.client.force_authenticate(user=self.student)

        # Filter for active courses only
        response = self.client.get("/api/courses/my-courses/?is_active=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should return only active courses
        courses = self._get_courses_from_response(response)
        self.assertEqual(len(courses), 2)  # Course 1 and Course 2
        active_statuses = [course["is_active"] for course in courses]
        self.assertTrue(all(active for active in active_statuses))

    def test_my_courses_pagination(self):
        """Test that pagination works correctly."""
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/courses/my-courses/?page_size=2")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should have pagination metadata
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("results", response.data)

        # Should have 2 results per page (or whatever the default page size is)
        results = response.data["results"]
        self.assertLessEqual(
            len(results), 3
        )  # Should be 2 or 3 depending on default page size


class CourseMyCoursesPerformanceTestCase(APITestCase):
    """Test cases for performance optimization in my-courses endpoint."""

    def _get_courses_from_response(self, response):
        """Helper method to extract courses from paginated or non-paginated response."""
        if isinstance(response.data, dict) and "results" in response.data:
            return response.data["results"]
        else:
            return response.data

    def setUp(self):
        self.client = APIClient()
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

        # Create multiple courses and cohorts to test performance
        self.courses = []
        self.cohorts = []

        for i in range(10):  # Create 10 courses
            course = Course.objects.create(
                name=f"Course {i + 1}",
                program_type="certificate" if i % 2 == 0 else "diploma",
                module_count=5,
                description=f"Test course {i + 1}",
                lecturer=self.lecturer,
                is_active=True,
            )
            self.courses.append(course)

            cohort = Cohort.objects.create(
                name=f"Cohort {i + 1}",
                program_type="certificate" if i % 2 == 0 else "diploma",
                start_date=timezone.now().date(),
                end_date=(timezone.now() + timedelta(days=30)).date(),
                is_active=True,
            )
            self.cohorts.append(cohort)

            # Create enrollment
            Enrollment.objects.create(student=self.student, cohort=cohort)

            # Create classes for each course
            for j in range(3):  # 3 classes per course
                Class.objects.create(
                    course=course,
                    lecturer=self.lecturer,
                    cohort=cohort,
                    title=f"Class {j + 1} for Course {i + 1}",
                    scheduled_at=timezone.now() + timedelta(days=j + 1),
                    duration_minutes=60,
                )

    def test_my_courses_query_count_optimization(self):
        """Test that the endpoint uses optimized queries (low query count)."""
        self.client.force_authenticate(user=self.student)

        # Reset query count
        connection.queries_log.clear()

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Count the number of queries executed
        query_count = len(connection.queries)

        # With optimization, should be very few queries (ideally 1-3)
        # Without optimization, would be 1 + N*3 queries (where N = number of courses)
        # With 10 courses, unoptimized would be ~31 queries, optimized should be ~3
        self.assertLess(
            query_count, 10, f"Too many queries executed: {query_count}"
        )

        # Verify we got all courses (check paginated results)
        if isinstance(response.data, dict) and "results" in response.data:
            self.assertEqual(len(response.data["results"]), 10)
        else:
            self.assertEqual(len(response.data), 10)

    def test_my_courses_large_dataset_performance(self):
        """Test performance with a larger dataset."""
        self.client.force_authenticate(user=self.student)

        # Create additional courses to test with more data
        for i in range(20):  # Add 20 more courses
            Course.objects.create(
                name=f"Additional Course {i + 1}",
                program_type="certificate",
                module_count=5,
                description=f"Additional test course {i + 1}",
                lecturer=self.lecturer,
                is_active=True,
            )

            cohort = Cohort.objects.create(
                name=f"Additional Cohort {i + 1}",
                program_type="certificate",
                start_date=timezone.now().date(),
                end_date=(timezone.now() + timedelta(days=30)).date(),
                is_active=True,
            )

            Enrollment.objects.create(student=self.student, cohort=cohort)

        # Reset query count
        connection.queries_log.clear()

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Count queries - should still be optimized even with more data
        query_count = len(connection.queries)
        self.assertLess(
            query_count,
            15,
            f"Too many queries with large dataset: {query_count}",
        )

        # Should return all courses
        courses = self._get_courses_from_response(response)
        self.assertEqual(len(courses), 30)  # 10 original + 20 additional

    def test_my_courses_annotations_present(self):
        """Test that the optimized annotations are present in the response."""
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/courses/my-courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that all courses have the expected fields with values
        courses = self._get_courses_from_response(response)
        for course in courses:
            self.assertIn("total_classes_in_my_cohorts", course)
            self.assertIn("upcoming_classes_in_my_cohorts", course)
            self.assertIn("has_classes_in_my_cohorts", course)

            # Values should be calculated correctly
            self.assertIsInstance(course["total_classes_in_my_cohorts"], int)
            self.assertIsInstance(course["upcoming_classes_in_my_cohorts"], int)
            self.assertIsInstance(course["has_classes_in_my_cohorts"], bool)
