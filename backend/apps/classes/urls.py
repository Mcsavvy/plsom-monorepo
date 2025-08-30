from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.classes.views import ClassViewSet, AttendanceViewSet, ClassRedirectView

router = DefaultRouter()
router.register(r'classes', ClassViewSet, basename='class')
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
    path('redirect/<int:class_id>/', ClassRedirectView.as_view(), name='class-redirect'),
]