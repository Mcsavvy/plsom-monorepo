# Perfect Love School of Ministry (PLSOM) LMS Backend

## Overview

PLSOM LMS is a comprehensive Learning Management System designed for the Perfect Love School of Ministry. It digitizes ministry training programs, supporting role-based access for administrators, lecturers, and students. The platform enables course management, live classes (with Zoom integration), assessments, student tracking, and robust communication features.

---

## Features

- **Role-Based Access Control (RBAC):** Admin, Lecturer, and Student roles with tailored permissions.
- **User Management & Invite System:** Admin-initiated onboarding, expiring email invitations, automatic cohort assignment, and password reset workflows.
- **Cohort Management:** Single active cohort per program type, cohort-based grouping, and enrollment tracking.
- **Course & Curriculum Management:** Hierarchical structure (Programs → Courses → Classes/Tests), with Certificate and Diploma programs.
- **Class Management:** Live class scheduling, Zoom integration, attendance tracking, and class recordings.
- **Assessment System:** Dynamic form builder for tests, multiple question types, file uploads, grading, and submission tracking.
- **Communication:** Email and WhatsApp integration for notifications and direct messaging.
- **File Management:** Secure uploads for tests and course materials, recording storage and streaming.
- **Analytics:** User engagement, attendance, assessment performance, and system usage reports.

---

## Tech Stack

- **Backend:** Python 3.12, Django 5.2, Django REST Framework
- **Task Queue:** Celery with Redis
- **Database:** PostgreSQL
- **Authentication:** JWT (djangorestframework-simplejwt)
- **File Storage:** (Pluggable, e.g., AWS S3, Google Cloud, Backblaze B2)
- **Email:** SMTP (configurable)
- **Containerization:** Docker, Docker Compose
- **Dependency Management:** Poetry

---

## Project Structure

- `apps/` — Modular Django apps (users, courses, classes, assessments, cohorts, invitations, communications, integrations, authentication)
- `config/` — Django project configuration and settings
- `manage.py` — Django management script
- `Dockerfile`, `docker-compose.yml` — Containerization setup
- `pyproject.toml`, `poetry.lock` — Python dependencies

---

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- [Poetry](https://python-poetry.org/) (for local development outside Docker)

### Setup (Docker Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Configure Environment Variables:**
   - Copy and adapt `.env.example` (if available) or set the following variables in your environment:
     - `DJANGO_ENV` (e.g., development, production)
     - `DATABASE_URL` (PostgreSQL connection string)
     - `SECRET_KEY` (Django secret key)
     - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (SMTP settings)
     - `REDIS_URL` (for Celery)
     - `ZOOM_API_KEY`, `ZOOM_API_SECRET` (for Zoom integration)
     - Storage provider credentials (e.g., AWS, Backblaze B2)

3. **Build and Start Services:**
   ```bash
   docker-compose up --build
   ```
   - The API will be available at `http://localhost:8000`

4. **Apply Migrations & Create Superuser:**
   In a new terminal:
   ```bash
   docker-compose exec api poetry run python manage.py migrate
   docker-compose exec api poetry run python manage.py createsuperuser
   ```

5. **(Optional) Run Celery Worker:**
   Celery is already included in `docker-compose.yml` and will start automatically.

### Local Development (without Docker)

1. Install dependencies:
   ```bash
   poetry install
   ```
2. Set up your `.env` file as above.
3. Run migrations and start the server:
   ```bash
   poetry run python manage.py migrate
   poetry run python manage.py runserver
   ```

---

## Usage

- Access the admin panel at `/admin/`.
- Use the API for user, course, class, assessment, and cohort management.
- Invite users, assign roles, and manage cohorts via the admin or API.
- Schedule and manage live classes with Zoom integration.
- Track attendance, manage assessments, and communicate via email/WhatsApp.

---

## Testing

To run tests:
```bash
poetry run python manage.py test
```

## Contact

For questions or support, contact the maintainer: Dave Mcsavvy <davemcsavvii@gmail.com> 