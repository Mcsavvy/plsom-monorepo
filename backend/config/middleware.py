import zoneinfo
from typing import Callable

from django.conf import settings
from django.http.request import HttpRequest as Request
from django.http.response import HttpResponse as Response
from django.utils import timezone

from apps.users.models import User

class SentryMiddleware:
    """Middleware to capture current user in Sentry."""

    def __init__(self, get_response: Callable[[Request], Response]):
        self.get_response = get_response

    def __call__(self, request: Request) -> Response:
        from sentry_sdk import set_user

        # ignore static files
        if request.path.startswith(settings.STATIC_URL):
            return self.get_response(request)

        if request.user.is_authenticated:
            user: User = request.user
            set_user(
                {
                    "id": user.pk,
                    "email": user.email,
                    "username": user.get_full_name(),
                }
            )
        return self.get_response(request)