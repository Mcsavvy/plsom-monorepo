from decouple import config

# Get environment setting
env = config("DJANGO_ENV", default="development")

if env == "production":
    from .production import *  # noqa: F403
else:
    from .development import *  # noqa: F403
