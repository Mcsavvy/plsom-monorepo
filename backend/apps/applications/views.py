from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema
from django.conf import settings
from django.utils import timezone
from django_q.tasks import async_task

from utils.permissions import IsAdmin
from apps.invitations.models import Invitation
from apps.cohorts.models import Cohort

from .models import Application
from .serializers import ApplicationSerializer, InviteFromApplicationSerializer


@extend_schema(tags=["Applications"])
class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    search_fields = ["full_name", "email", "phone", "nationality"]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == "invite":
            return InviteFromApplicationSerializer
        return ApplicationSerializer

    @extend_schema(
        summary="Submit enrollment application",
        description="Accept enrollment application from the landing page. Rejects duplicate emails.",
        request=ApplicationSerializer,
        responses={
            201: {"type": "object", "properties": {"detail": {"type": "string"}}},
        },
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Application submitted successfully."},
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="List applications",
        description="List all enrollment applications. Admin only.",
        responses={200: ApplicationSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Retrieve application",
        description="Get a single enrollment application. Admin only.",
        responses={200: ApplicationSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        exclude=True,
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        exclude=True,
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Delete application",
        description="Delete an enrollment application. Admin only.",
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="Invite applicant as student",
        description=(
            "Create a student invitation from an existing application. "
            "Requires a cohort ID. Sends invitation email. Admin only."
        ),
        request=InviteFromApplicationSerializer,
        responses={
            201: {"type": "object", "properties": {"detail": {"type": "string"}, "invitation_id": {"type": "integer"}}},
        },
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def invite(self, request, pk=None):
        application: Application = self.get_object()

        serializer = InviteFromApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cohort_id = serializer.validated_data["cohort"]

        # Validate cohort exists
        try:
            cohort = Cohort.objects.get(pk=cohort_id)
        except Cohort.DoesNotExist:
            raise ValidationError({"cohort": "Cohort not found."})

        # Guard: already invited
        if Invitation.objects.filter(email__iexact=application.email).exists():
            raise ValidationError(
                {"detail": "An invitation for this email already exists."}
            )

        # Guard: already a user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email__iexact=application.email).exists():
            raise ValidationError(
                {"detail": "A user with this email already exists."}
            )

        invitation = Invitation.objects.create(
            email=application.email,
            role="student",
            cohort=cohort,
            expires_at=timezone.now() + settings.INVITATION_EXPIRATION_TIME,
            created_by=request.user,
        )

        async_task(
            "apps.invitations.tasks.send_invitation_email", invitation.id
        )

        return Response(
            {
                "detail": "Invitation sent successfully.",
                "invitation_id": invitation.id,
            },
            status=status.HTTP_201_CREATED,
        )
