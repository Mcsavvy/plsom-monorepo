"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
    TokenBlacklistView,
)
from apps.authentication.serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from drf_spectacular.utils import extend_schema

@extend_schema(tags=["Authentication"])
class CustomTokenObtainPairView(BaseTokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@extend_schema(tags=["Authentication"])
class CustomTokenRefreshView(TokenRefreshView):
    pass

@extend_schema(tags=["Authentication"])
class CustomTokenVerifyView(TokenVerifyView):
    pass

@extend_schema(tags=["Authentication"])
class CustomTokenBlacklistView(TokenBlacklistView):
    pass

urlpatterns = [
    path("admin/", admin.site.urls),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/", include("apps.invitations.urls")),
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/token/verify/", CustomTokenVerifyView.as_view(), name="token_verify"),
    path(
        "api/auth/token/blacklist/",
        CustomTokenBlacklistView.as_view(),
        name="token_blacklist",
    ),
]
