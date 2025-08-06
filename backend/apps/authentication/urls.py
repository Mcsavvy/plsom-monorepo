from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CustomTokenVerifyView,
    CustomTokenBlacklistView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
)

urlpatterns = [
    path(
        "login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"
    ),
    path("refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("verify/", CustomTokenVerifyView.as_view(), name="token_verify"),
    path("logout/", CustomTokenBlacklistView.as_view(), name="token_blacklist"),
    path(
        "forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"
    ),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path(
        "change-password/", ChangePasswordView.as_view(), name="change_password"
    ),
]
