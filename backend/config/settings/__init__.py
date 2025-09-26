from decouple import config
from . import base  # noqa: F403, F401

# Get environment setting
env = config("DJANGO_ENV", default="development")

if env == "production":
    from .production import *  # noqa: F403
elif env == "test":
    from .test import *  # noqa: F403
else:
    from .development import *  # noqa: F403
