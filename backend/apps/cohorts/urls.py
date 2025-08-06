from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.cohorts.views import CohortViewSet, EnrollmentViewSet

router = DefaultRouter()
router.register(r"cohorts", CohortViewSet, basename="cohort")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")

urlpatterns = [
    path("", include(router.urls)),
]
