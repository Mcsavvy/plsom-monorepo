from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, MetaView

router = DefaultRouter()
router.register(r"", AuditLogViewSet, basename="audit-logs")

urlpatterns = [
    path("audit-logs/", include(router.urls)),
    path("meta/<str:resource>/<int:id>/", MetaView.as_view(), name="meta"),
]
