from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


urlpatterns = [
    path("schema", SpectacularAPIView.as_view(), name="schema"),
    path(
        "docs",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/invitations/", include("apps.invitations.urls")),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.cohorts.urls")),
    path("api/", include("apps.core.urls")),
    path("", admin.site.urls),
]

# Serve media files in development - add before admin URLs
if settings.DEBUG:
    urlpatterns = static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + urlpatterns
