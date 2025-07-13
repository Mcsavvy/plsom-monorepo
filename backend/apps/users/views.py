from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import APIException
from drf_spectacular.utils import extend_schema

from apps.users.models import User
from apps.users.serializers import (
    UserSerializer,
    PromoteDemoteResponseSerializer,
)
from utils.permissions import IsAdmin, IsLecturer
from apps.users.permissions import IsMeOrStaffCanRead


@extend_schema(tags=["Users"])
class UserViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing user instances.
    """

    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == "list":
            permission_classes = [IsAdmin, IsLecturer]
        elif self.action == "destroy":
            permission_classes = [IsAdmin]
        elif self.action == "promote":
            permission_classes = [IsAdmin]
        elif self.action == "me":
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsMeOrStaffCanRead]
        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Get a user",
        description="Get a user.",
        request=None,
        responses={200: UserSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

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
        summary="Delete a user",
        description="Delete a user.",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="List users",
        description="List users.",
        request=None,
        responses={200: UserSerializer},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def create(self, request, *args, **kwargs):
        raise APIException("Method not allowed", status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(
        summary="Promote or Demote a User",
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
                raise APIException("Admin cannot demote themselves", status.HTTP_400_BAD_REQUEST)
            user.role = "lecturer"
            user.save()
            return Response({"status": "admin demoted to lecturer"})
        else:
            raise APIException("User is not a lecturer or admin", status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Get the current user",
        description="Get the current user.",
        request=None,
        responses={200: UserSerializer},
    )
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """
        Get the current user.
        """
        return Response(UserSerializer(request.user).data)
