from pathlib import Path
from decouple import config, Csv
import dj_database_url
from utils.common import ms_to_timedelta

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Environment-specific config loading
DJANGO_ENV = config("DJANGO_ENV", default="development")

# Load environment file based on DJANGO_ENV
if DJANGO_ENV == "production":
    env_file = BASE_DIR / ".env.production"
elif DJANGO_ENV == "development":
    env_file = BASE_DIR / ".env.development"
else:
    env_file = BASE_DIR / ".env.local"

# Override default config with environment-specific file
if env_file.exists():
    from decouple import Config, RepositoryEnv

    config = Config(RepositoryEnv(env_file))

# FRONTEND URL
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")

# Security
SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="", cast=Csv())
INVITATION_EXPIRATION_TIME = config(
    "INVITATION_EXPIRATION_TIME", default="7d", cast=ms_to_timedelta
)

# Application definition
DJANGO_APPS = [
    "unfold",  # Must be before django.contrib.admin
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
]

LOCAL_APPS = [
    "apps.authentication",
    "apps.users",
    "apps.courses",
    "apps.classes",
    "apps.assessments",
    "apps.cohorts",
    "apps.invitations",
    "apps.communications",
    "apps.integrations",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database
DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL"),
        conn_max_age=60,
        conn_health_checks=True,
    )
}

# Custom User Model
AUTH_USER_MODEL = "users.User"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = config("TIME_ZONE", default="UTC")
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default storage settings, with the staticfiles storage updated.
# See https://docs.djangoproject.com/en/5.0/ref/settings/#std-setting-STORAGES
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}


# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# JWT Settings
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": config(
        "ACCESS_TOKEN_LIFETIME", default="1h", cast=ms_to_timedelta
    ),
    "REFRESH_TOKEN_LIFETIME": config(
        "REFRESH_TOKEN_LIFETIME", default="31d", cast=ms_to_timedelta
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

# Celery Configuration
REDIS_URL = config("REDIS_URL")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# Email Configuration
EMAIL_BACKEND = config(
    "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = config("EMAIL_HOST", default="")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@plsom.com")

# Zoom Integration
ZOOM_API_KEY = config("ZOOM_API_KEY", default="")
ZOOM_API_SECRET = config("ZOOM_API_SECRET", default="")
ZOOM_WEBHOOK_SECRET = config("ZOOM_WEBHOOK_SECRET", default="")

# API Documentation
SPECTACULAR_SETTINGS = {
    "TITLE": "PLSOM API",
    "DESCRIPTION": "Perfect Love School of Ministry LMS API",
    "VERSION": "0.0.1",
    "SERVE_INCLUDE_SCHEMA": False,
}

ADMIN_EMAIL = config("ADMIN_EMAIL", default="")
ADMIN_PASSWORD = config("ADMIN_PASSWORD", default="")
ADMIN_FIRST_NAME = config("ADMIN_FIRST_NAME", default="")
ADMIN_LAST_NAME = config("ADMIN_LAST_NAME", default="")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.handlers.TimedRotatingFileHandler",
            "filename": BASE_DIR / "logs" / "plsom.log",
            "formatter": "verbose",
            "when": "midnight",
            "interval": 1,
            "backupCount": 7,
        },
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
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


from .unfold import *  # noqa: E402, F403
