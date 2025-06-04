#!/bin/bash
set -e
# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create default admin if needed
echo "Creating default admin..."
python manage.py createdefaultadmin

# Start the application
echo "Starting application..."
exec "$@"