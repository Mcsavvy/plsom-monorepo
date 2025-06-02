#!/bin/bash
# manage.sh - Script to manage Django environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 [COMMAND] [ENVIRONMENT]"
    echo ""
    echo "Commands:"
    echo "  set [env]        Set Django environment (development, production)"
    echo "  show             Show current environment"
    echo "  makemigrations [env]    Run migrations for specific environment"
    echo "  migrate [env]    Run migrations for specific environment"
    echo "  runserver [env]  Run development server with specific environment"
    echo "  shell [env]      Open Django shell with specific environment"
    echo "  test [env]       Run tests with specific environment"
    echo "  celery [env]     Start Celery worker with specific environment"
    echo ""
    echo "Environments:"
    echo "  development      Development environment (default)"
    echo "  production       Production environment"
    exit 1
}

# Function to set environment
set_env() {
    local env=$1
    
    if [[ ! "$env" =~ ^(development|production)$ ]]; then
        echo -e "${RED}Error: Invalid environment. Use: development, production${NC}"
        exit 1
    fi
    
    export DJANGO_ENV=$env
    echo -e "${GREEN}Environment set to: $env${NC}"
    
    # Check if env file exists
    if [ ! -f ".env.$env" ]; then
        echo -e "${YELLOW}Warning: .env.$env file not found${NC}"
        echo "Create it from .env.example if needed"
    fi
}

# Function to show current environment
show_env() {
    local current_env=${DJANGO_ENV:-development}
    echo -e "${GREEN}Current Django environment: $current_env${NC}"
    
    if [ -f ".env.$current_env" ]; then
        echo -e "${GREEN}Environment file: .env.$current_env exists${NC}"
    else
        echo -e "${YELLOW}Warning: .env.$current_env file not found${NC}"
    fi
}

# Function to make migrations
run_makemigrations() {
    local env=${1:-development}
    set_env $env
    echo -e "${GREEN}Running migrations for $env environment...${NC}"
    poetry run python manage.py makemigrations
}

# Function to run migrations
run_migrate() {
    local env=${1:-development}
    set_env $env
    echo -e "${GREEN}Running migrations for $env environment...${NC}"
    poetry run python manage.py migrate
}

# Function to run development server
run_server() {
    local env=${1:-development}
    set_env $env
    echo -e "${GREEN}Starting development server for $env environment...${NC}"
    poetry run python manage.py runserver
}

# Function to open Django shell
run_shell() {
    local env=${1:-development}
    set_env $env
    echo -e "${GREEN}Opening Django shell for $env environment...${NC}"
    poetry run python manage.py shell
}

# Function to run tests
run_tests() {
    local env=${1:-development}
    set_env $env
    echo -e "${GREEN}Running tests for $env environment...${NC}"
    poetry run python manage.py test
}

# Function to start Celery worker
run_celery() {
    local env=${1:-development}
    set_env $env
    echo -e "${GREEN}Starting Celery worker for $env environment...${NC}"
    celery -A config worker --loglevel=info
}

# Main script logic
case "${1:-}" in
    "set")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Environment required${NC}"
            usage
        fi
        set_env $2
        ;;
    "show")
        show_env
        ;;
    "makemigrations")
        run_makemigrations $2
        ;;
    "migrate")
        run_migrate $2
        ;;
    "runserver")
        run_server $2
        ;;
    "shell")
        run_shell $2
        ;;
    "test")
        run_tests $2
        ;;
    "celery")
        run_celery $2
        ;;
    *)
        usage
        ;;
esac