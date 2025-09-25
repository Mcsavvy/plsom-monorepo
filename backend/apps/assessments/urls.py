from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Register viewsets with the router
router.register(r"tests", views.TestViewSet, basename="test")
router.register(r"submissions", views.SubmissionViewSet, basename="submission")

urlpatterns = [
    path("", include(router.urls)),
]
