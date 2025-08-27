from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, MetaView, DashboardStatsView

router = DefaultRouter()
router.register(r"", AuditLogViewSet, basename="audit-logs")

urlpatterns = [
    path("audit-logs/", include(router.urls)),
    path("meta/<str:resource>/<int:id>/", MetaView.as_view(), name="meta"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
