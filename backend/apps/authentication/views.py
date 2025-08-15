from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
    TokenBlacklistView,
)
from apps.authentication.serializers import (
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer,
    CustomTokenRefreshSerializer,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView as BaseTokenObtainPairView,
)
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse


@extend_schema(tags=["Authentication"])
class CustomTokenObtainPairView(BaseTokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer  # type: ignore


@extend_schema(tags=["Authentication"])
class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer  # type: ignore


@extend_schema(tags=["Authentication"])
class CustomTokenVerifyView(TokenVerifyView):
    pass


@extend_schema(tags=["Authentication"])
class CustomTokenBlacklistView(TokenBlacklistView):
    @extend_schema(summary="Logout", description="Logout a user.")
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class CreateAPIView(generics.CreateAPIView):
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_200_OK, headers=headers
        )


class ForgotPasswordView(CreateAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Forgot Password",
        description="Send password reset email to user.",
        tags=["Authentication"],
        responses={
            200: OpenApiResponse(
                description="Password reset email has been sent to your email address."
            )
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ResetPasswordView(CreateAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Reset Password",
        description="Reset user password using token.",
        tags=["Authentication"],
        responses={
            200: OpenApiResponse(
                description="Password has been reset successfully."
            )
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ChangePasswordView(CreateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Change Password",
        description="Change password for authenticated user.",
        tags=["Authentication"],
        responses={
            200: OpenApiResponse(
                description="Password has been changed successfully."
            )
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
