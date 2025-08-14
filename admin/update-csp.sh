#!/bin/bash

# Script to update Content Security Policy in nginx.conf
# Usage: ./update-csp.sh <api-domain>
# Example: ./update-csp.sh https://api.plsom.com

if [ $# -eq 0 ]; then
    echo "Usage: $0 <api-domain>"
    echo "Example: $0 https://api.plsom.com"
    exit 1
fi

API_DOMAIN=$1
CSP_PATTERN="connect-src 'self' https://api.plsom.com https://\*.plsom.com"
NEW_CSP="connect-src 'self' $API_DOMAIN"

echo "Updating CSP in nginx.conf..."
echo "Old pattern: $CSP_PATTERN"
echo "New pattern: $NEW_CSP"

# Create backup
cp nginx.conf nginx.conf.backup

# Update the CSP header
sed -i "s|$CSP_PATTERN|$NEW_CSP|g" nginx.conf

echo "Updated nginx.conf successfully!"
echo "Backup saved as nginx.conf.backup"

# Show the updated line
echo "Updated CSP line:"
grep "Content-Security-Policy" nginx.conf
