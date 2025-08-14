from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db import transaction, models
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Test, Question, QuestionOption, Submission
from .serializers import TestSerializer, TestListSerializer, SubmissionSerializer
from utils.permissions import IsLecturerOrAdmin


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
            queryset = queryset.filter(
                status="published", cohort__students=self.request.user
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
        responses={200: TestSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsLecturerOrAdmin])
    def unarchive(self, request, pk=None):
        """Move a published or archived test back to draft status."""
        test = self.get_object()
        
        if test.status == 'draft':
            return Response(
                {'error': 'Test is already in draft status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Allow moving back to draft regardless of submissions
        # This gives flexibility while our conservative update logic protects existing data
        test.status = 'draft'
        test.save()
        
        serializer = self.get_serializer(test)
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
            graded_submissions = submissions.exclude(score__isnull=True)
            if graded_submissions.exists():
                avg_score = graded_submissions.aggregate(avg=models.Avg("score"))["avg"]
                stats["average_score"] = float(avg_score) if avg_score else None

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
    ordering_fields = ["created_at", "submitted_at", "score"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter submissions based on user role."""
        queryset = super().get_queryset()

        if self.request.user.role == "student":
            # Students can only see their own submissions
            queryset = queryset.filter(student=self.request.user)
        elif self.request.user.role == "lecturer":
            # Lecturers can see submissions for tests they created
            queryset = queryset.filter(test__created_by=self.request.user)

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
