.ONESHELL:
.PHONY: help, install, dev-install, test, lint, format, clean, db-migrate, db-upgrade, db-seed, db-purge, run, shell, qcluster, requirements

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install production dependencies
	poetry install --only=main

dev-install: ## Install all dependencies including dev
	poetry install

test: ## Run tests
	poetry run python manage.py test

lint: ## Run linting
	poetry run ruff check apps config utils

format: ## Format code
	poetry run ruff format apps config utils
	poetry run ruff check --fix apps config utils

clean: ## Clean cache and build files
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache/
	rm -rf htmlcov/

requirements: ## Generate requirements.txt
	poetry run pip freeze > requirements.txt

db-migrate: ## Run database migrations
	poetry run python manage.py migrate

db-upgrade: ## Upgrade database schema
	poetry run python manage.py makemigrations
	poetry run python manage.py migrate

db-seed: ## Seed database with initial data
	poetry run python manage.py seed

db-purge: ## Purge database
	poetry run python manage.py flush

run: ## Run development server
	@echo "Running in $(DJANGO_ENV) environment"
	# use gunicorn for production
	if [ "$(DJANGO_ENV)" = "production" ]; then
		poetry run gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 4 --timeout 0
	else
		poetry run python manage.py runserver
	fi

shell: ## Open Django shell
	poetry run python manage.py shell

qcluster: ## Start Django Q2 worker
	poetry run python manage.py qcluster