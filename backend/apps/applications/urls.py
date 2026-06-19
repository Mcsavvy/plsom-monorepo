from rest_framework.routers import DefaultRouter
from .views import ApplicationViewSet

router = DefaultRouter()
router.register(r"applications", ApplicationViewSet, basename="application")

# Keep the legacy submit-application endpoint for backwards compat
from django.urls import path
from django.views.generic import RedirectView

urlpatterns = router.urls + [
    path(
        "submit-application/",
        ApplicationViewSet.as_view({"post": "create"}),
        name="submit-application",
    ),
]
