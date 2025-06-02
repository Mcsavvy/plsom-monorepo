from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# CORS settings for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True

# Development-specific logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'plsom.log',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
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