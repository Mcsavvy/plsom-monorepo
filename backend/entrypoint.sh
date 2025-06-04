#!/bin/bash
set -e
# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create default admin if needed
echo "Creating default admin..."
python manage.py createdefaultadmin

# Ensure appuser owns the logs and staticfiles directories
chown -R appuser:appuser /app/logs /app/staticfiles 2>/dev/null || true

# Start the application
echo "Starting application..."
exec "$@"