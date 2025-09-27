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
    AttendanceCreateSerializer,
    AttendanceVerificationSerializer,
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
        description="Get join information for a class and register attendance. Students can join classes they're enrolled in.",
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
                    "attendance_registered": {"type": "boolean"},
                },
            }
        },
    )
    @action(detail=True, methods=["get"], url_path="join")
    def join_class(self, request, pk=None):
        """Get join information for a class and register attendance"""
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

        is_in_progress = join_window_start <= now <= end_time
        is_in_past = now > end_time
        can_join = (is_in_progress and class_obj.zoom_join_url) or (
            is_in_past and class_obj.recording_url
        )

        # Register attendance for students
        attendance_registered = False
        if hasattr(user, "role") and user.role == "student" and can_join:
            # Calculate class end time
            class_end_time = start_time + timezone.timedelta(
                minutes=class_obj.duration_minutes
            )

            attendance, created = Attendance.objects.get_or_create(
                class_session=class_obj,
                student=user,
                defaults={
                    "join_time": now,
                    "leave_time": class_end_time,
                    "duration_minutes": 0,  # Will be calculated below
                    "via_recording": is_in_past,
                },
            )
            if created:
                # Calculate duration based on join_time and class end time
                duration_minutes = int((class_end_time - now).total_seconds() / 60)
                attendance.duration_minutes = max(0, duration_minutes)
                attendance.save(update_fields=["duration_minutes"])
                attendance_registered = True
            elif not attendance.leave_time:
                # Student is already in the class, no need to update join_time
                attendance_registered = True
                if not attendance.duration_minutes:
                    # Calculate duration based on join_time and class end time
                    duration_minutes = int(
                        (class_end_time - attendance.join_time).total_seconds() / 60
                    )
                    attendance.duration_minutes = max(0, duration_minutes)
                    attendance.save(update_fields=["duration_minutes"])

        if is_in_progress and class_obj.zoom_join_url:
            return Response(
                {
                    "can_join": True,
                    "zoom_join_url": class_obj.zoom_join_url,
                    "password_for_zoom": class_obj.password_for_zoom,
                    "attendance_registered": attendance_registered,
                }
            )
        elif is_in_past and class_obj.recording_url:
            return Response(
                {
                    "can_join": True,
                    "recording_url": class_obj.recording_url,
                    "password_for_recording": class_obj.password_for_recording,
                    "attendance_registered": attendance_registered,
                }
            )
        else:
            return Response(
                {
                    "can_join": False,
                    "message": "Class is not available for joining.",
                    "attendance_registered": False,
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
class AttendanceViewSet(viewsets.ModelViewSet):
    """A viewset for viewing and managing attendance records"""

    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    ordering = ["-join_time"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ["create"]:
            return AttendanceCreateSerializer
        elif self.action in ["update", "partial_update", "bulk_verify"]:
            return AttendanceVerificationSerializer
        return AttendanceSerializer

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

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "bulk_verify",
        ]:
            permission_classes = [IsStaff]  # Only staff can manage attendance
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Add manual attendance",
        description="Add manual attendance record",
        request=AttendanceCreateSerializer,
        responses={201: AttendanceSerializer},
    )
    def create(self, request):
        """Add manual attendance record"""
        user = request.user
        serializer = AttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        class_session_id = serializer.validated_data["class_session_id"]
        student_id = serializer.validated_data["student_id"]

        try:
            class_obj = Class.objects.get(id=class_session_id)
        except Class.DoesNotExist:
            return Response(
                {"error": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has permission to add attendance for this class
        if not (
            user.role == "admin"
            or (user.role == "lecturer" and class_obj.lecturer == user)
        ):
            return Response(
                {
                    "error": "You don't have permission to add attendance for this class."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if student is enrolled in the class cohort
        from apps.cohorts.models import Enrollment

        if not Enrollment.objects.filter(
            student_id=student_id, cohort=class_obj.cohort
        ).exists():
            return Response(
                {"error": "Student is not enrolled in the cohort for this class."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if attendance already exists
        if Attendance.objects.filter(
            class_session_id=class_session_id, student_id=student_id
        ).exists():
            return Response(
                {
                    "error": "Attendance record already exists for this student and class."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create attendance record
        attendance = serializer.save(verified=True)  # Manual attendance is pre-verified
        response_serializer = AttendanceSerializer(attendance)

        return Response(
            {
                "message": "Manual attendance added successfully.",
                "attendance": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Verify attendance",
        description="Mark attendance as verified by admin/lecturer",
        parameters=[
            OpenApiParameter(
                name="id",
                description="Attendance ID",
                required=True,
                type=int,
                location=OpenApiParameter.PATH,
            ),
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "attendance": {"type": "object"},
                },
            }
        },
    )
    def update(self, request, pk=None, *args, **kwargs):
        """Mark attendance as verified"""
        attendance: Attendance = self.get_object()
        user = request.user

        # Check if user has permission to verify this attendance
        if not (
            user.role == "admin"
            or (user.role == "lecturer" and attendance.class_session.lecturer == user)
        ):
            return Response(
                {"error": "You don't have permission to verify this attendance."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Use the verification serializer to validate the request
        verification_serializer = AttendanceVerificationSerializer(data=request.data)
        verification_serializer.is_valid(raise_exception=True)

        # Update attendance with verified status
        attendance.verified = verification_serializer.validated_data.get(
            "verified", True
        )
        attendance.save(update_fields=["verified"])

        serializer = AttendanceSerializer(attendance)
        return Response(
            {
                "message": "Attendance verified successfully.",
                "attendance": serializer.data,
            }
        )

    @extend_schema(
        summary="Bulk verify attendance",
        description="Verify multiple attendance records for a class",
        parameters=[
            OpenApiParameter(
                name="class_id",
                description="Class ID",
                required=True,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "verified_count": {"type": "integer"},
                },
            }
        },
    )
    @action(detail=True, methods=["patch"], url_path="bulk-verify")
    def bulk_verify(self, request, pk=None):
        """Bulk verify attendance for a class"""
        user = request.user
        class_id = pk

        if not class_id:
            return Response(
                {"error": "class_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            class_obj = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return Response(
                {"error": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has permission to verify attendance for this class
        if not (
            user.role == "admin"
            or (user.role == "lecturer" and class_obj.lecturer == user)
        ):
            return Response(
                {
                    "error": "You don't have permission to verify attendance for this class."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Use the verification serializer to validate the request
        verification_serializer = AttendanceVerificationSerializer(data=request.data)
        verification_serializer.is_valid(raise_exception=True)

        # Verify all unverified attendance records for this class
        unverified_attendances = Attendance.objects.filter(
            class_session=class_obj, verified=False
        )

        verified_count = unverified_attendances.update(verified=True)

        return Response(
            {
                "message": f"Successfully verified {verified_count} attendance records.",
                "verified_count": verified_count,
            }
        )

    @extend_schema(
        summary="Get class attendance summary",
        description="Get attendance summary for a specific class",
        parameters=[
            OpenApiParameter(
                name="class_id",
                description="Class ID",
                required=True,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "class_info": {"type": "object"},
                    "attendance_summary": {"type": "object"},
                    "attendance_list": {"type": "array"},
                },
            }
        },
    )
    @action(detail=False, methods=["get"], url_path="class-summary")
    def class_attendance_summary(self, request):
        """Get attendance summary for a class"""
        user = request.user
        class_id = request.query_params.get("class_id")

        if not class_id:
            return Response(
                {"error": "class_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            class_obj = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return Response(
                {"error": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has permission to view attendance for this class
        if not (
            user.role == "admin"
            or (user.role == "lecturer" and class_obj.lecturer == user)
            or (
                user.role == "student"
                and class_obj.cohort.enrollments.filter(student=user).exists()
            )
        ):
            return Response(
                {
                    "error": "You don't have permission to view attendance for this class."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get all students enrolled in the class cohort
        from apps.cohorts.models import Enrollment

        enrolled_students = Enrollment.objects.filter(
            cohort=class_obj.cohort
        ).select_related("student")

        # Get attendance records for this class
        attendances = Attendance.objects.filter(class_session=class_obj).select_related(
            "student"
        )
        attendance_dict = {att.student_id: att for att in attendances}

        # Build attendance list
        attendance_list = []
        total_enrolled = enrolled_students.count()
        total_attended = 0
        total_verified = 0

        for enrollment in enrolled_students:
            student = enrollment.student
            attendance = attendance_dict.get(student.id)

            if attendance:
                total_attended += 1
                if attendance.verified:
                    total_verified += 1

                attendance_list.append(
                    {
                        "student": {
                            "id": student.id,
                            "name": student.get_full_name(),
                            "email": student.email,
                            "profile_picture": (
                                student.profile_picture.url
                                if student.profile_picture
                                else None
                            ),
                        },
                        "attendance": AttendanceSerializer(attendance).data,
                        "status": "attended",
                    }
                )
            else:
                attendance_list.append(
                    {
                        "student": {
                            "id": student.id,
                            "name": student.get_full_name(),
                            "email": student.email,
                            "profile_picture": (
                                student.profile_picture.url
                                if student.profile_picture
                                else None
                            ),
                        },
                        "attendance": None,
                        "status": "absent",
                    }
                )

        # Sort by student name
        attendance_list.sort(key=lambda x: x["student"]["name"])

        attendance_summary = {
            "total_enrolled": total_enrolled,
            "total_attended": total_attended,
            "total_absent": total_enrolled - total_attended,
            "total_verified": total_verified,
            "total_unverified": total_attended - total_verified,
            "attendance_rate": (
                round((total_attended / total_enrolled) * 100, 2)
                if total_enrolled > 0
                else 0
            ),
            "verification_rate": (
                round((total_verified / total_attended) * 100, 2)
                if total_attended > 0
                else 0
            ),
        }

        class_info = {
            "id": class_obj.id,
            "title": class_obj.title,
            "course_name": class_obj.course.name,
            "scheduled_at": class_obj.scheduled_at,
            "duration_minutes": class_obj.duration_minutes,
        }

        return Response(
            {
                "class_info": class_info,
                "attendance_summary": attendance_summary,
                "attendance_list": attendance_list,
            }
        )
