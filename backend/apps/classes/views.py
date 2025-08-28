from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.classes.models import Class, Attendance
from apps.classes.serializers import (
    ClassSerializer,
    ClassCreateUpdateSerializer,
    AttendanceSerializer,
    StudentClassSerializer,
)
from utils.permissions import IsAdmin, IsStaff, IsStudent


@extend_schema(tags=["Classes"])
class ClassViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing class instances.

    - Admin can perform all CRUD operations
    - Lecturers can view all classes and manage their own classes
    - Students can view classes for their cohorts
    """

    search_fields = ["title", "description", "course__name"]
    ordering_fields = ["scheduled_at", "title"]
    ordering = ["scheduled_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action and user role"""
        if self.action == "list":
            return ClassSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return ClassCreateUpdateSerializer
        elif self.action in ["my_classes", "my_class"]:
            return StudentClassSerializer
        return ClassSerializer

    def get_queryset(self):
        """Filter classes based on user role and permissions"""
        # Handle case when user is not authenticated (for schema generation)
        if not hasattr(self.request, "user") or not self.request.user.is_authenticated:
            return Class.objects.select_related("course", "lecturer", "cohort").all()

        user = self.request.user
        queryset = Class.objects.select_related("course", "lecturer", "cohort").all()

        if hasattr(user, "role") and user.role == "student":
            # Students can only see classes for cohorts they're enrolled in
            from apps.cohorts.models import Enrollment

            enrolled_cohorts = Enrollment.objects.filter(student=user).values_list(
                "cohort_id", flat=True
            )
            queryset = queryset.filter(cohort_id__in=enrolled_cohorts)

        # Filter by course if specified
        course_id = self.request.query_params.get("course_id")
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        # Filter by lecturer if specified
        lecturer_id = self.request.query_params.get("lecturer_id")
        if lecturer_id:
            queryset = queryset.filter(lecturer_id=lecturer_id)

        # Filter by time
        time_filter = self.request.query_params.get("time_filter")
        now = timezone.now()
        if time_filter == "upcoming":
            queryset = queryset.filter(scheduled_at__gte=now)
        elif time_filter == "past":
            queryset = queryset.filter(scheduled_at__lt=now)

        # Special filtering for my_classes action
        if self.action == "my_classes":
            if hasattr(user, "role") and user.role in ["lecturer", "admin"]:
                queryset = queryset.filter(lecturer=user)

        return queryset.distinct()

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ["create"]:
            permission_classes = [IsStaff]
        elif self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Get my classes",
        description="Get classes for the current user (lecturer gets their classes, student gets their enrolled classes).",
        parameters=[
            OpenApiParameter(
                name="time_filter",
                description="Filter by time (upcoming/past)",
                type=str,
                enum=["upcoming", "past"],
                required=False,
            ),
        ],
        responses={200: ClassSerializer(many=True)},
    )
    @action(
        detail=False,
        methods=["get"],
        url_path="my-classes",
        permission_classes=[IsAuthenticated, IsStudent],
        serializer_class=StudentClassSerializer,
    )
    def my_classes(self, request):
        """Get classes for the current user"""
        if request.user.role != "student":
            return Response(
                {"detail": "This endpoint is only available for students."},
                status=status.HTTP_403_FORBIDDEN,
            )

        classes = self.get_queryset()
        page = self.paginate_queryset(classes)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(classes, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Join a class",
        description="Get join information for a class. Students can join classes they're enrolled in.",
        parameters=[
            OpenApiParameter(
                name="id",
                description="Class ID",
                required=True,
                type=int,
                location=OpenApiParameter.PATH,
            ),
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "can_join": {"type": "boolean"},
                    "zoom_join_url": {"type": "string"},
                    "password_for_zoom": {"type": "string"},
                    "message": {"type": "string"},
                    "recording_url": {"type": "string"},
                    "password_for_recording": {"type": "string"},
                },
            }
        },
    )
    @action(detail=True, methods=["get"], url_path="join")
    def join_class(self, request, pk=None):
        """Get join information for a class"""
        user = request.user
        class_obj = self.get_object()

        # Check permissions
        if hasattr(user, "role") and user.role == "student":
            from apps.cohorts.models import Enrollment

            if not Enrollment.objects.filter(
                student=user, cohort=class_obj.cohort
            ).exists():
                return Response(
                    {"error": "You are not enrolled in the cohort for this class."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Check if class can be joined
        now = timezone.now()
        start_time = class_obj.scheduled_at
        end_time = start_time + timezone.timedelta(minutes=class_obj.duration_minutes)
        join_window_start = start_time - timezone.timedelta(minutes=15)

        can_join = join_window_start <= now <= end_time and class_obj.zoom_join_url

        if not can_join:
            if now < join_window_start:
                return Response(
                    {
                        "can_join": False,
                        "message": "Class is not yet available for joining.",
                    }
                )
            elif now > end_time:
                return Response(
                    {
                        "can_join": False,
                        "message": "Class has ended.",
                        "recording_url": class_obj.recording_url,
                        "password_for_recording": class_obj.password_for_recording,
                    }
                )

        return Response(
            {
                "can_join": True,
                "zoom_join_url": class_obj.zoom_join_url,
                "password_for_zoom": class_obj.password_for_zoom,
            }
        )

    @extend_schema(
        summary="Get class details for student",
        description="Get detailed information about a specific class for the current student.",
        responses={200: StudentClassSerializer},
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="my-class",
        serializer_class=StudentClassSerializer,
        permission_classes=[IsAuthenticated, IsStudent],
    )
    def my_class(self, request, pk=None):
        """
        Get detailed class information for the current student.
        Only available to students and only for classes in their enrolled cohorts.
        """
        if request.user.role != "student":
            return Response(
                {"detail": "This endpoint is only available for students."},
                status=status.HTTP_403_FORBIDDEN,
            )

        class_obj = self.get_object()

        # Check if student can access this class (must be in their enrolled cohorts)
        from apps.cohorts.models import Enrollment

        if not Enrollment.objects.filter(
            student=request.user, cohort=class_obj.cohort
        ).exists():
            return Response(
                {"detail": "You don't have access to this class."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StudentClassSerializer(class_obj, context={"request": request})
        return Response(serializer.data)


@extend_schema(tags=["Attendance"])
class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """A viewset for viewing attendance records"""

    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    ordering = ["-join_time"]

    def get_queryset(self):
        """Filter attendance based on user role"""
        # Handle case when user is not authenticated (for schema generation)
        if not hasattr(self.request, "user") or not self.request.user.is_authenticated:
            return Attendance.objects.select_related("student", "class_session").all()

        user = self.request.user
        queryset = Attendance.objects.select_related("student", "class_session").all()

        if hasattr(user, "role"):
            if user.role in ["lecturer", "admin"]:
                queryset = queryset.filter(class_session__lecturer=user)
            elif user.role == "student":
                queryset = queryset.filter(student=user)
            else:
                return Attendance.objects.none()

        return queryset.distinct()
