from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import APIException
from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from django_q.tasks import async_task

from .models import Invitation
from .serializers import (
    InvitationSerializer,
    InvitationVerifySerializer,
    OnboardingSerializer,
    InvitationDetailsSerializer,
    OnboardingResponseSerializer,
)
from utils.serializers import SuccessResponseSerializer
from utils.permissions import IsAdmin


@extend_schema(
    tags=["Invitations"],
)
class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [IsAdmin]
    search_fields = ["email", "role", "program_type", "cohort__name"]

    def perform_create(self, serializer):
        invitation = serializer.save(created_by=self.request.user)
        async_task(
            "apps.invitations.tasks.send_invitation_email", invitation.id
        )

    @extend_schema(
        summary="Get Invitation",
        description="Get an invitation.",
        request=None,
        responses={200: InvitationSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="List Invitations",
        description="List all invitations.",
        request=None,
        responses={200: InvitationSerializer},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Create Invitation",
        description="Create an invitation.",
        request=InvitationSerializer,
        responses={201: InvitationSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Update Invitation",
        description="Update an invitation (only if not used).",
        request=InvitationSerializer,
        responses={
            200: InvitationSerializer,
        },
    )
    def update(self, request, *args, **kwargs):
        invitation = self.get_object()
        if invitation.used_at:
            raise APIException("Invitation already used.", status.HTTP_400_BAD_REQUEST)
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            async_task("apps.invitations.tasks.send_invitation_email", invitation.id)
        return response

    @extend_schema(
        summary="Partially Update Invitation",
        description="Partially update an invitation (only if not used).",
        request=InvitationSerializer,
        responses={
            200: InvitationSerializer,
        },
    )
    def partial_update(self, request, *args, **kwargs):
        invitation = self.get_object()
        if invitation.used_at:
            raise APIException("Invitation already used.", status.HTTP_400_BAD_REQUEST)
        response = super().partial_update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            async_task("apps.invitations.tasks.send_invitation_email", invitation.id)
        return response

    @extend_schema(
        summary="Delete Invitation",
        description="Delete an invitation.",
        request=None,
        responses={
            204: SuccessResponseSerializer,
        },
    )
    def destroy(self, request, *args, **kwargs):
        # can only delete invitations that are not used
        invitation = self.get_object()
        if invitation.used_at:
            raise APIException("Invitation already used.", status.HTTP_400_BAD_REQUEST)

        invitation.delete()
        return Response(
            {"detail": "Invitation deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )

    @extend_schema(
        summary="Resend Invitation",
        description="Resend an invitation to a user.",
        request=None,
        responses={200: SuccessResponseSerializer},
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def resend(self, request, pk=None):
        invitation = self.get_object()
        # Update expiry
        invitation.expires_at = timezone.now() + settings.INVITATION_EXPIRATION_TIME
        invitation.save(update_fields=["expires_at"])
        async_task("apps.invitations.tasks.send_invitation_email", invitation.id)
        return Response({"detail": "Invitation resent."}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Verify Invitation Token",
        description="Verify if an invitation token is valid and return invitation details.",
        request=InvitationVerifySerializer,
        responses={
            200: InvitationDetailsSerializer,
        },
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def verify(self, request):
        """Verify invitation token and return invitation details"""
        serializer = InvitationVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        invitation = Invitation.objects.get(token=token)

        # Prepare response data
        response_data = {
            "email": invitation.email,
            "role": invitation.role,
            "program_type": invitation.program_type,
            "cohort_name": invitation.cohort.name if invitation.cohort else None,
        }

        response_serializer = InvitationDetailsSerializer(response_data)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
        


    @extend_schema(
        summary="Complete User Onboarding",
        description="Complete user account setup using invitation token.",
        request=OnboardingSerializer,
        responses={
            201: OnboardingResponseSerializer,
        },
    )
    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def onboard(self, request):
        """Complete user onboarding process"""
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "user_id": user.id,
                "email": user.email,
                "role": user.role,
            },
            status=status.HTTP_201_CREATED,
        )