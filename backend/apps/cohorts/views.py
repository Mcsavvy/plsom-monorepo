from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.cohorts.models import Cohort, Enrollment
from apps.cohorts.serializers import (
    CohortSerializer,
    EnrollmentSerializer,
    CurrentCohortSerializer,
)
from utils.permissions import IsAdmin


@extend_schema(tags=["Cohorts"])
class CohortViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing cohort instances.
    
    - Only admin can create or update cohorts
    - Students can only view their own cohort
    - Lecturers can view all cohorts
    - All authenticated users can view current active cohorts
    """
    search_fields = ['name', 'program_type']
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']
    serializer_class = CohortSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == "admin":
            # Admin can see all cohorts
            return Cohort.objects.all()
        elif user.role == "lecturer":
            # Lecturers can see all cohorts
            return Cohort.objects.all()
        elif user.role == "student":
            # Students can only see their own cohort(s)
            student_enrollments = Enrollment.objects.filter(student=user)
            cohort_ids = student_enrollments.values_list('cohort_id', flat=True)
            return Cohort.objects.filter(id__in=cohort_ids)
        else:
            return Cohort.objects.none()
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        elif self.action == 'current_cohorts':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Only admin can create cohorts"""
        if not self.request.user.role == "admin":
            raise PermissionDenied("Only admin can create cohorts")
        
        # Additional validation for cohort creation
        validated_data = serializer.validated_data
        
        # Check for overlapping cohorts of the same program type
        program_type = validated_data.get('program_type')
        start_date = validated_data.get('start_date')
        end_date = validated_data.get('end_date')
        
        if start_date and end_date:
            overlapping_cohorts = Cohort.objects.filter(
                program_type=program_type,
                start_date__lte=end_date,
                end_date__gte=start_date
            )
            if overlapping_cohorts.exists():
                overlapping_cohort = overlapping_cohorts.first()
                raise ValidationError(
                    f"Cohort dates overlap with existing cohort '{overlapping_cohort.name}' "
                    f"({overlapping_cohort.start_date} to {overlapping_cohort.end_date})"
                )
        
        serializer.save()
    
    def perform_update(self, serializer):
        """Only admin can update cohorts"""
        if not self.request.user.role == "admin":
            raise PermissionDenied("Only admin can update cohorts")
        
        instance = self.get_object()
        validated_data = serializer.validated_data
        
        # Additional validation for cohort updates
        program_type = validated_data.get('program_type', instance.program_type)
        start_date = validated_data.get('start_date', instance.start_date)
        end_date = validated_data.get('end_date', instance.end_date)
        
        # Check for overlapping cohorts when updating dates
        if start_date and end_date:
            overlapping_cohorts = Cohort.objects.filter(
                program_type=program_type,
                start_date__lte=end_date,
                end_date__gte=start_date
            ).exclude(id=instance.id)
            
            if overlapping_cohorts.exists():
                overlapping_cohort = overlapping_cohorts.first()
                raise ValidationError(
                    f"Updated dates would overlap with existing cohort '{overlapping_cohort.name}' "
                    f"({overlapping_cohort.start_date} to {overlapping_cohort.end_date})"
                )
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only admin can delete cohorts"""
        if not self.request.user.role == "admin":
            raise PermissionDenied("Only admin can delete cohorts")
        
        # Check if cohort has enrolled students
        if Enrollment.objects.filter(cohort=instance).exists():
            raise ValidationError("Cannot delete cohort with enrolled students")
        
        # Check if cohort is active
        if instance.is_active:
            raise ValidationError("Cannot delete active cohort")
        
        # Check if cohort has started
        today = timezone.now().date()
        if instance.start_date <= today:
            raise ValidationError("Cannot delete cohort that has already started")
        
        # Check for associated classes or assessments
        try:
            from apps.classes.models import Class
            if Class.objects.filter(cohort=instance).exists():
                raise ValidationError("Cannot delete cohort with associated classes")
        except ImportError:
            pass
        
        try:
            from apps.assessments.models import Test
            if Test.objects.filter(cohort=instance).exists():
                raise ValidationError("Cannot delete cohort with associated assessments")
        except (ImportError, AttributeError):
            pass
        
        instance.delete()
    
    @extend_schema(
        summary="List cohorts",
        description="List cohorts based on user role. Students only see their own cohort, lecturers and admins see all.",
        request=None,
        responses={200: CohortSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @extend_schema(
        summary="Create a new cohort",
        description="Create a new cohort. Only admin can create cohorts.",
        request=CohortSerializer,
        responses={201: CohortSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @extend_schema(
        summary="Get a cohort",
        description="Get a specific cohort. Students can only access their own cohort.",
        request=None,
        responses={200: CohortSerializer},
        parameters=[
            OpenApiParameter(
                name='id',
                description='Cohort ID',
                required=True,
                type=int,
                location=OpenApiParameter.PATH,
            ),
        ],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        exclude=True,
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @extend_schema(
        summary="Update a cohort",
        request=CohortSerializer,
        responses={200: CohortSerializer},
        parameters=[
            OpenApiParameter(
                name='id',
                description='Cohort ID',
                required=True,
                type=int,
                location=OpenApiParameter.PATH,
            ),
        ],
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @extend_schema(
        summary="Delete a cohort",
        description="Delete a cohort. Only admin can delete cohorts.",
        request=None,
        responses={204: None},
        parameters=[
            OpenApiParameter(
                name='id',
                description='Cohort ID',
                required=True,
                type=int,
                location=OpenApiParameter.PATH,
            ),
        ],
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @extend_schema(
        summary="Get current active cohorts",
        description="Get all currently active cohorts. Available to all authenticated users.",
        request=None,
        responses={200: CurrentCohortSerializer(many=True)},
    )
    @action(detail=False, methods=['get'], url_path='current')
    def current_cohorts(self, request):
        """
        Returns current active cohorts for all authenticated users.
        This is a special endpoint that bypasses the normal queryset filtering.
        """
        current_cohorts = Cohort.objects.filter(is_active=True)
        serializer = CurrentCohortSerializer(current_cohorts, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get user's cohort",
        description="Get the cohort that the current user is enrolled in (for students).",
        request=None,
        responses={200: CohortSerializer},
    )
    @action(detail=False, methods=['get'], url_path='my-cohort')
    def my_cohort(self, request):
        """
        Returns the cohort that the current user is enrolled in.
        Only works for students.
        """
        user = request.user
        
        if user.role != "student":
            return Response(
                {"detail": "This endpoint is only available for students."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the latest enrollment
        enrollment = Enrollment.objects.filter(student=user).order_by('-enrolled_at').first()
        
        if not enrollment:
            return Response(
                {"detail": "You are not enrolled in any cohort."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CohortSerializer(enrollment.cohort)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Archive a cohort",
        description="Archive a cohort by setting its end date to today and deactivating it. Only admin can archive cohorts.",
        request=None,
        responses={200: CohortSerializer},
        parameters=[
            OpenApiParameter(
                name='id',
                description='Cohort ID',
                required=True,
                type=int,
                location=OpenApiParameter.PATH,
            ),
        ],
    )
    @action(detail=True, methods=['post'], url_path='archive')
    def archive_cohort(self, request, pk=None):
        """
        Archive a cohort by setting its end date to today and deactivating it.
        Only admin can perform this action.
        """
        if not request.user.role == "admin":
            raise PermissionDenied("Only admin can archive cohorts")
        
        cohort = self.get_object()
        cohort.archive()
        serializer = CohortSerializer(cohort)
        return Response(serializer.data)


@extend_schema(tags=["Enrollments"])
class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing enrollment instances.
    Read-only viewset as enrollments are managed through invitations.
    """
    
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['student__email', 'student__first_name', 'student__last_name', 'cohort__name']
    ordering_fields = ['enrolled_at']
    ordering = ['-enrolled_at']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == "admin":
            # Admin can see all enrollments
            return Enrollment.objects.all().select_related('student', 'cohort')
        elif user.role == "lecturer":
            # Lecturers can see all enrollments
            return Enrollment.objects.all().select_related('student', 'cohort')
        elif user.role == "student":
            # Students can only see their own enrollments
            return Enrollment.objects.filter(student=user).select_related('student', 'cohort')
        else:
            return Enrollment.objects.none()
    
    @extend_schema(
        summary="List enrollments",
        description="List enrollments based on user role. Students only see their own enrollments.",
        request=None,
        responses={200: EnrollmentSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @extend_schema(
        summary="Get an enrollment",
        description="Get a specific enrollment. Students can only access their own enrollments.",
        request=None,
        responses={200: EnrollmentSerializer},
        parameters=[
            OpenApiParameter(
                name='id',
                description='Enrollment ID',
                required=True,
                type=int,
                location=OpenApiParameter.PATH,
            ),
        ],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
