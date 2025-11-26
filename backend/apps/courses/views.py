from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from apps.courses.models import Course
from apps.courses.serializers import (
    CourseSerializer,
    LecturerAssignmentSerializer,
    LecturerCourseSerializer,
    CourseCreateUpdateSerializer,
    StudentCourseSerializer,
)
from utils.permissions import IsAdmin, IsStudent


@extend_schema(tags=["Courses"])
class CourseViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing course instances.

    - Only admin can create, update, or delete courses
    - Lecturers can view all courses and see courses they teach
    - Students can view all courses but with limited information
    - Special endpoints for lecturer assignment (admin only)
    - Special endpoint for lecturer's courses
    """

    search_fields = ["name", "description", "program_type"]
    ordering_fields = ["name", "created_at", "module_count"]
    ordering = ["name"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return CourseSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return CourseCreateUpdateSerializer
        elif self.action == "my_courses":
            return LecturerCourseSerializer
        return CourseSerializer

    def get_queryset(self):
        """Filter courses based on user role and action"""
        user = self.request.user
        queryset = Course.objects.select_related("lecturer").all()

        if self.action == "my_courses":
            # For lecturers viewing their courses
            if user.role == "lecturer":
                queryset = queryset.filter(lecturer=user)
            else:
                queryset = Course.objects.none()

        # Filter by program type if specified
        program_type = self.request.query_params.get("program_type")
        if program_type:
            queryset = queryset.filter(program_type=program_type)

        # Filter by active status if specified
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        # Filter by lecturer if specified (admin only)
        lecturer_id = self.request.query_params.get("lecturer_id")
        if lecturer_id and user.role == "admin":
            queryset = queryset.filter(lecturer_id=lecturer_id)

        return queryset.distinct()

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAdmin]
        elif self.action in ["assign_lecturer", "unassign_lecturer"]:
            permission_classes = [IsAdmin]
        elif self.action in ["my_courses", "my_course"]:
            permission_classes = [IsStudent]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """Only admin can create courses"""
        if not self.request.user.role == "admin":
            raise PermissionDenied("Only admin can create courses")
        serializer.save()

    def perform_update(self, serializer):
        """Only admin can update courses"""
        if not self.request.user.role == "admin":
            raise PermissionDenied("Only admin can update courses")

        instance = self.get_object()
        validated_data = serializer.validated_data

        # Additional validation for course updates
        # Check if deactivating a course with scheduled classes
        if (
            "is_active" in validated_data
            and not validated_data["is_active"]
            and instance.is_active
        ):
            try:
                from apps.classes.models import Class

                future_classes = Class.objects.filter(
                    course=instance, scheduled_at__gte=timezone.now()
                )
                if future_classes.exists():
                    raise ValidationError(
                        "Cannot deactivate course with scheduled future classes"
                    )
            except ImportError:
                pass

        serializer.save()

    def perform_destroy(self, instance):
        """Only admin can delete courses"""
        if not self.request.user.role == "admin":
            raise PermissionDenied("Only admin can delete courses")

        # Check if course has associated classes
        try:
            from apps.classes.models import Class

            if Class.objects.filter(course=instance).exists():
                raise ValidationError(
                    "Cannot delete course with associated classes"
                )
        except ImportError:
            pass

        instance.delete()

    @extend_schema(
        summary="Assign lecturer to course",
        description="Assign a lecturer to a course. Only admin can perform this action.",
        request=LecturerAssignmentSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {"message": {"type": "string"}},
            }
        },
    )
    @extend_schema(
        summary="Get student's curriculum courses",
        description="Get all courses available to the student based on their program type from enrolled cohorts. Shows full curriculum, not just courses with scheduled classes.",
        responses={200: StudentCourseSerializer(many=True)},
    )
    @action(
        detail=False,
        methods=["get"],
        url_path="my-courses",
        permission_classes=[IsAuthenticated],
    )
    def my_courses(self, request):
        """
        Get all courses available to the student based on their enrolled cohorts' program types.
        Shows the complete curriculum, including courses that may not have scheduled classes yet.
        Only available to students.
        """
        if request.user.role != "student":
            return Response(
                {"detail": "This endpoint is only available for students."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get all courses that match the student's program types from their enrolled cohorts
        from apps.cohorts.models import Enrollment

        # Get enrolled cohorts and their program types
        enrolled_cohorts = Enrollment.objects.filter(
            student=request.user
        ).select_related("cohort")
        program_types = list(
            set(
                enrollment.cohort.program_type
                for enrollment in enrolled_cohorts
            )
        )

        # Get student's enrolled cohorts once to avoid N+1 queries
        enrolled_cohort_ids = list(
            enrolled_cohorts.values_list("cohort_id", flat=True)
        )

        # Get all courses that match the student's program types with optimized queries
        from django.db.models import Count, Q
        from django.utils import timezone

        courses = (
            Course.objects.filter(program_type__in=program_types)
            .select_related("lecturer")
            .annotate(
                # Pre-calculate class counts for student's cohorts
                total_classes_in_cohorts=Count(
                    "classes",
                    filter=Q(classes__cohort_id__in=enrolled_cohort_ids),
                    distinct=True,
                ),
                upcoming_classes_in_cohorts=Count(
                    "classes",
                    filter=Q(
                        classes__cohort_id__in=enrolled_cohort_ids,
                        classes__scheduled_at__gte=timezone.now(),
                    ),
                    distinct=True,
                ),
            )
        )

        # Apply filters if provided
        program_type = request.query_params.get("program_type")
        if program_type:
            courses = courses.filter(program_type=program_type)

        is_active = request.query_params.get("is_active")
        if is_active is not None:
            courses = courses.filter(is_active=is_active.lower() == "true")

        # Order by name
        courses = courses.order_by("name")

        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = StudentCourseSerializer(
                page,
                many=True,
                context={
                    "request": request,
                    "enrolled_cohort_ids": enrolled_cohort_ids,
                },
            )
            return self.get_paginated_response(serializer.data)

        serializer = StudentCourseSerializer(
            courses,
            many=True,
            context={
                "request": request,
                "enrolled_cohort_ids": enrolled_cohort_ids,
            },
        )
        return Response(serializer.data)

    @extend_schema(
        summary="Get course details for student",
        description="Get detailed information about a specific course for the current student, including class information from their cohorts.",
        responses={200: StudentCourseSerializer},
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="my-course",
        permission_classes=[IsAuthenticated],
    )
    def my_course(self, request, pk=None):
        """
        Get detailed course information for the current student.
        Only available to students and only for courses in their program type.
        """
        if request.user.role != "student":
            return Response(
                {"detail": "This endpoint is only available for students."},
                status=status.HTTP_403_FORBIDDEN,
            )

        course = self.get_object()

        # Check if student can access this course (must match their program type)
        from apps.cohorts.models import Enrollment

        enrolled_cohorts = Enrollment.objects.filter(
            student=request.user
        ).select_related("cohort")
        program_types = list(
            set(
                enrollment.cohort.program_type
                for enrollment in enrolled_cohorts
            )
        )

        if course.program_type not in program_types:
            return Response(
                {"detail": "You don't have access to this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StudentCourseSerializer(
            course, context={"request": request}
        )
        return Response(serializer.data)

    @extend_schema(
        summary="Get course statistics",
        description="Get statistics for a specific course. Only admin can access this.",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "total_classes": {"type": "integer"},
                    "completed_classes": {"type": "integer"},
                    "upcoming_classes": {"type": "integer"},
                    "lecturer_name": {"type": "string"},
                    "total_students": {"type": "integer"},
                },
            }
        },
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="statistics",
        permission_classes=[IsAdmin],
    )
    def statistics(self, request, pk=None):
        """
        Get detailed statistics for a course.
        Only available to admins.
        """
        course = self.get_object()

        try:
            from apps.classes.models import Class
            from apps.cohorts.models import Enrollment

            now = timezone.now()
            classes = Class.objects.filter(course=course)

            stats = {
                "total_classes": classes.count(),
                "completed_classes": classes.filter(
                    scheduled_at__lt=now
                ).count(),
                "upcoming_classes": classes.filter(
                    scheduled_at__gte=now
                ).count(),
                "lecturer_name": course.lecturer.get_full_name()
                if course.lecturer
                else None,
                "total_students": Enrollment.objects.filter(
                    cohort__classes__course=course
                )
                .distinct()
                .count(),
            }

            return Response(stats)

        except ImportError:
            return Response(
                {
                    "total_classes": 0,
                    "completed_classes": 0,
                    "upcoming_classes": 0,
                    "lecturer_name": course.lecturer.get_full_name()
                    if course.lecturer
                    else None,
                    "total_students": 0,
                }
            )
