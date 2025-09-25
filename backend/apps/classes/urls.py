from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.classes.views import ClassViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r"classes", ClassViewSet, basename="class")
router.register(r"attendance", AttendanceViewSet, basename="attendance")

urlpatterns = [
    path("", include(router.urls)),
]
