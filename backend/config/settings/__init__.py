import os
from decouple import config

# Get environment setting
env = config('DJANGO_ENV', default='development')

if env == 'production':
    from .production import *
else:
    from .development import *