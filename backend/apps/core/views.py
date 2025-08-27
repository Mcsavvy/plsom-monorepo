from rest_framework.response import Response
from rest_framework import status, viewsets, generics
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from apps.core.utils import get_resource_meta
from utils.permissions import IsAdmin, IsStaff, IsLecturerOrAdmin
from .models import AuditLog
from .serializers import (
    AuditLogSerializer,
    CreateAuditLogSerializer,
    MetaSerializer,
)
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request


@extend_schema(tags=["Audit Logs"])
class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    search_fields = ["resource", "author_name"]
    ordering = ["-timestamp"]

    filterable_fields = [
        "resource",
        "action",
        "author",
        "timestamp",
        "ip_address",
    ]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateAuditLogSerializer
        return AuditLogSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsAdmin()]

    @extend_schema(
        summary="Create a new audit log",
        responses={
            status.HTTP_201_CREATED: AuditLogSerializer,
        },
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Get a list of audit logs",
        responses={
            status.HTTP_200_OK: AuditLogSerializer(many=True),
        },
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get a single audit log",
        responses={
            status.HTTP_200_OK: AuditLogSerializer,
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        exclude=True,
    )
    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed(self.request.method)

    @extend_schema(
        summary="Update a single audit log",
        responses={
            status.HTTP_200_OK: AuditLogSerializer,
        },
    )
    def partial_update(self, request, *args, **kwargs):
        """
        Allow updating audit log metadata for organization purposes.
        Only certain fields can be updated to maintain audit integrity.
        """
        instance = self.get_object()

        # Only allow updating certain fields
        allowed_fields = ["meta"]
        update_data = {
            k: v for k, v in request.data.items() if k in allowed_fields
        }

        if "name" in request.data:
            # Store custom name in meta
            if "meta" not in update_data:
                update_data["meta"] = instance.meta.copy()
            update_data["meta"]["custom_name"] = request.data["name"]

        serializer = self.get_serializer(
            instance, data=update_data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @extend_schema(
        summary="Delete a single audit log",
        responses={
            status.HTTP_204_NO_CONTENT: None,
        },
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


@extend_schema(tags=["Meta"])
class MetaView(generics.GenericAPIView):
    queryset = None
    serializer_class = MetaSerializer
    permission_classes = [IsStaff]
    http_method_names = ["get"]

    @extend_schema(
        summary="Get meta data for a resource",
        responses={
            status.HTTP_200_OK: MetaSerializer,
        },
    )
    def get(self, request: Request, *args, **kwargs):
        try:
            meta = get_resource_meta(
                kwargs.get("resource"),  # type: ignore
                kwargs.get("id"),  # type: ignore
            )
            return Response(meta)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(tags=["Dashboard"])
class DashboardStatsView(generics.GenericAPIView):
    """
    Comprehensive dashboard statistics endpoint.
    Provides different levels of access for admins and lecturers.
    """
    permission_classes = [IsAuthenticated, IsLecturerOrAdmin]
    http_method_names = ["get"]

    @extend_schema(
        summary="Get dashboard statistics",
        description="Get comprehensive dashboard statistics. Admins see all data, lecturers see data related to their courses.",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "user_stats": {
                        "type": "object",
                        "properties": {
                            "total_users": {"type": "integer"},
                            "total_students": {"type": "integer"},
                            "total_lecturers": {"type": "integer"},
                            "total_admins": {"type": "integer"},
                            "active_users": {"type": "integer"},
                            "recent_registrations": {"type": "integer"},
                        }
                    },
                    "cohort_stats": {
                        "type": "object",
                        "properties": {
                            "total_cohorts": {"type": "integer"},
                            "active_cohorts": {"type": "integer"},
                            "upcoming_cohorts": {"type": "integer"},
                            "completed_cohorts": {"type": "integer"},
                            "total_enrollments": {"type": "integer"},
                            "avg_enrollment_per_cohort": {"type": "number"},
                        }
                    },
                    "course_stats": {
                        "type": "object",
                        "properties": {
                            "total_courses": {"type": "integer"},
                            "active_courses": {"type": "integer"},
                            "courses_by_program": {"type": "object"},
                            "courses_with_lecturers": {"type": "integer"},
                            "courses_without_lecturers": {"type": "integer"},
                        }
                    },
                    "class_stats": {
                        "type": "object",
                        "properties": {
                            "total_classes": {"type": "integer"},
                            "completed_classes": {"type": "integer"},
                            "upcoming_classes": {"type": "integer"},
                            "classes_this_week": {"type": "integer"},
                            "avg_attendance_rate": {"type": "number"},
                            "total_attendance_records": {"type": "integer"},
                        }
                    },
                    "assessment_stats": {
                        "type": "object",
                        "properties": {
                            "total_tests": {"type": "integer"},
                            "published_tests": {"type": "integer"},
                            "draft_tests": {"type": "integer"},
                            "archived_tests": {"type": "integer"},
                            "total_submissions": {"type": "integer"},
                            "avg_submission_rate": {"type": "number"},
                            "avg_test_score": {"type": "number"},
                        }
                    },
                    "invitation_stats": {
                        "type": "object",
                        "properties": {
                            "total_invitations": {"type": "integer"},
                            "pending_invitations": {"type": "integer"},
                            "used_invitations": {"type": "integer"},
                            "expired_invitations": {"type": "integer"},
                            "invitations_by_role": {"type": "object"},
                        }
                    },
                    "recent_activity": {
                        "type": "object",
                        "properties": {
                            "recent_classes": {"type": "array"},
                            "recent_tests": {"type": "array"},
                            "recent_enrollments": {"type": "array"},
                        }
                    }
                }
            }
        },
    )
    def get(self, request: Request, *args, **kwargs):
        """Get comprehensive dashboard statistics"""
        user = request.user
        is_admin = user.role == "admin"
        
        # Import models here to avoid circular imports
        from apps.users.models import User
        from apps.cohorts.models import Cohort, Enrollment
        from apps.courses.models import Course
        from apps.classes.models import Class, Attendance
        from apps.assessments.models import Test, Submission
        from apps.invitations.models import Invitation
        
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Base querysets - filter by lecturer if not admin
        if is_admin:
            course_filter = Q()
            class_filter = Q()
            test_filter = Q()
        else:
            course_filter = Q(lecturer=user)
            class_filter = Q(lecturer=user)
            test_filter = Q(created_by=user)
        
        # User Statistics
        user_stats = {
            "total_users": User.objects.count(),
            "total_students": User.objects.filter(role="student").count(),
            "total_lecturers": User.objects.filter(role="lecturer").count(),
            "total_admins": User.objects.filter(role="admin").count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "recent_registrations": User.objects.filter(
                date_joined__gte=month_ago
            ).count(),
        }
        
        # Cohort Statistics
        cohort_stats = {
            "total_cohorts": Cohort.objects.count(),
            "active_cohorts": Cohort.objects.filter(is_active=True).count(),
            "upcoming_cohorts": Cohort.objects.filter(
                start_date__gt=today
            ).count(),
            "completed_cohorts": Cohort.objects.filter(
                end_date__lt=today
            ).count(),
            "total_enrollments": Enrollment.objects.count(),
        }
        
        # Calculate average enrollment per cohort
        if cohort_stats["total_cohorts"] > 0:
            cohort_stats["avg_enrollment_per_cohort"] = round(
                cohort_stats["total_enrollments"] / cohort_stats["total_cohorts"], 2
            )
        else:
            cohort_stats["avg_enrollment_per_cohort"] = 0
        
        # Course Statistics
        courses = Course.objects.filter(course_filter)
        course_stats = {
            "total_courses": courses.count(),
            "active_courses": courses.filter(is_active=True).count(),
            "courses_by_program": dict(
                courses.values_list("program_type").annotate(
                    count=Count("id")
                )
            ),
            "courses_with_lecturers": courses.filter(lecturer__isnull=False).count(),
            "courses_without_lecturers": courses.filter(lecturer__isnull=True).count(),
        }
        
        # Class Statistics
        classes = Class.objects.filter(class_filter)
        class_stats = {
            "total_classes": classes.count(),
            "completed_classes": classes.filter(scheduled_at__lt=now).count(),
            "upcoming_classes": classes.filter(scheduled_at__gte=now).count(),
            "classes_this_week": classes.filter(
                scheduled_at__gte=now,
                scheduled_at__lte=now + timedelta(days=7)
            ).count(),
        }
        
        # Attendance Statistics
        if is_admin:
            attendance_records = Attendance.objects.all()
        else:
            attendance_records = Attendance.objects.filter(
                class_session__lecturer=user
            )
        
        class_stats["total_attendance_records"] = attendance_records.count()
        
        # Calculate average attendance rate
        total_possible_attendances = 0
        total_actual_attendances = 0
        
        for class_obj in classes:
            enrolled_students = class_obj.cohort.enrollments.count()
            total_possible_attendances += enrolled_students
            total_actual_attendances += class_obj.attendances.count()
        
        if total_possible_attendances > 0:
            class_stats["avg_attendance_rate"] = round(
                (total_actual_attendances / total_possible_attendances) * 100, 2
            )
        else:
            class_stats["avg_attendance_rate"] = 0
        
        # Assessment Statistics
        tests = Test.objects.filter(test_filter)
        assessment_stats = {
            "total_tests": tests.count(),
            "published_tests": tests.filter(status="published").count(),
            "draft_tests": tests.filter(status="draft").count(),
            "archived_tests": tests.filter(status="archived").count(),
        }
        
        # Submission Statistics
        if is_admin:
            submissions = Submission.objects.all()
        else:
            submissions = Submission.objects.filter(test__created_by=user)
        
        assessment_stats["total_submissions"] = submissions.count()
        
        # Calculate average submission rate
        total_possible_submissions = 0
        total_actual_submissions = 0
        
        for test in tests:
            enrolled_students = test.cohort.enrollments.count()
            total_possible_submissions += enrolled_students * test.max_attempts
            total_actual_submissions += test.submissions.count()
        
        if total_possible_submissions > 0:
            assessment_stats["avg_submission_rate"] = round(
                (total_actual_submissions / total_possible_submissions) * 100, 2
            )
        else:
            assessment_stats["avg_submission_rate"] = 0
        
        # Calculate average test score
        completed_submissions = submissions.filter(
            status__in=["submitted", "graded"]
        ).exclude(score__isnull=True)
        
        if completed_submissions.exists():
            avg_score = completed_submissions.aggregate(avg=Avg("score"))["avg"]
            assessment_stats["avg_test_score"] = round(float(avg_score), 2) if avg_score else 0
        else:
            assessment_stats["avg_test_score"] = 0
        
        # Invitation Statistics (Admin only)
        if is_admin:
            invitations = Invitation.objects.all()
            invitation_stats = {
                "total_invitations": invitations.count(),
                "pending_invitations": invitations.filter(used_at__isnull=True).count(),
                "used_invitations": invitations.filter(used_at__isnull=False).count(),
                "expired_invitations": invitations.filter(expires_at__lt=now).count(),
                "invitations_by_role": dict(
                    invitations.values_list("role").annotate(
                        count=Count("id")
                    )
                ),
            }
        else:
            invitation_stats = {
                "total_invitations": 0,
                "pending_invitations": 0,
                "used_invitations": 0,
                "expired_invitations": 0,
                "invitations_by_role": {},
            }
        
        # Recent Activity
        recent_activity = {
            "recent_classes": list(
                classes.filter(scheduled_at__gte=week_ago)
                .order_by("-scheduled_at")[:5]
                .values("id", "title", "scheduled_at", "course__name")
            ),
            "recent_tests": list(
                tests.filter(created_at__gte=week_ago)
                .order_by("-created_at")[:5]
                .values("id", "title", "status", "created_at")
            ),
            "recent_enrollments": list(
                Enrollment.objects.filter(enrolled_at__gte=week_ago)
                .order_by("-enrolled_at")[:5]
                .values("id", "student__email", "cohort__name", "enrolled_at")
            ),
        }
        
        return Response({
            "user_stats": user_stats,
            "cohort_stats": cohort_stats,
            "course_stats": course_stats,
            "class_stats": class_stats,
            "assessment_stats": assessment_stats,
            "invitation_stats": invitation_stats,
            "recent_activity": recent_activity,
        })
