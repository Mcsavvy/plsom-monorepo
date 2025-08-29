from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db import transaction, models
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Test, Question, QuestionOption, Submission, Answer
from .serializers import (
    TestSerializer,
    TestListSerializer,
    SubmissionSerializer,
    StudentTestSerializer,
    StudentTestDetailSerializer,
)
from utils.permissions import IsLecturerOrAdmin, IsStudent


@extend_schema_view(
    list=extend_schema(
        description="List all tests with basic information",
        summary="List tests",
    ),
    create=extend_schema(
        description="Create a new test with questions and options",
        summary="Create test",
    ),
    retrieve=extend_schema(
        description="Get detailed test information including all questions and options",
        summary="Get test details",
    ),
    update=extend_schema(
        description="Update test with complex question management. Questions not included in the request will be deleted.",
        summary="Update test",
    ),
    partial_update=extend_schema(
        description="Partially update test fields. Questions will not be modified unless explicitly provided.",
        summary="Partially update test",
    ),
    destroy=extend_schema(
        description="Delete a test and all associated questions, options, and submissions",
        summary="Delete test",
    ),
)
@extend_schema(
    tags=["Tests"],
)
class TestViewSet(viewsets.ModelViewSet):
    """
    Comprehensive test management viewset.

    Handles CRUD operations for tests with complex nested question management:
    - Create tests with nested questions and options
    - Update tests with automatic question ordering and cleanup
    - Delete questions not included in update requests
    - Maintain question order based on array position
    """

    queryset = (
        Test.objects.select_related("course", "cohort", "created_by")
        .prefetch_related("questions__options")
        .all()
    )

    filter_backends = [SearchFilter, OrderingFilter]

    search_fields = ["title", "description", "course__name", "cohort__name"]
    ordering_fields = [
        "created_at",
        "updated_at",
        "title",
        "available_from",
        "available_until",
    ]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "list":
            return TestListSerializer
        elif self.action in ["my_tests", "my_test"]:
            return StudentTestSerializer
        return TestSerializer

    def get_permissions(self):
        """
        Set permissions based on action.
        Only admin and lecturers can create/update/delete tests.
        Students can only view published tests.
        """
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAuthenticated, IsLecturerOrAdmin]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter queryset based on user role."""
        queryset = super().get_queryset()

        # Students can only see published tests from their cohorts
        if self.request.user.role == "student":
            from apps.cohorts.models import Enrollment

            # Get cohorts the student is enrolled in
            enrolled_cohorts = Enrollment.objects.filter(
                student=self.request.user
            ).values_list("cohort_id", flat=True)

            queryset = queryset.filter(
                status="published", cohort_id__in=enrolled_cohorts
            )

        return queryset

    def perform_create(self, serializer):
        """Set the created_by field to the current user."""
        serializer.save(created_by=self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        """Handle complex test updates with question management."""
        serializer.save()

    @extend_schema(
        description="Duplicate an existing test with all its questions and options",
        summary="Duplicate test",
        responses={201: TestSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsLecturerOrAdmin],
    )
    def duplicate(self, request, pk=None):
        """Create a copy of an existing test."""
        original_test = self.get_object()

        with transaction.atomic():
            # Create new test
            new_test = Test.objects.create(
                title=f"{original_test.title} (Copy)",
                description=original_test.description,
                instructions=original_test.instructions,
                course=original_test.course,
                cohort=original_test.cohort,
                created_by=request.user,
                time_limit_minutes=original_test.time_limit_minutes,
                max_attempts=original_test.max_attempts,
                allow_review_after_submission=original_test.allow_review_after_submission,
                randomize_questions=original_test.randomize_questions,
                status="draft",  # Always create as draft
            )

            # Copy questions and options
            for question in original_test.questions.all():
                new_question = Question.objects.create(
                    test=new_test,
                    question_type=question.question_type,
                    title=question.title,
                    description=question.description,
                    is_required=question.is_required,
                    order=question.order,
                    max_file_size_mb=question.max_file_size_mb,
                    allowed_file_types=question.allowed_file_types,
                    required_translation=question.required_translation,
                    allow_multiple_verses=question.allow_multiple_verses,
                    min_word_count=question.min_word_count,
                    max_word_count=question.max_word_count,
                    text_max_length=question.text_max_length,
                    text_placeholder=question.text_placeholder,
                )

                # Copy options
                for option in question.options.all():
                    QuestionOption.objects.create(
                        question=new_question,
                        text=option.text,
                        order=option.order,
                        is_correct=option.is_correct,
                    )

        serializer = self.get_serializer(new_test)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        description="Publish a draft test, making it available to students",
        summary="Publish test",
        responses={200: TestSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsLecturerOrAdmin],
    )
    def publish(self, request, pk=None):
        """Publish a test."""
        test = self.get_object()

        if test.status != "draft":
            return Response(
                {"error": "Only draft tests can be published"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not test.questions.exists():
            return Response(
                {"error": "Cannot publish test without questions"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        test.status = "published"
        test.save()

        # Trigger notification
        from .signals import trigger_test_published_notification

        trigger_test_published_notification(test.id)

        serializer = self.get_serializer(test)
        return Response(serializer.data)

    @extend_schema(
        description="Archive a published test, making it unavailable to students",
        summary="Archive test",
        responses={200: TestSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsLecturerOrAdmin],
    )
    def archive(self, request, pk=None):
        """Archive a test."""
        test = self.get_object()

        if test.status != "published":
            return Response(
                {"error": "Only published tests can be archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        test.status = "archived"
        test.save()

        serializer = self.get_serializer(test)
        return Response(serializer.data)

    @extend_schema(
        description="Move a published or archived test back to draft status",
        summary="Unarchive test",
        responses={200: TestSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsLecturerOrAdmin],
    )
    def unarchive(self, request, pk=None):
        """Move a published or archived test back to draft status."""
        test = self.get_object()

        if test.status == "draft":
            return Response(
                {"error": "Test is already in draft status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Allow moving back to draft regardless of submissions
        # This gives flexibility while our conservative update logic protects existing data
        test.status = "draft"
        test.save()

        serializer = self.get_serializer(test)
        return Response(serializer.data)

    @extend_schema(
        description="Get tests available to the current student based on their enrolled cohorts with submission information",
        summary="Get my tests",
        responses={200: StudentTestSerializer(many=True)},
    )
    @action(
        detail=False,
        methods=["get"],
        url_path="my-tests",
        permission_classes=[IsAuthenticated, IsStudent],
        serializer_class=StudentTestSerializer,
    )
    def my_tests(self, request):
        """Get all available tests for the current student."""
        if request.user.role != "student":
            return Response(
                {"detail": "This endpoint is only available for students."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tests = self.get_queryset()

        # Apply additional filters
        course_id = request.query_params.get("course_id")
        if course_id:
            tests = tests.filter(course_id=course_id)

        cohort_id = request.query_params.get("cohort_id")
        if cohort_id:
            tests = tests.filter(cohort_id=cohort_id)

        # Filter by availability
        available_only = request.query_params.get("available_only")
        if available_only and available_only.lower() == "true":
            tests = tests.filter(status="published")
            # Additional filtering for time-based availability
            from django.utils import timezone

            now = timezone.now()
            tests = tests.filter(
                models.Q(available_from__isnull=True)
                | models.Q(available_from__lte=now)
            ).filter(
                models.Q(available_until__isnull=True)
                | models.Q(available_until__gte=now)
            )

        page = self.paginate_queryset(tests)
        if page is not None:
            serializer = StudentTestSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = StudentTestSerializer(
            tests, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @extend_schema(
        summary="Get test details for student",
        description="Get detailed information about a specific test for the current student, including submission status and questions.",
        responses={200: StudentTestDetailSerializer},
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="my-test",
        permission_classes=[IsAuthenticated, IsStudent],
        serializer_class=StudentTestDetailSerializer,
    )
    def my_test(self, request, pk=None):
        """
        Get detailed test information for the current student.
        Only available to students and only for published tests in their enrolled cohorts.
        """
        if request.user.role != "student":
            return Response(
                {"detail": "This endpoint is only available for students."},
                status=status.HTTP_403_FORBIDDEN,
            )

        test = self.get_object()

        # Check if student can access this test (must be published and in their enrolled cohorts)
        from apps.cohorts.models import Enrollment

        # Check if test is published
        if test.status != "published":
            return Response(
                {"detail": "This test is not available."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if student is enrolled in the test's cohort
        if not Enrollment.objects.filter(
            student=request.user, cohort=test.cohort
        ).exists():
            return Response(
                {"detail": "You don't have access to this test."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StudentTestDetailSerializer(test, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        description="Get basic statistics for a test",
        summary="Get test statistics",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "total_questions": {"type": "integer"},
                    "total_submissions": {"type": "integer"},
                    "completed_submissions": {"type": "integer"},
                    "average_completion_time": {"type": "number", "format": "float"},
                    "average_score": {"type": "number", "format": "float"},
                    "is_available": {"type": "boolean"},
                },
            }
        },
    )
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsLecturerOrAdmin],
    )
    def statistics(self, request, pk=None):
        """Get test statistics."""
        test = self.get_object()

        submissions = test.submissions.filter(status__in=["submitted", "graded"])

        stats = {
            "total_questions": test.total_questions,
            "total_submissions": test.total_submissions,
            "completed_submissions": submissions.count(),
            "average_completion_time": None,
            "average_score": None,
            "is_available": test.is_available,
        }

        if submissions.exists():
            # Calculate average completion time
            completed_submissions = submissions.exclude(time_spent_minutes__isnull=True)
            if completed_submissions.exists():
                avg_time = completed_submissions.aggregate(
                    avg=models.Avg("time_spent_minutes")
                )["avg"]
                stats["average_completion_time"] = float(avg_time) if avg_time else None

            # Calculate average score
            graded_submissions = submissions.filter(status__in=["graded", "returned"])
            if graded_submissions.exists():
                total_score = 0
                submission_count = 0
                
                for submission in graded_submissions:
                    if submission.score is not None:
                        total_score += submission.score
                        submission_count += 1
                
                if submission_count > 0:
                    stats["average_score"] = round(total_score / submission_count, 2)
                else:
                    stats["average_score"] = None
            else:
                stats["average_score"] = None

        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        description="List all submissions with filtering options",
        summary="List submissions",
    ),
    create=extend_schema(
        description="Create a new submission (start taking a test)",
        summary="Start test submission",
    ),
    retrieve=extend_schema(
        description="Get detailed submission information with all answers",
        summary="Get submission details",
    ),
    update=extend_schema(
        description="Update submission answers",
        summary="Update submission",
    ),
    destroy=extend_schema(
        description="Delete a submission (only allowed for drafts)",
        summary="Delete submission",
    ),
)
@extend_schema(
    tags=["Test Submissions"],
)
class SubmissionViewSet(viewsets.ModelViewSet):
    """
    Test submission management viewset.

    Handles student test submissions and grading by instructors.
    """

    queryset = (
        Submission.objects.select_related("test", "student", "graded_by")
        .prefetch_related("answers__question", "answers__selected_options")
        .all()
    )

    serializer_class = SubmissionSerializer
    filter_backends = [SearchFilter, OrderingFilter]

    search_fields = ["test__title", "student__first_name", "student__last_name"]
    ordering_fields = ["created_at", "submitted_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter submissions based on user role."""
        queryset = super().get_queryset()

        if self.request.user.role == "student":
            # Students can only see their own submissions
            queryset = queryset.filter(student=self.request.user)
            return queryset
        # staffs cannot see in-progress submissions
        queryset = queryset.exclude(status="in_progress")
        if self.request.user.role == "lecturer":
            # Lecturers can see submissions for tests they created
            # and tests created for their courses
            queryset = queryset.filter(
                test__created_by=self.request.user,
                test__course__lecturer=self.request.user,
            )

        return queryset

    def perform_create(self, serializer):
        """Create submission with proper validation."""
        test = serializer.validated_data["test"]

        # Check if test is available
        if not test.is_available:
            raise ValidationError("This test is not currently available")

        # Check if user has remaining attempts
        existing_attempts = Submission.objects.filter(
            test=test, student=self.request.user
        ).count()

        if existing_attempts >= test.max_attempts:
            raise ValidationError("Maximum attempts exceeded for this test")

        serializer.save(
            student=self.request.user,
            attempt_number=existing_attempts + 1,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    @extend_schema(
        description="Submit a test for grading",
        summary="Submit test",
        responses={200: SubmissionSerializer},
    )
    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """Submit a test for grading."""
        submission = self.get_object()

        if submission.student != request.user and request.user.role == "student":
            return Response(
                {"error": "You can only submit your own tests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if submission.status != "in_progress":
            return Response(
                {"error": "Only in-progress submissions can be submitted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission.status = "submitted"
        submission.submitted_at = timezone.now()

        # Calculate time spent if not already set
        if not submission.time_spent_minutes:
            time_diff = submission.submitted_at - submission.started_at
            submission.time_spent_minutes = int(time_diff.total_seconds() / 60)

        submission.save()

        serializer = self.get_serializer(submission)
        return Response(serializer.data)

    @extend_schema(
        description="Create or update answers for an in-progress submission. Accepts a list of answer payloads.",
        summary="Upsert answers",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "answers": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "question": {"type": "string", "format": "uuid"},
                                "text_answer": {"type": "string"},
                                "boolean_answer": {"type": "boolean"},
                                "date_answer": {"type": "string", "format": "date"},
                                "selected_options": {
                                    "type": "array",
                                    "items": {"type": "string", "format": "uuid"},
                                },
                            },
                            "required": ["question"],
                        },
                    }
                },
                "required": ["answers"],
            }
        },
        responses={200: SubmissionSerializer},
    )
    @action(detail=True, methods=["post"], url_path="answers")
    def upsert_answers(self, request, pk=None):
        """
        Upsert answers for a submission while it's in progress.

        Expected payload:
        {
          "answers": [
            {"question": "<uuid>", "text_answer": "..."},
            {"question": "<uuid>", "boolean_answer": true},
            {"question": "<uuid>", "date_answer": "2025-08-28"},
            {"question": "<uuid>", "selected_options": ["<uuid>"]}
          ]
        }
        """
        submission = self.get_object()

        # Only the owner (student) can modify their in-progress submission
        if request.user.role == "student" and submission.student != request.user:
            return Response(
                {"error": "You can only modify your own submission"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if submission.status != "in_progress":
            return Response(
                {"error": "Only in-progress submissions can be edited"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        answers_payload = request.data.get("answers", [])
        if not isinstance(answers_payload, list) or len(answers_payload) == 0:
            return Response(
                {"error": "'answers' must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cache questions for this test for quick lookup
        questions_by_id = {str(q.id): q for q in submission.test.questions.all()}

        # Process each answer in a transaction
        with transaction.atomic():
            for item in answers_payload:
                question_id = str(item.get("question"))
                if not question_id or question_id not in questions_by_id:
                    raise ValidationError("Invalid question specified")

                question = questions_by_id[question_id]

                # Get or create the Answer object
                answer, _created = Answer.objects.get_or_create(
                    submission=submission, question=question
                )

                # Clear all answer fields first
                answer.text_answer = ""
                answer.boolean_answer = None
                answer.date_answer = None
                answer.file_answer = None

                # Update based on question type
                qtype = question.question_type
                if qtype in [
                    "text",
                    "essay",
                    "reflection",
                    "ministry_plan",
                    "theological_position",
                    "case_study",
                    "sermon_outline",
                    "scripture_reference",
                ]:
                    answer.text_answer = item.get("text_answer", "") or ""
                elif qtype == "yes_no":
                    # Accept explicit boolean or null to clear
                    if "boolean_answer" in item:
                        answer.boolean_answer = item.get("boolean_answer")
                elif qtype == "document_upload":
                    # File uploads should be handled via a dedicated upload endpoint
                    # Keep as is; no update here from JSON-only payload
                    pass
                elif qtype in ["single_choice", "multiple_choice"]:
                    option_ids = item.get("selected_options", []) or []
                    # Validate options belong to this question
                    valid_options = list(
                        question.options.filter(id__in=option_ids).values_list(
                            "id", flat=True
                        )
                    )
                    if qtype == "single_choice" and len(valid_options) > 1:
                        raise ValidationError(
                            f"Question {question.id} expects a single option"
                        )
                    # Defer setting M2M until after saving
                    answer.save()
                    answer.selected_options.set(valid_options)
                    continue  # Skip final save below since we already saved
                else:
                    # Unknown type; skip safely
                    pass

                answer.save()

        serializer = self.get_serializer(submission)
        return Response(serializer.data)

    @extend_schema(
        description="Upload a document for a document_upload question in an in-progress submission",
        summary="Upload document",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "format": "uuid"},
                    "file": {"type": "string", "format": "binary"},
                },
                "required": ["question", "file"],
            }
        },
        responses={200: SubmissionSerializer},
    )
    @action(detail=True, methods=["post"], url_path="upload")
    def upload_document(self, request, pk=None):
        """
        Upload a document for a document_upload question.

        Expected multipart form data:
        - question: UUID of the document_upload question
        - file: The file to upload
        """
        submission = self.get_object()

        # Only the owner (student) can upload documents
        if request.user.role == "student" and submission.student != request.user:
            return Response(
                {"error": "You can only upload documents to your own submission"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if submission.status != "in_progress":
            return Response(
                {"error": "Documents can only be uploaded to in-progress submissions"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        question_id = request.data.get("question")
        uploaded_file = request.FILES.get("file")

        if not question_id:
            return Response(
                {"error": "question field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not uploaded_file:
            return Response(
                {"error": "file field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question = submission.test.questions.get(id=question_id)
        except Question.DoesNotExist:
            return Response(
                {"error": "Question not found in this test"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if question.question_type != "document_upload":
            return Response(
                {"error": "This question does not accept file uploads"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size
        if question.max_file_size_mb:
            max_size_bytes = question.max_file_size_mb * 1024 * 1024
            if uploaded_file.size > max_size_bytes:
                return Response(
                    {
                        "error": f"File size exceeds maximum allowed size of {question.max_file_size_mb}MB"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Validate file type if restrictions are set
        if question.allowed_file_types:
            allowed_extensions = [
                ext.strip().lower()
                for ext in question.allowed_file_types.split(",")
                if ext.strip()
            ]

            file_extension = uploaded_file.name.split(".")[-1].lower()
            if file_extension not in allowed_extensions:
                return Response(
                    {
                        "error": f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Get or create the answer and save the file
        answer, created = Answer.objects.get_or_create(
            submission=submission, question=question
        )

        # Clear other answer fields
        answer.text_answer = ""
        answer.boolean_answer = None
        answer.date_answer = None
        answer.selected_options.clear()

        # Save the file
        answer.file_answer = uploaded_file
        answer.save()

        serializer = self.get_serializer(submission)
        return Response(serializer.data)

    @extend_schema(
        description="Delete an uploaded document for a document_upload question in an in-progress submission",
        summary="Delete document",
        request={
            "application/json": {
                "type": "object",
                "properties": {"question": {"type": "string", "format": "uuid"}},
                "required": ["question"],
            }
        },
        responses={200: SubmissionSerializer},
    )
    @action(detail=True, methods=["delete"], url_path="delete-document")
    def delete_document(self, request, pk=None):
        """
        Delete an uploaded document for a document_upload question.

        Expected JSON payload:
        {
          "question": "uuid-of-document-upload-question"
        }
        """
        submission = self.get_object()

        # Only the owner (student) can delete documents
        if request.user.role == "student" and submission.student != request.user:
            return Response(
                {"error": "You can only delete documents from your own submission"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if submission.status != "in_progress":
            return Response(
                {"error": "Documents can only be deleted from in-progress submissions"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        question_id = request.data.get("question")

        if not question_id:
            return Response(
                {"error": "question field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question = submission.test.questions.get(id=question_id)
        except Question.DoesNotExist:
            return Response(
                {"error": "Question not found in this test"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if question.question_type != "document_upload":
            return Response(
                {"error": "This question does not accept file uploads"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the answer for this question
        try:
            answer = submission.answers.get(question=question)
        except Answer.DoesNotExist:
            return Response(
                {"error": "No answer found for this question"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if there's actually a file to delete
        if not answer.file_answer:
            return Response(
                {"error": "No file uploaded for this question"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete the file and clear the field
        answer.file_answer.delete(save=False)  # Delete the file from storage
        answer.file_answer = None
        answer.save()

        serializer = self.get_serializer(submission)
        return Response(serializer.data)

    @extend_schema(
        description="Grade a submission with individual answer scores and feedback (staff only)",
        summary="Grade submission",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "answers": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "answer_id": {"type": "string", "format": "uuid"},
                                "points_earned": {"type": "number", "format": "float"},
                                "feedback": {"type": "string"},
                                "is_flagged": {"type": "boolean"},
                            },
                            "required": ["answer_id", "points_earned"],
                        },
                    },
                    "feedback": {"type": "string"},
                    "return": {"type": "boolean"},
                },
                "required": ["answers"],
            }
        },
        responses={200: SubmissionSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="grade",
        permission_classes=[IsAuthenticated, IsLecturerOrAdmin],
    )
    def grade_submission(self, request, pk=None):
        """
        Grade a submission with individual answer scores and feedback.
        Only available to staff (lecturers and admins).
        """
        submission = self.get_object()

        # Check if submission is ready for grading
        if submission.status not in ["submitted", "returned", "graded"]:
            return Response(
                {"error": "Only submitted or returned submissions can be graded"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        answers_data = request.data.get("answers", [])
        general_feedback = request.data.get("feedback", "")
        return_submission = request.data.get("return", False)
        if not isinstance(answers_data, list):
            return Response(
                {"error": "'answers' must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Process grading in a transaction
        with transaction.atomic():
            for answer_data in answers_data:
                answer_id = answer_data.get("answer_id")
                points_earned = answer_data.get("points_earned")
                feedback = answer_data.get("feedback", "")
                is_flagged = answer_data.get("is_flagged", False)

                if not answer_id:
                    raise ValidationError("answer_id is required for each answer")

                try:
                    answer = submission.answers.get(id=answer_id)
                except Answer.DoesNotExist:
                    raise ValidationError(f"Answer with id {answer_id} not found")

                # Validate points earned
                if points_earned is None:
                    raise ValidationError("points_earned is required for each answer")

                if points_earned < 0:
                    raise ValidationError("points_earned cannot be negative")

                if (
                    answer.question.max_points
                    and points_earned > answer.question.max_points
                ):
                    raise ValidationError(
                        f"points_earned cannot exceed max_points ({answer.question.max_points})"
                    )

                # Update answer
                answer.points_earned = points_earned
                answer.feedback = feedback
                answer.is_flagged = is_flagged
                answer.save()

            # Update submission
            submission.feedback = general_feedback
            submission.graded_by = request.user
            submission.graded_at = timezone.now()
            submission.status = "graded"
            if return_submission:
                submission.status = "returned"
            submission.save()

        serializer = SubmissionSerializer(submission)
        return Response(serializer.data)
