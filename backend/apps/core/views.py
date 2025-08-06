from rest_framework.response import Response
from rest_framework import status, viewsets, generics
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import IsAuthenticated
from apps.core.utils import get_resource_meta
from utils.permissions import IsAdmin, IsStaff
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
