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
    serializer_class = CustomTokenObtainPairSerializer  # type: ignore


@extend_schema(tags=["Authentication"])
class CustomTokenRefreshView(TokenRefreshView):
    pass


@extend_schema(tags=["Authentication"])
class CustomTokenVerifyView(TokenVerifyView):
    pass


@extend_schema(tags=["Authentication"])
class CustomTokenBlacklistView(TokenBlacklistView):
    @extend_schema(summary="Logout", description="Logout a user.")
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
