from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from django.core.exceptions import ValidationError

from apps.users.models import User
from apps.courses.models import Course
from apps.cohorts.models import Cohort


class Test(models.Model):
    """
    A test/assessment that belongs to a specific cohort and course.
    Functions like a form with multiple questions of different types.
    """

    SUBMISSION_STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructions = models.TextField(
        blank=True, help_text="Instructions for students taking the test"
    )

    # Relationships
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="tests")
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name="tests")
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tests_created",
        limit_choices_to={"role__in": ["admin", "lecturer"]},
    )

    # Test settings
    time_limit_minutes = models.PositiveIntegerField(
        null=True, blank=True, help_text="Time limit in minutes (optional)"
    )
    max_attempts = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Maximum number of attempts allowed",
    )
    allow_review_after_submission = models.BooleanField(
        default=True,
        help_text="Allow students to review their answers after submission",
    )
    randomize_questions = models.BooleanField(
        default=False, help_text="Randomize question order for each student"
    )

    # Grading settings
    total_points = models.FloatField(
        default=0.0, help_text="Total possible points for this test"
    )

    # Status and dates
    status = models.CharField(
        max_length=20, choices=SUBMISSION_STATUS_CHOICES, default="draft"
    )
    available_from = models.DateTimeField(
        null=True, blank=True, help_text="When the test becomes available to students"
    )
    available_until = models.DateTimeField(
        null=True, blank=True, help_text="When the test is no longer available"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["title", "course", "cohort"],
                name="unique_test_title_course_cohort",
            )
        ]

    def __str__(self):
        return f"{self.title} - {self.course.name} ({self.cohort.name})"

    @property
    def is_available(self):
        """Check if test is currently available for submission"""
        now = timezone.now()
        if self.status != "published":
            return False
        if self.available_from and now < self.available_from:
            return False
        if self.available_until and now > self.available_until:
            return False
        return True

    @property
    def total_questions(self):
        """Get total number of questions in this test"""
        return self.questions.count()

    @property
    def total_submissions(self):
        """Get total number of submissions for this test"""
        return self.submissions.count()

    def calculate_total_points(self):
        """Calculate total points from all questions"""
        total = sum(question.max_points or 0 for question in self.questions.all())
        self.total_points = total
        self.save(update_fields=['total_points'])
        return total

    def has_graded_submissions(self):
        """Check if this test has any graded submissions"""
        return self.submissions.filter(status="graded").exists()

    def get_graded_submissions_count(self):
        """Get the count of graded submissions for this test"""
        return self.submissions.filter(status="graded").count()

    def get_questions_with_answers(self):
        """Get questions that have student answers"""
        return self.questions.filter(answers__isnull=False).distinct()


class Question(models.Model):
    """
    Individual questions within a test. Supports various question types.
    """

    QUESTION_TYPES = [
        ("text", "Short Answer"),
        ("essay", "Essay/Long Response"),
        ("yes_no", "Yes/No"),
        ("single_choice", "Single Choice"),
        ("multiple_choice", "Multiple Choice"),
        ("scripture_reference", "Scripture Reference"),
        ("document_upload", "Document Upload"),
        ("reflection", "Spiritual Reflection"),
        ("ministry_plan", "Ministry Plan"),
        ("theological_position", "Theological Position"),
        ("case_study", "Ministry Case Study"),
        ("sermon_outline", "Sermon Outline"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="questions")
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    title = models.CharField(max_length=500)
    description = models.TextField(
        blank=True, help_text="Additional context or instructions for this question"
    )

    # Question settings
    is_required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    # File upload settings
    max_file_size_mb = models.PositiveIntegerField(
        default=10, help_text="Maximum file size in MB (for file upload questions)"
    )
    allowed_file_types = models.CharField(
        max_length=200,
        blank=True,
        help_text="Comma-separated list of allowed file extensions (e.g., pdf,doc,docx)",
    )

    # Scripture reference settings
    required_translation = models.CharField(
        max_length=50,
        blank=True,
        help_text="Required Bible translation (e.g., NIV, ESV, NASB)",
    )
    allow_multiple_verses = models.BooleanField(
        default=True, help_text="Allow multiple scripture references"
    )

    # Essay/reflection settings
    min_word_count = models.PositiveIntegerField(
        null=True, blank=True, help_text="Minimum word count for essay questions"
    )
    max_word_count = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum word count for essay questions"
    )

    # Text input settings
    text_max_length = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum character length for text inputs"
    )
    text_placeholder = models.CharField(
        max_length=200, blank=True, help_text="Placeholder text for input fields"
    )

    # Grading settings
    max_points = models.FloatField(
        default=1.0, help_text="Maximum points possible for this question"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["test", "order"], name="unique_question_order_per_test"
            )
        ]

    def __str__(self):
        return f"{self.test.title} - Q{self.order}: {self.title[:50]}"

    @property
    def has_predefined_options(self):
        """Check if this question type has predefined options"""
        return self.question_type in ["single_choice", "multiple_choice"]


class QuestionOption(models.Model):
    """
    Predefined options for single choice and multiple choice questions.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="options"
    )
    text = models.CharField(max_length=300)
    order = models.PositiveIntegerField(default=0)
    is_correct = models.BooleanField(
        default=False,
        help_text="Mark as correct for auto-graded questions (future feature)",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["question", "order"], name="unique_option_order_per_question"
            )
        ]

    def __str__(self):
        return f"{self.question.title} - Option {self.order}: {self.text[:30]}"


class Submission(models.Model):
    """
    A student's submission of a test. Contains all their answers.
    """

    SUBMISSION_STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("submitted", "Submitted"),
        ("graded", "Graded"),
        ("returned", "Returned for Revision"),
    ]

    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="test_submissions",
        limit_choices_to={"role": "student"},
    )

    # Submission tracking
    attempt_number = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20, choices=SUBMISSION_STATUS_CHOICES, default="in_progress"
    )

    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_spent_minutes = models.PositiveIntegerField(
        null=True, blank=True, help_text="Total time spent on the test in minutes"
    )

    # Grading tracking
    graded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submissions_graded",
        limit_choices_to={"role__in": ["admin", "lecturer"]},
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    feedback = models.TextField(blank=True, help_text="General feedback from grader")

    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-submitted_at", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["test", "student", "attempt_number"],
                name="unique_test_student_attempt",
            )
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.test.title} (Attempt {self.attempt_number})"

    @property
    def is_submitted(self):
        """Check if submission has been submitted"""
        return self.status in ["submitted", "graded", "returned"]

    @property
    def completion_percentage(self):
        """Calculate completion percentage based on answered questions"""
        total_questions = self.test.total_questions
        if total_questions == 0:
            return 0
        answered_questions = self.answers.exclude(
            models.Q(text_answer="")
            & models.Q(file_answer="")
            & models.Q(boolean_answer__isnull=True)
            & models.Q(date_answer__isnull=True)
        ).count()
        return (answered_questions / total_questions) * 100

    @property
    def score(self):
        """Calculate total score from all graded answers"""
        if self.status not in ["graded", "returned"]:
            return None
        total_score = sum(
            answer.points_earned or 0 
            for answer in self.answers.filter(points_earned__isnull=False)
        )
        return total_score

    @property
    def max_score(self):
        """Get maximum possible score for this test"""
        return self.test.total_points


class Answer(models.Model):
    """
    Individual answers to questions within a submission.
    Supports multiple answer types based on question type.
    """

    submission = models.ForeignKey(
        Submission, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="answers"
    )

    # Different answer types - only one should be used based on question type
    text_answer = models.TextField(blank=True)
    boolean_answer = models.BooleanField(null=True, blank=True)
    date_answer = models.DateField(null=True, blank=True)
    file_answer = models.FileField(upload_to="test_submissions/", null=True, blank=True)

    # For single/multiple choice questions
    selected_options = models.ManyToManyField(
        QuestionOption, blank=True, help_text="Selected options for choice questions"
    )

    # Answer metadata
    answered_at = models.DateTimeField(auto_now=True)
    is_flagged = models.BooleanField(
        default=False, help_text="Flag for review during grading"
    )

    # Individual question feedback (for manual grading)
    points_earned = models.FloatField(
        null=True, blank=True, help_text="Points earned for this answer"
    )
    feedback = models.TextField(
        blank=True, help_text="Specific feedback for this answer"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["question__order"]
        constraints = [
            models.UniqueConstraint(
                fields=["submission", "question"],
                name="unique_answer_per_submission_question",
            )
        ]

    def __str__(self):
        return f"{self.submission.student.get_full_name()} - {self.question.title[:30]}"

    @property
    def display_answer(self):
        """Get a string representation of the answer based on question type"""
        question_type = self.question.question_type

        if question_type in ["text", "scripture_reference"]:
            return self.text_answer
        elif question_type in [
            "essay",
            "reflection",
            "ministry_plan",
            "theological_position",
            "case_study",
            "sermon_outline",
        ]:
            return self.text_answer
        elif question_type == "yes_no":
            if self.boolean_answer is None:
                return ""
            return "Yes" if self.boolean_answer else "No"
        elif question_type == "document_upload":
            return self.file_answer.name if self.file_answer else ""
        elif question_type in ["single_choice", "multiple_choice"]:
            options = self.selected_options.all()
            return ", ".join([option.text for option in options])
        else:
            return ""

    @property
    def has_answer(self):
        """Check if this answer has any content"""
        return bool(
            self.text_answer
            or self.boolean_answer is not None
            or self.date_answer
            or self.file_answer
            or self.selected_options.exists()
        )

    @property
    def max_points(self):
        """Get maximum points from the question"""
        return self.question.max_points

    def validate_for_submission(self):
        """
        Validate answer meets all constraints for submission.
        Raises ValidationError if validation fails.
        """
        if not self.has_answer:
            return  # Empty answers are valid
            
        question_type = self.question.question_type
        
        # Validate text length for text-based questions
        if question_type in ["text", "scripture_reference"]:
            if self.question.text_max_length and len(self.text_answer) > self.question.text_max_length:
                raise ValidationError(
                    f"Text answer exceeds maximum length of {self.question.text_max_length} characters"
                )
        
        elif question_type in [
            "essay", "reflection", "ministry_plan", "theological_position", 
            "case_study", "sermon_outline"
        ]:
            # Validate word count for essay-type questions
            if self.question.min_word_count or self.question.max_word_count:
                word_count = len(self.text_answer.split())
                
                if self.question.min_word_count and word_count < self.question.min_word_count:
                    raise ValidationError(
                        f"Essay answer must be at least {self.question.min_word_count} words (current: {word_count})"
                    )
                
                if self.question.max_word_count and word_count > self.question.max_word_count:
                    raise ValidationError(
                        f"Essay answer must be no more than {self.question.max_word_count} words (current: {word_count})"
                    )
        
        # Validate required questions have answers
        if self.question.is_required and not self.has_answer:
            raise ValidationError("This question is required")

    def get_validation_errors(self):
        """
        Get validation errors without raising exceptions.
        Returns a list of error messages, empty if valid.
        """
        try:
            self.validate_for_submission()
            return []
        except ValidationError as e:
            return e.messages
