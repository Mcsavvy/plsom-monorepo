import sentry_sdk
from decouple import config

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
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True


INSTALLED_APPS += ["django_backblaze_b2"]
MIDDLEWARE += ["config.middleware.SentryMiddleware"]
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

# Production logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'plsom.log',
            'formatter': 'verbose',
        },
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["file", "console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": True,
        },
        "django.request": {
            "handlers": ["console", "file"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console", "file"],
            "level": "ERROR",
            "propagate": False,
        },
        "faker": {
            "handlers": ["console", "file"],
            "level": "ERROR",
        },
        "asyncio": {
            "handlers": ["console", "file"],
            "level": "ERROR",
        },
        "django-backblaze-b2": {
            "handlers": ["console", "file"],
            "level": "INFO",
        },
        "django_backblaze_b2": {
            "handlers": ["console", "file"],
            "level": "INFO",
        },
        "b2sdk": {
            "handlers": ["console", "file"],
            "level": "INFO",
        },
        "urllib3": {
            "handlers": ["console", "file"],
            "level": "INFO",
        },
        "": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
        },
    },
}