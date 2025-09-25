from rest_framework import serializers
from .models import Test, Question, QuestionOption, Submission, Answer
from drf_spectacular.utils import extend_schema_field
from django.db import transaction


class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer for question options in choice-based questions."""

    class Meta:
        model = QuestionOption
        fields = ["id", "text", "order", "is_correct"]
        extra_kwargs = {
            "id": {"required": False},
            "order": {
                "read_only": True
            },  # Order will be determined by position in array
        }


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for test questions with nested options."""

    options = QuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            "id",
            "question_type",
            "title",
            "description",
            "is_required",
            "order",
            "max_file_size_mb",
            "allowed_file_types",
            "required_translation",
            "allow_multiple_verses",
            "min_word_count",
            "max_word_count",
            "text_max_length",
            "text_placeholder",
            "max_points",
            "options",
        ]
        extra_kwargs = {
            "id": {"required": False},
            "order": {
                "read_only": True
            },  # Order will be determined by position in array
        }

    def validate(self, attrs):
        """Validate question based on its type."""
        question_type = attrs.get("question_type")
        options = attrs.get("options", [])

        # Validate that choice questions have options
        if question_type in ["single_choice", "multiple_choice"]:
            if not options:
                raise serializers.ValidationError(
                    f"Questions of type '{question_type}' must have at least one option."
                )

        # Validate that non-choice questions don't have options
        elif options:
            raise serializers.ValidationError(
                f"Questions of type '{question_type}' should not have options."
            )

        return attrs


class TestSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for test management with nested questions."""

    questions = QuestionSerializer(many=True, required=False)
    total_questions = serializers.IntegerField(read_only=True)
    total_submissions = serializers.IntegerField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    breaking_changes_detected = serializers.BooleanField(
        read_only=True, default=False
    )
    graded_submissions_returned = serializers.IntegerField(
        read_only=True, default=0
    )
    available_from_timezone = serializers.CharField(
        write_only=True, required=False, default="UTC"
    )
    available_until_timezone = serializers.CharField(
        write_only=True, required=False, default="UTC"
    )

    class Meta:
        model = Test
        fields = [
            "id",
            "title",
            "description",
            "instructions",
            "course",
            "cohort",
            "created_by",
            "time_limit_minutes",
            "max_attempts",
            "allow_review_after_submission",
            "randomize_questions",
            "total_points",
            "status",
            "available_from",
            "available_until",
            "created_at",
            "updated_at",
            "questions",
            "total_questions",
            "total_submissions",
            "is_available",
            "course_name",
            "cohort_name",
            "available_from_timezone",
            "available_until_timezone",
            "breaking_changes_detected",
            "graded_submissions_returned",
        ]
        extra_kwargs = {
            "created_by": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }

    def validate(self, attrs):
        """Validate test data with timezone handling."""
        from django.utils import timezone
        import pytz  # type: ignore
        from datetime import datetime

        # Handle timezone conversion for available_from
        if "available_from" in attrs and "available_from_timezone" in attrs:
            available_from = attrs["available_from"]
            timezone_name = attrs["available_from_timezone"]

            if available_from and isinstance(available_from, str):
                try:
                    # If it's already a timezone-aware datetime, use it as is
                    if (
                        available_from.endswith("Z")
                        or "+" in available_from
                        or available_from.endswith("UTC")
                    ):
                        # Already timezone-aware, convert to UTC
                        dt = timezone.datetime.fromisoformat(
                            available_from.replace("Z", "+00:00")
                        )
                    else:
                        # Assume it's in the specified timezone
                        tz = pytz.timezone(timezone_name)
                        dt = datetime.fromisoformat(available_from)
                        dt = tz.localize(dt)

                    # Convert to UTC for storage
                    attrs["available_from"] = dt.astimezone(pytz.UTC)
                except (ValueError, pytz.exceptions.UnknownTimeZoneError) as e:
                    raise serializers.ValidationError(
                        f"Invalid timezone or datetime format for available_from: {str(e)}"
                    )

            # Remove timezone from attrs since it's not a model field
            del attrs["available_from_timezone"]

        # Handle timezone conversion for available_until
        if "available_until" in attrs and "available_until_timezone" in attrs:
            available_until = attrs["available_until"]
            timezone_name = attrs["available_until_timezone"]

            if available_until and isinstance(available_until, str):
                try:
                    # If it's already a timezone-aware datetime, use it as is
                    if (
                        available_until.endswith("Z")
                        or "+" in available_until
                        or available_until.endswith("UTC")
                    ):
                        # Already timezone-aware, convert to UTC
                        dt = timezone.datetime.fromisoformat(
                            available_until.replace("Z", "+00:00")
                        )
                    else:
                        # Assume it's in the specified timezone
                        tz = pytz.timezone(timezone_name)
                        dt = datetime.fromisoformat(available_until)
                        dt = tz.localize(dt)

                    # Convert to UTC for storage
                    attrs["available_until"] = dt.astimezone(pytz.UTC)
                except (ValueError, pytz.exceptions.UnknownTimeZoneError) as e:
                    raise serializers.ValidationError(
                        f"Invalid timezone or datetime format for available_until: {str(e)}"
                    )

            # Remove timezone from attrs since it's not a model field
            del attrs["available_until_timezone"]

        # Original validation logic
        available_from = attrs.get("available_from")
        available_until = attrs.get("available_until")

        if (
            available_from
            and available_until
            and available_from >= available_until
        ):
            raise serializers.ValidationError(
                "available_from must be before available_until"
            )

        return attrs

    def create(self, validated_data):
        """Create test with nested questions and options."""
        questions_data = validated_data.pop("questions", [])

        # Create the test
        test = Test.objects.create(**validated_data)

        # Create questions and options
        self._create_questions(test, questions_data)

        # Calculate total points
        test.calculate_total_points()

        return test

    def update(self, instance, validated_data):
        """Update test with breaking change detection and handling."""
        questions_data = validated_data.pop("questions", None)

        # Store previous state for notification logic
        instance._previous_status = instance.status
        instance._previous_deadline = instance.available_until
        instance._questions_updated = questions_data is not None

        # Update test fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle questions if provided
        if questions_data is not None:
            breaking_changes, graded_submissions_returned = (
                self._handle_question_updates_with_breaking_changes(
                    instance, questions_data
                )
            )
            # Recalculate total points after questions are updated
            instance.calculate_total_points()

            # Add breaking change info to the response
            instance.breaking_changes_detected = breaking_changes
            instance.graded_submissions_returned = graded_submissions_returned

        return instance

    def _create_questions(self, test, questions_data):
        """Create questions and their options for a test."""
        for order, question_data in enumerate(questions_data):
            options_data = question_data.pop("options", [])

            question = Question.objects.create(
                test=test, order=order, **question_data
            )

            # Create options for choice questions
            self._create_options(question, options_data)

    def _handle_question_updates_with_breaking_changes(
        self, test, questions_data
    ):
        """
        Handle question updates with breaking change detection.
        Returns (breaking_changes_detected, graded_submissions_returned_count)
        """
        breaking_changes = False
        graded_submissions_returned = 0

        # Check if test has any graded submissions
        graded_submissions = test.submissions.filter(status="graded")
        has_graded_submissions = graded_submissions.exists()

        if has_graded_submissions:
            # Detect breaking changes
            breaking_changes = self._detect_breaking_changes(
                test, questions_data
            )

            if breaking_changes:
                # Return graded submissions and create new question instances
                graded_submissions_returned = self._handle_breaking_changes(
                    test, questions_data, graded_submissions
                )
            else:
                # No breaking changes, use safe update
                self._safe_update_questions(test, questions_data)
        else:
            # No graded submissions, safe to use simple update
            self._update_questions_simple(test, questions_data)

        return breaking_changes, graded_submissions_returned

    def _detect_breaking_changes(self, test, questions_data):
        """
        Detect if the question changes constitute breaking changes.
        Breaking changes include:
        - New questions added
        - Question type changes
        - Question deletion
        - Option changes for questions with answers
        """
        existing_questions = {str(q.id): q for q in test.questions.all()}
        incoming_question_ids = {
            q.get("id") for q in questions_data if q.get("id")
        }

        # Check for deleted questions
        deleted_questions = (
            set(existing_questions.keys()) - incoming_question_ids
        )
        if deleted_questions:
            return True

        # Check for new questions
        new_questions = len(questions_data) - len(incoming_question_ids)
        if new_questions > 0:
            return True

        # Check for question type changes or option changes
        for question_data in questions_data:
            question_id = question_data.get("id")
            if question_id and question_id in existing_questions:
                existing_question = existing_questions[question_id]

                # Check for question type change
                if (
                    question_data.get("question_type")
                    != existing_question.question_type
                ):
                    return True

                # Check for option changes in questions with answers
                if existing_question.answers.exists():
                    options_data = question_data.get("options", [])
                    if self._has_option_changes(
                        existing_question, options_data
                    ):
                        return True

        return False

    def _has_option_changes(self, question, options_data):
        """Check if options have changed for a question."""
        existing_options = {str(opt.id): opt for opt in question.options.all()}
        incoming_option_ids = {
            opt.get("id") for opt in options_data if opt.get("id")
        }

        # Check for deleted options
        if set(existing_options.keys()) - incoming_option_ids:
            return True

        # Check for new options
        if len(options_data) != len(existing_options):
            return True

        # Check for text changes in existing options
        for option_data in options_data:
            option_id = option_data.get("id")
            if option_id and option_id in existing_options:
                existing_option = existing_options[option_id]
                if option_data.get("text") != existing_option.text:
                    return True

        return False

    def _handle_breaking_changes(
        self, test, questions_data, graded_submissions
    ):
        """
        Handle breaking changes by:
        1. Returning graded submissions
        2. Creating new question instances
        3. Updating references
        """
        with transaction.atomic():
            # Step 1: Return graded submissions
            graded_submissions_returned = self._return_graded_submissions(
                graded_submissions
            )

            # Step 2: Create new question instances and update references
            self._create_new_questions_and_update_references(
                test, questions_data
            )

            return graded_submissions_returned

    def _return_graded_submissions(self, graded_submissions):
        """Return graded submissions to 'returned' status."""
        count = 0
        for submission in graded_submissions:
            submission.status = "returned"
            submission.graded_by = None
            submission.graded_at = None
            submission.feedback = "Test has been updated with new questions. Please review and resubmit."
            submission.save()
            count += 1
        return count

    def _create_new_questions_and_update_references(self, test, questions_data):
        """
        Create new question instances and update all references to point to new instances.
        This preserves the data integrity while allowing breaking changes.
        """
        # Store mapping of old question IDs to new question instances
        question_mapping = {}
        option_mapping = {}

        # Step 1: Create new questions and options
        for order, question_data in enumerate(questions_data):
            options_data = question_data.pop("options", [])
            old_question_id = question_data.get("id")

            # Create new question (remove old ID to let Django generate new one)
            question_data.pop("id", None)
            new_question = Question.objects.create(
                test=test, order=order, **question_data
            )

            # Store mapping if this was an existing question
            if old_question_id:
                question_mapping[old_question_id] = new_question

            # Create new options and store mappings
            new_options = self._create_options_with_mapping(
                new_question, options_data
            )
            if old_question_id:
                option_mapping[old_question_id] = new_options

        # Step 2: Update all references to point to new instances
        self._update_references_to_new_instances(
            test, question_mapping, option_mapping
        )

        # Step 3: Clean up old questions and options (after references are updated)
        self._cleanup_old_instances(test, question_mapping.keys())

    def _create_options_with_mapping(self, question, options_data):
        """Create options and return mapping of old to new option IDs."""
        option_mapping = {}

        for order, option_data in enumerate(options_data):
            old_option_id = option_data.get("id")

            # Create new option (remove old ID to let Django generate new one)
            option_data.pop("id", None)
            new_option = QuestionOption.objects.create(
                question=question, order=order, **option_data
            )

            # Store mapping if this was an existing option
            if old_option_id:
                option_mapping[old_option_id] = new_option

        return option_mapping

    def _update_references_to_new_instances(
        self, test, question_mapping, option_mapping
    ):
        """Update all references from old instances to new instances."""
        # Update Answer references
        for old_question_id, new_question in question_mapping.items():
            # Update question references in answers
            Answer.objects.filter(question_id=old_question_id).update(
                question=new_question
            )

            # Update option references in answers
            if old_question_id in option_mapping:
                old_to_new_options = option_mapping[old_question_id]
                for old_option_id, new_option in old_to_new_options.items():
                    # Update selected_options in answers
                    answers = Answer.objects.filter(
                        question=new_question,
                        selected_options__id=old_option_id,
                    )
                    for answer in answers:
                        answer.selected_options.remove(old_option_id)
                        answer.selected_options.add(new_option)

    def _cleanup_old_instances(self, test, old_question_ids):
        """Clean up old question and option instances after references are updated."""
        # Delete old questions (this will cascade to old options)
        Question.objects.filter(id__in=old_question_ids).delete()

    def _safe_update_questions(self, test, questions_data):
        """Safely update questions, protecting existing answers from being deleted."""
        # Check if test has any submissions with answers
        has_submissions = test.submissions.filter(
            answers__isnull=False
        ).exists()

        if has_submissions:
            # Use safe update strategy to preserve existing answers
            self._update_questions_with_answer_protection(test, questions_data)
        else:
            # Use simple delete-and-recreate strategy for tests without submissions
            self._update_questions_simple(test, questions_data)

    def _update_questions_simple(self, test, questions_data):
        """Simple delete-and-recreate strategy for tests without submissions."""
        # Delete all existing questions and their options
        test.questions.all().delete()

        # Create fresh questions from the provided data
        for order, question_data in enumerate(questions_data):
            options_data = question_data.pop("options", [])

            # Preserve ID if provided from frontend, otherwise let Django generate UUID
            question_id = question_data.pop("id", None)

            # Create new question with preserved ID if provided
            if question_id:
                question = Question.objects.create(
                    id=question_id, test=test, order=order, **question_data
                )
            else:
                question = Question.objects.create(
                    test=test, order=order, **question_data
                )

            # Create options for this question
            self._create_options(question, options_data)

    def _update_questions_with_answer_protection(self, test, questions_data):
        """Careful update strategy that protects existing student answers."""
        # For tests with submissions (both draft and published), use conservative update
        # Get IDs of questions that should remain
        incoming_question_ids = {
            q.get("id") for q in questions_data if q.get("id") is not None
        }

        # Only delete questions that are not in the incoming data AND have no answers
        questions_to_delete = test.questions.exclude(
            id__in=incoming_question_ids
        ).filter(answers__isnull=True)
        questions_to_delete.delete()

        # Process each question in the order received
        for order, question_data in enumerate(questions_data):
            options_data = question_data.pop("options", [])
            question_id = question_data.get("id")

            if question_id:
                # Update existing question if it exists
                try:
                    question = test.questions.get(id=question_id)
                    # Only update safe fields
                    safe_fields = [
                        "title",
                        "max_points",
                        "description",
                        "is_required",
                        "min_word_count",
                        "max_word_count",
                        "text_max_length",
                        "text_placeholder",
                        "required_translation",
                        "allow_multiple_verses",
                        "max_file_size_mb",
                        "allowed_file_types",
                    ]
                    for field in safe_fields:
                        if field in question_data:
                            setattr(question, field, question_data[field])
                    question.order = order
                    question.save()

                    # Update options carefully
                    self._update_options_safe(question, options_data)

                except Question.DoesNotExist:
                    # Create new question if ID doesn't exist
                    question_data.pop("id", None)
                    question = Question.objects.create(
                        test=test, order=order, **question_data
                    )
                    self._create_options(question, options_data)
            else:
                # Create new question
                question = Question.objects.create(
                    test=test, order=order, **question_data
                )
                self._create_options(question, options_data)

    def _create_options(self, question, options_data):
        """Create options for a question, preserving IDs if provided."""
        for order, option_data in enumerate(options_data):
            # Preserve ID if provided from frontend, otherwise let Django generate UUID
            option_id = option_data.pop("id", None)

            if option_id:
                QuestionOption.objects.create(
                    id=option_id, question=question, order=order, **option_data
                )
            else:
                QuestionOption.objects.create(
                    question=question, order=order, **option_data
                )

    def _update_options(self, question, options_data):
        """Update options using simple delete-and-recreate strategy while preserving IDs."""
        # Delete all existing options
        question.options.all().delete()

        # Create fresh options using the same logic as _create_options
        self._create_options(question, options_data)

    def _update_options_safe(self, question, options_data):
        """Safely update options, only for questions that don't have critical answer dependencies."""
        # For questions that already have answers, be more conservative
        if question.answers.exists():
            # Only allow text updates for existing options, don't delete/recreate
            existing_options = {
                str(opt.id): opt for opt in question.options.all()
            }

            for order, option_data in enumerate(options_data):
                option_id = option_data.get("id")

                if option_id and str(option_id) in existing_options:
                    # Update existing option
                    option = existing_options[str(option_id)]
                    option.text = option_data.get("text", option.text)
                    option.order = order
                    option.save()
                # Don't create new options for questions with existing answers
                # This prevents breaking existing answer references
        else:
            # No answers exist, safe to recreate options
            self._update_options(question, options_data)


class TestListSerializer(serializers.ModelSerializer):
    """Simplified serializer for test list views."""

    total_questions = serializers.IntegerField(read_only=True)
    total_submissions = serializers.IntegerField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = Test
        fields = [
            "id",
            "title",
            "description",
            "status",
            "available_from",
            "available_until",
            "created_at",
            "updated_at",
            "total_questions",
            "total_submissions",
            "is_available",
            "course_name",
            "cohort_name",
            "created_by_name",
            "time_limit_minutes",
            "max_attempts",
            "total_points",
        ]


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for answers."""

    display_answer = serializers.CharField(read_only=True)
    has_answer = serializers.BooleanField(read_only=True)
    question_title = serializers.CharField(
        source="question.title", read_only=True
    )
    question_type = serializers.CharField(
        source="question.question_type", read_only=True
    )
    question_description = serializers.CharField(
        source="question.description", read_only=True
    )
    max_points = serializers.FloatField(
        source="question.max_points", read_only=True
    )

    class Meta:
        model = Answer
        fields = [
            "id",
            "question",
            "text_answer",
            "boolean_answer",
            "date_answer",
            "file_answer",
            "selected_options",
            "answered_at",
            "is_flagged",
            "points_earned",
            "max_points",
            "feedback",
            "display_answer",
            "has_answer",
            "question_title",
            "question_type",
            "question_description",
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for submissions with detailed answer information."""

    answers = AnswerSerializer(many=True, read_only=True)
    is_submitted = serializers.BooleanField(read_only=True)
    completion_percentage = serializers.FloatField(read_only=True)
    student_name = serializers.CharField(
        source="student.get_full_name", read_only=True
    )
    student_email = serializers.CharField(
        source="student.email", read_only=True
    )
    test_title = serializers.CharField(source="test.title", read_only=True)
    test_total_points = serializers.FloatField(
        source="test.total_points", read_only=True
    )
    graded_by_name = serializers.CharField(
        source="graded_by.get_full_name", read_only=True
    )

    class Meta:
        model = Submission
        fields = [
            "id",
            "test",
            "student",
            "attempt_number",
            "status",
            "started_at",
            "submitted_at",
            "time_spent_minutes",
            "score",
            "max_score",
            "graded_by",
            "graded_at",
            "feedback",
            "created_at",
            "updated_at",
            "answers",
            "is_submitted",
            "completion_percentage",
            "student_name",
            "student_email",
            "test_title",
            "test_total_points",
            "graded_by_name",
        ]
        extra_kwargs = {
            "student": {"read_only": True},
            "started_at": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
            "score": {"read_only": True},  # This is now a property
            "max_score": {"read_only": True},  # This is now a property
        }


class StudentTestSerializer(serializers.ModelSerializer):
    """Serializer for tests viewed by students with submission information"""

    course_name = serializers.CharField(source="course.name", read_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    my_submission = serializers.SerializerMethodField()
    my_latest_submission_id = serializers.SerializerMethodField()
    my_submission_status = serializers.SerializerMethodField()
    attempts_remaining = serializers.SerializerMethodField()
    can_attempt = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            "id",
            "title",
            "description",
            "instructions",
            "time_limit_minutes",
            "max_attempts",
            "allow_review_after_submission",
            "status",
            "available_from",
            "available_until",
            "is_available",
            "course_name",
            "cohort_name",
            "created_by_name",
            "total_questions",
            "my_submission",
            "my_latest_submission_id",
            "my_submission_status",
            "attempts_remaining",
            "can_attempt",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(SubmissionSerializer)
    def get_my_submission(self, obj):
        """Get student's latest submission for this test"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None

        latest_submission = (
            obj.submissions.filter(student=request.user)
            .order_by("-created_at")
            .first()
        )

        if latest_submission:
            return SubmissionSerializer(latest_submission).data
        return None

    @extend_schema_field(serializers.IntegerField)
    def get_my_latest_submission_id(self, obj):
        """Get the ID of student's latest submission"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None

        latest_submission = (
            obj.submissions.filter(student=request.user)
            .order_by("-created_at")
            .first()
        )
        return latest_submission.id if latest_submission else None

    @extend_schema_field(serializers.CharField)
    def get_my_submission_status(self, obj):
        """Get status of student's latest submission"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None

        latest_submission = (
            obj.submissions.filter(student=request.user)
            .order_by("-created_at")
            .first()
        )
        return latest_submission.status if latest_submission else None

    @extend_schema_field(serializers.IntegerField)
    def get_attempts_remaining(self, obj):
        """Get number of attempts remaining for this student"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return obj.max_attempts

        attempts_used = obj.submissions.filter(student=request.user).count()
        return max(0, obj.max_attempts - attempts_used)

    @extend_schema_field(serializers.BooleanField)
    def get_can_attempt(self, obj):
        """Check if student can start a new attempt"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return False

        # Check if test is available
        if not obj.is_available:
            return False

        # Check attempts remaining
        attempts_used = obj.submissions.filter(student=request.user).count()
        if attempts_used >= obj.max_attempts:
            return False

        # Check if there's an in-progress submission
        in_progress = obj.submissions.filter(
            student=request.user, status="in_progress"
        ).exists()

        return not in_progress


class StudentTestDetailSerializer(StudentTestSerializer):
    """Detailed serializer for individual test view by students, includes questions"""

    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(StudentTestSerializer.Meta):
        fields = StudentTestSerializer.Meta.fields + ["questions"]
