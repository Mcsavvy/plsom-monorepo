#!/bin/bash
set -e
# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create cache table
echo "Creating cache table..."
python manage.py createcachetable

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create default admin if needed
echo "Creating default admin..."
python manage.py createdefaultadmin

# Start the application
echo "Starting application..."
exec "$@"