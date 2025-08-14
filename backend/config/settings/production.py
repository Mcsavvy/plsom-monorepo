# ruff: noqa: F403, F405
import sentry_sdk
from urllib.parse import urlparse

from .base import *


sentry_sdk.init(
    dsn=config("SENTRY_DSN"),
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for tracing.
    traces_sample_rate=1.0,
    # Set profiles_sample_rate to 1.0 to profile 100%
    # of sampled transactions.
    # We recommend adjusting this value in production.
    profiles_sample_rate=1.0,
)


DEBUG = False

# Security settings
# SECURE_SSL_REDIRECT = True
# SECURE_HSTS_SECONDS = 31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True
# SECURE_CONTENT_TYPE_NOSNIFF = True
# SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

ALLOWED_HOSTS: list[str] = config("ALLOWED_HOSTS", default="", cast=Csv())  # type: ignore
CSRF_TRUSTED_ORIGINS: list[str] = config(
    "CSRF_TRUSTED_ORIGINS", default="", cast=Csv()
)
COOLIFY_URLS: list[str] = config("COOLIFY_URL", default="", cast=Csv())
COOLIFY_URLS.extend(
    (
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://0.0.0.0:8000",
        FRONTEND_URL,
        ADMIN_DASHBOARD_URL,
    )
)

for url in COOLIFY_URLS:
    hostname = urlparse(url).hostname
    if hostname:
        ALLOWED_HOSTS.append(hostname)
        CSRF_TRUSTED_ORIGINS.append(url)


INSTALLED_APPS += ["django_backblaze_b2"]
MIDDLEWARE.insert(
    MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)
MIDDLEWARE.append("config.middleware.SentryMiddleware")
STORAGES.update(
    {
        "default": {
            "BACKEND": "django_backblaze_b2.storages.LoggedInStorage",
        }
    }
)

CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"},
    "django-backblaze-b2": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache"
    },
}

BACKBLAZE_CONFIG: dict[str, str] = {
    "application_key_id": config("BACKBLAZE_APP_KEY_ID"),
    "application_key": config("BACKBLAZE_APP_KEY"),
    "bucket": config("BACKBLAZE_BUCKET"),
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST = config("EMAIL_HOST")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")
