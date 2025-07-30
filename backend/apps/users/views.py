from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema

from apps.users.models import User
from apps.users.serializers import (
    UserSerializer,
    StudentSerializer,
    StaffSerializer,
    PromoteDemoteResponseSerializer,
    ProfilePictureUploadSerializer,
    StudentEnrollmentActionSerializer,
)
from utils.permissions import IsAdmin, IsLecturer
from apps.cohorts.models import Cohort, Enrollment


@extend_schema(tags=["Users"])
class UserViewSet(viewsets.GenericViewSet, mixins.UpdateModelMixin):
    """
    Base viewset for user operations.
    """

    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == "me":
            permission_classes = [IsAuthenticated]
        elif self.action == "profile_picture":
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Get the current user",
        request=None,
        responses={200: UserSerializer},
    )
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """
        Get the current user.
        """
        return Response(self.get_serializer(request.user).data)

    @extend_schema(
        summary="Update a user",
        description="Update a user.",
        request=UserSerializer,
        responses={200: UserSerializer},
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Partial update a user",
        description="Partial update a user.",
        request=UserSerializer,
        responses={200: UserSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Update/Delete Profile Picture",
        description="Update/Delete the profile picture for the current user.",
        request=ProfilePictureUploadSerializer,
        responses={200: UserSerializer},
    )
    @action(
        detail=False,
        methods=["post", "delete"],
        url_path="me/profile-picture",
        parser_classes=[MultiPartParser, FormParser],
    )
    def profile_picture(self, request):
        """
        Update/Delete the profile picture for the current user.
        """
        if request.method == "POST":
            serializer = ProfilePictureUploadSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save(request.user)
                return Response(self.get_serializer(user).data, status=200)
            return Response(serializer.errors, status=400)

        user = request.user
        if user.profile_picture:
            user.profile_picture.delete(save=False)
            user.profile_picture = None
            user.save()
            return Response(self.get_serializer(user).data, status=200)
        else:
            return Response({"error": "No profile picture to delete."}, status=400)


@extend_schema(tags=["Students"])
class StudentViewSet(
    viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin
):
    """
    Viewset for student operations.
    """

    serializer_class = StudentSerializer
    permission_classes = [IsAdmin, IsLecturer]

    def get_queryset(self):
        """
        Return only students.
        """
        return User.objects.filter(role="student")

    @extend_schema(
        summary="List students",
        description="List all students.",
        request=None,
        responses={200: StudentSerializer},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get a student",
        description="Get a student.",
        request=None,
        responses={200: StudentSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Enroll a student in a cohort",
        description="Enrolls a student in a specific cohort. Requires cohort ID.",
        request=StudentEnrollmentActionSerializer,
        responses={200: StudentSerializer},
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def enroll(self, request, pk=None):
        """Enroll a student in a cohort."""
        student = self.get_object()
        serializer = StudentEnrollmentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cohort_id = serializer.validated_data["cohort_id"]
        cohort = Cohort.objects.get(id=cohort_id)

        # Check if already enrolled
        if Enrollment.objects.filter(student=student, cohort=cohort).exists():
            raise ValidationError("Student is already enrolled in this cohort.")

        Enrollment.objects.create(student=student, cohort=cohort)
        return Response(self.get_serializer(student).data)

    @extend_schema(
        summary="Unenroll a student from a cohort",
        description="Unenrolls a student from a specific cohort. Requires cohort ID.",
        request=StudentEnrollmentActionSerializer,
        responses={200: StudentSerializer},
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def unenroll(self, request, pk=None):
        """Unenroll a student from a cohort."""
        student = self.get_object()
        serializer = StudentEnrollmentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cohort_id = serializer.validated_data["cohort_id"]
        cohort = Cohort.objects.get(id=cohort_id)

        # Check if enrollment exists
        enrollment = Enrollment.objects.filter(student=student, cohort=cohort).first()
        if not enrollment:
            raise ValidationError("Student is not enrolled in this cohort.")

        enrollment.delete()
        return Response(self.get_serializer(student).data)


@extend_schema(tags=["Staff"])
class StaffViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    """
    Viewset for staff operations (lecturers and admins).
    """

    serializer_class = StaffSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        """
        Return only staff members (lecturers and admins).
        """
        return User.objects.filter(role__in=["lecturer", "admin"])

    @extend_schema(
        summary="List staff",
        description="List all staff members.",
        request=None,
        responses={200: StaffSerializer},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get a staff member",
        description="Get a staff member.",
        request=None,
        responses={200: StaffSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Promote or Demote a Staff Member",
        description="Promotes a lecturer to admin, or demotes an admin to lecturer.",
        request=None,
        responses={
            200: PromoteDemoteResponseSerializer,
        },
    )
    @action(detail=True, methods=["post"], url_path="promote-demote")
    def promote(self, request, pk=None):
        """
        Promote a lecturer to admin or demote an admin to lecturer.
        """
        user = self.get_object()
        if user.role == "lecturer":
            user.role = "admin"
            user.save()
            return Response({"status": "user promoted to admin"})
        elif user.role == "admin":
            if user == request.user:
                raise ValidationError("Admin cannot demote themselves")
            user.role = "lecturer"
            user.save()
            return Response({"status": "admin demoted to lecturer"})
        else:
            raise ValidationError("User is not a lecturer or admin")
