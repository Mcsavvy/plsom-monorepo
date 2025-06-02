#!/bin/bash
set -e
# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Start the application
echo "Starting application..."
exec "$@"