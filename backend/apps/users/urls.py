from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.users.views import UserViewSet, StudentViewSet, StaffViewSet

# Main user router for general user operations
user_router = DefaultRouter()
user_router.register(r"users", UserViewSet, basename="user")

# Student router
student_router = DefaultRouter()
student_router.register(r"students", StudentViewSet, basename="student")

# Staff router
staff_router = DefaultRouter()
staff_router.register(r"staff", StaffViewSet, basename="staff")

urlpatterns = [
    path("", include(student_router.urls)),
    path("", include(staff_router.urls)),
    path("", include(user_router.urls)),
]
