import json
import os
from datetime import datetime, date
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.cohorts.models import Cohort, Enrollment
from apps.courses.models import Course
from apps.classes.models import Class
from apps.invitations.models import Invitation
from apps.assessments.models import Test, Question, QuestionOption

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with development data from JSON files"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding",
        )
        parser.add_argument(
            "--files",
            nargs="+",
            help="Specific files to seed (without .json extension)",
            choices=[
                "users",
                "cohorts",
                "enrollments",
                "courses",
                "classes",
                "invitations",
                "tests",
                "questions",
                "question_options",
            ],
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            self.stdout.write(
                self.style.ERROR(
                    "This command can only be run in DEBUG mode (development)"
                )
            )
            return

        seed_dir = os.path.join(settings.BASE_DIR, "seed")
        if not os.path.exists(seed_dir):
            self.stdout.write(
                self.style.ERROR(f"Seed directory not found: {seed_dir}")
            )
            return

        # Define the order of seeding to respect foreign key dependencies
        seed_order = [
            "users",
            "cohorts",
            "enrollments",
            "courses",
            "classes",
            "invitations",
            "tests",
            "questions",
            "question_options",
        ]

        # Filter files if specified
        if options["files"]:
            seed_order = [f for f in seed_order if f in options["files"]]

        if options["clear"]:
            self.clear_data()

        with transaction.atomic():
            for filename in seed_order:
                file_path = os.path.join(seed_dir, f"{filename}.json")
                if os.path.exists(file_path):
                    self.seed_from_file(file_path, filename)
                else:
                    self.stdout.write(
                        self.style.WARNING(f"File not found: {file_path}")
                    )

        self.stdout.write(
            self.style.SUCCESS("Successfully seeded development data!")
        )

    def clear_data(self):
        """Clear existing data in reverse dependency order"""
        self.stdout.write("Clearing existing data...")

        # Clear in reverse order to respect foreign key constraints
        QuestionOption.objects.all().delete()
        Question.objects.all().delete()
        Test.objects.all().delete()
        Invitation.objects.all().delete()
        Class.objects.all().delete()
        Course.objects.all().delete()
        Enrollment.objects.all().delete()
        Cohort.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()  # Keep superusers

        self.stdout.write(self.style.SUCCESS("Data cleared successfully"))

    def seed_from_file(self, file_path, filename):
        """Seed data from a JSON file"""
        self.stdout.write(f"Seeding from {filename}.json...")

        try:
            with open(file_path, "r", encoding="utf-8") as file:
                data = json.load(file)

            for item in data:
                self.create_object(item, filename)

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully seeded {len(data)} items from {filename}.json"
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error seeding {filename}.json: {str(e)}")
            )
            raise

    def create_object(self, item, filename):
        """Create a single object from JSON data"""
        model_name = item["model"]
        pk = item["pk"]
        fields = item["fields"]

        # Parse datetime and date fields
        fields = self.parse_datetime_fields(fields, model_name)
        fields["pk"] = pk

        try:
            if model_name == "users.user":
                self.create_user(pk, fields)
            elif model_name == "cohorts.cohort":
                self.create_cohort(pk, fields)
            elif model_name == "cohorts.enrollment":
                self.create_enrollment(pk, fields)
            elif model_name == "courses.course":
                self.create_course(pk, fields)
            elif model_name == "classes.class":
                self.create_class(pk, fields)
            elif model_name == "invitations.invitation":
                self.create_invitation(pk, fields)
            elif model_name == "assessments.test":
                self.create_test(pk, fields)
            elif model_name == "assessments.question":
                self.create_question(pk, fields)
            elif model_name == "assessments.questionoption":
                self.create_question_option(pk, fields)
            else:
                self.stdout.write(
                    self.style.WARNING(f"Unknown model: {model_name}")
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f"Error creating {model_name} with pk {pk}: {str(e)}"
                )
            )
            raise

    def parse_datetime_fields(self, fields, model_name):
        """Parse datetime and date fields from JSON strings to Python objects"""
        # Define datetime fields for each model
        datetime_fields = {
            "users.user": ["date_joined", "last_login"],
            "cohorts.cohort": ["start_date", "end_date"],
            "cohorts.enrollment": ["enrolled_at", "end_date"],
            "courses.course": ["created_at", "updated_at"],
            "classes.class": ["scheduled_at"],
            "invitations.invitation": ["expires_at", "used_at", "created_at"],
            "assessments.test": [
                "available_from",
                "available_until",
                "created_at",
                "updated_at",
            ],
        }

        # Get datetime fields for this model
        model_datetime_fields = datetime_fields.get(model_name, [])

        for field_name in model_datetime_fields:
            if field_name in fields and fields[field_name] is not None:
                try:
                    # Handle different date formats
                    value = fields[field_name]

                    # Skip if already None
                    if value is None:
                        continue

                    # Handle date fields (no time component)
                    if field_name in ["start_date", "end_date"]:
                        if isinstance(value, str):
                            # Parse date string (YYYY-MM-DD format)
                            fields[field_name] = datetime.strptime(
                                value, "%Y-%m-%d"
                            ).date()
                        elif isinstance(value, datetime):
                            fields[field_name] = value.date()
                        elif isinstance(value, date):
                            fields[field_name] = value
                    else:
                        # Handle datetime fields
                        if isinstance(value, str):
                            # Parse ISO format datetime string
                            if value.endswith("Z"):
                                # Handle UTC timezone indicator
                                value = value[:-1] + "+00:00"
                            fields[field_name] = datetime.fromisoformat(
                                value.replace("Z", "+00:00")
                            )
                        elif isinstance(value, datetime):
                            fields[field_name] = value
                        elif isinstance(value, date):
                            # Convert date to datetime at midnight
                            fields[field_name] = datetime.combine(
                                value, datetime.min.time()
                            )

                except (ValueError, TypeError) as e:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Could not parse datetime field {field_name} with value {fields[field_name]}: {str(e)}"
                        )
                    )
                    # Keep original value if parsing fails
                    continue

        return fields

    def create_user(self, pk, fields):
        """Create a user with proper password hashing"""
        password = fields.pop("password")
        user, created = User.objects.get_or_create(pk=pk, defaults=fields)
        if created:
            user.set_password(password)  # This will hash the password
            user.save()
        return user

    def create_cohort(self, pk, fields):
        cohort, created = Cohort.objects.get_or_create(pk=pk, defaults=fields)
        return cohort

    def create_enrollment(self, pk, fields):
        # Convert foreign key references
        fields["student"] = User.objects.get(pk=fields["student"])
        fields["cohort"] = Cohort.objects.get(pk=fields["cohort"])

        enrollment, created = Enrollment.objects.get_or_create(
            pk=pk, defaults=fields
        )
        return enrollment

    def create_course(self, pk, fields):
        # Convert foreign key reference
        if fields.get("lecturer"):
            fields["lecturer"] = User.objects.get(pk=fields["lecturer"])

        course, created = Course.objects.get_or_create(pk=pk, defaults=fields)
        return course

    def create_class(self, pk, fields):
        # Convert foreign key references
        fields["course"] = Course.objects.get(pk=fields["course"])
        fields["lecturer"] = User.objects.get(pk=fields["lecturer"])
        fields["cohort"] = Cohort.objects.get(pk=fields["cohort"])

        class_obj, created = Class.objects.get_or_create(pk=pk, defaults=fields)
        return class_obj

    def create_invitation(self, pk, fields):
        # Convert foreign key references
        fields["created_by"] = User.objects.get(pk=fields["created_by"])
        if fields.get("cohort"):
            fields["cohort"] = Cohort.objects.get(pk=fields["cohort"])

        invitation, created = Invitation.objects.get_or_create(
            pk=pk, defaults=fields
        )
        return invitation

    def create_test(self, pk, fields):
        # Convert foreign key references
        fields["course"] = Course.objects.get(pk=fields["course"])
        fields["cohort"] = Cohort.objects.get(pk=fields["cohort"])
        fields["created_by"] = User.objects.get(pk=fields["created_by"])

        test, created = Test.objects.get_or_create(pk=pk, defaults=fields)
        return test

    def create_question(self, pk, fields):
        # Convert foreign key reference
        fields["test"] = Test.objects.get(pk=fields["test"])

        question, created = Question.objects.get_or_create(
            pk=pk, defaults=fields
        )
        return question

    def create_question_option(self, pk, fields):
        # Convert foreign key reference
        fields["question"] = Question.objects.get(pk=fields["question"])

        option, created = QuestionOption.objects.get_or_create(
            pk=pk, defaults=fields
        )
        return option
