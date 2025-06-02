from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Invitation
from .serializers import InvitationSerializer
from utils.permissions import IsAdmin
from apps.communications.services import send_invitation_email
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import extend_schema_view, extend_schema

# Create your views here.

@extend_schema_view(
    list=extend_schema(tags=["Invitations"]),
    retrieve=extend_schema(tags=["Invitations"]),
    create=extend_schema(tags=["Invitations"]),
    update=extend_schema(tags=["Invitations"]),
    partial_update=extend_schema(tags=["Invitations"]),
    destroy=extend_schema(tags=["Invitations"]),
    resend=extend_schema(tags=["Invitations"]),
)
class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        invitation = serializer.save(created_by=self.request.user)
        send_invitation_email.delay(invitation.id)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def resend(self, request, pk=None):
        invitation = self.get_object()
        # Update expiry
        invitation.expires_at = timezone.now() + settings.INVITATION_EXPIRATION_TIME
        invitation.save(update_fields=["expires_at"])
        send_invitation_email.delay(invitation.id)
        return Response({"detail": "Invitation resent."}, status=status.HTTP_200_OK)
