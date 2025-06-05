from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
    TokenBlacklistView,
)
from apps.authentication.serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import (
    TokenObtainPairView as BaseTokenObtainPairView,
)
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
