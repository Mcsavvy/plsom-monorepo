from rest_framework import serializers
from .models import Test, Question, QuestionOption, Submission, Answer
from drf_spectacular.utils import extend_schema_field


class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer for question options in choice-based questions."""
    
    class Meta:
        model = QuestionOption
        fields = [
            'id', 'text', 'order', 'is_correct'
        ]
        extra_kwargs = {
            'id': {'required': False},
            'order': {'read_only': True}  # Order will be determined by position in array
        }


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for test questions with nested options."""
    
    options = QuestionOptionSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = [
            'id', 'question_type', 'title', 'description', 'is_required',
            'order', 'max_file_size_mb', 'allowed_file_types',
            'required_translation', 'allow_multiple_verses',
            'min_word_count', 'max_word_count', 'text_max_length',
            'text_placeholder', 'options'
        ]
        extra_kwargs = {
            'id': {'required': False},
            'order': {'read_only': True}  # Order will be determined by position in array
        }
    
    def validate(self, attrs):
        """Validate question based on its type."""
        question_type = attrs.get('question_type')
        options = attrs.get('options', [])
        
        # Validate that choice questions have options
        if question_type in ['single_choice', 'multiple_choice']:
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
    course_name = serializers.CharField(source='course.name', read_only=True)
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'instructions',
            'course', 'cohort', 'created_by',
            'time_limit_minutes', 'max_attempts', 'allow_review_after_submission',
            'randomize_questions', 'status', 'available_from', 'available_until',
            'created_at', 'updated_at', 'questions', 'total_questions',
            'total_submissions', 'is_available', 'course_name', 'cohort_name'
        ]
        extra_kwargs = {
            'created_by': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True}
        }
    
    def validate(self, attrs):
        """Validate test data."""
        available_from = attrs.get('available_from')
        available_until = attrs.get('available_until')
        
        if available_from and available_until and available_from >= available_until:
            raise serializers.ValidationError(
                "available_from must be before available_until"
            )
        
        return attrs
    
    def create(self, validated_data):
        """Create test with nested questions and options."""
        questions_data = validated_data.pop('questions', [])
        
        # Create the test
        test = Test.objects.create(**validated_data)
        
        # Create questions and options
        self._create_questions(test, questions_data)
        
        return test
    
    def update(self, instance, validated_data):
        """Update test with safe question management logic."""
        questions_data = validated_data.pop('questions', None)
        
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
            self._safe_update_questions(instance, questions_data)
        
        return instance
    
    def _create_questions(self, test, questions_data):
        """Create questions and their options for a test."""
        for order, question_data in enumerate(questions_data):
            options_data = question_data.pop('options', [])
            
            question = Question.objects.create(
                test=test,
                order=order,
                **question_data
            )
            
            # Create options for choice questions
            self._create_options(question, options_data)
    
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
            options_data = question_data.pop('options', [])
            
            # Preserve ID if provided from frontend, otherwise let Django generate UUID
            question_id = question_data.pop('id', None)
            
            # Create new question with preserved ID if provided
            if question_id:
                question = Question.objects.create(
                    id=question_id,
                    test=test,
                    order=order,
                    **question_data
                )
            else:
                question = Question.objects.create(
                    test=test,
                    order=order,
                    **question_data
                )
            
            # Create options for this question
            self._create_options(question, options_data)
    
    def _update_questions_with_answer_protection(self, test, questions_data):
        """Careful update strategy that protects existing student answers."""
        # For tests with submissions (both draft and published), use conservative update
        # Get IDs of questions that should remain
        incoming_question_ids = {
            q.get('id') for q in questions_data 
            if q.get('id') is not None
        }
        
        # Only delete questions that are not in the incoming data AND have no answers
        questions_to_delete = test.questions.exclude(
            id__in=incoming_question_ids
        ).filter(
            answers__isnull=True
        )
        questions_to_delete.delete()
        
        # Process each question in the order received
        for order, question_data in enumerate(questions_data):
            options_data = question_data.pop('options', [])
            question_id = question_data.get('id')
            
            if question_id:
                # Update existing question if it exists
                try:
                    question = test.questions.get(id=question_id)
                    # Only update safe fields, preserve core structure
                    safe_fields = [
                        'title', 'description', 'is_required', 'text_placeholder',
                        'min_word_count', 'max_word_count', 'text_max_length'
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
                    question_data.pop('id', None)
                    question = Question.objects.create(
                        test=test,
                        order=order,
                        **question_data
                    )
                    self._create_options(question, options_data)
            else:
                # Create new question
                question = Question.objects.create(
                    test=test,
                    order=order,
                    **question_data
                )
                self._create_options(question, options_data)
    
    def _create_options(self, question, options_data):
        """Create options for a question, preserving IDs if provided."""
        for order, option_data in enumerate(options_data):
            # Preserve ID if provided from frontend, otherwise let Django generate UUID
            option_id = option_data.pop('id', None)
            
            if option_id:
                QuestionOption.objects.create(
                    id=option_id,
                    question=question,
                    order=order,
                    **option_data
                )
            else:
                QuestionOption.objects.create(
                    question=question,
                    order=order,
                    **option_data
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
            existing_options = {str(opt.id): opt for opt in question.options.all()}
            
            for order, option_data in enumerate(options_data):
                option_id = option_data.get('id')
                
                if option_id and str(option_id) in existing_options:
                    # Update existing option
                    option = existing_options[str(option_id)]
                    option.text = option_data.get('text', option.text)
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
    course_name = serializers.CharField(source='course.name', read_only=True)
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'status',
            'available_from', 'available_until', 'created_at', 'updated_at',
            'total_questions', 'total_submissions', 'is_available',
            'course_name', 'cohort_name', 'created_by_name',
            'time_limit_minutes', 'max_attempts'
        ]


# Submission and Answer serializers for future use
class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for test answers."""
    
    display_answer = serializers.CharField(read_only=True)
    has_answer = serializers.BooleanField(read_only=True)
    question_title = serializers.CharField(source='question.title', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    
    class Meta:
        model = Answer
        fields = [
            'id', 'question', 'text_answer', 'boolean_answer',
            'date_answer', 'file_answer', 'selected_options',
            'answered_at', 'is_flagged', 'points_earned', 'max_points',
            'feedback', 'display_answer', 'has_answer',
            'question_title', 'question_type'
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for test submissions."""
    
    answers = AnswerSerializer(many=True, read_only=True)
    is_submitted = serializers.BooleanField(read_only=True)
    completion_percentage = serializers.FloatField(read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id', 'test', 'student', 'attempt_number', 'status',
            'started_at', 'submitted_at', 'time_spent_minutes',
            'score', 'max_score', 'graded_by', 'graded_at', 'feedback',
            'ip_address', 'user_agent', 'created_at', 'updated_at',
            'answers', 'is_submitted', 'completion_percentage',
            'student_name', 'test_title', 'graded_by_name'
        ]
        extra_kwargs = {
            'student': {'read_only': True},
            'started_at': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
            'ip_address': {'read_only': True},
            'user_agent': {'read_only': True}
        }

class StudentSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for student submissions"""
    
    class Meta:
        model = Submission
        fields = [
            'id', 'test', 'attempt_number', 'status',
            'started_at', 'submitted_at', 'score', 'max_score',
            'completion_percentage', 'time_spent_minutes'
        ]


class StudentTestSerializer(serializers.ModelSerializer):
    """Serializer for tests viewed by students with submission information"""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    my_submission = serializers.SerializerMethodField()
    my_latest_submission_id = serializers.SerializerMethodField()
    my_submission_status = serializers.SerializerMethodField()
    attempts_remaining = serializers.SerializerMethodField()
    can_attempt = serializers.SerializerMethodField()
    
    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'instructions',
            'time_limit_minutes', 'max_attempts', 'allow_review_after_submission',
            'status', 'available_from', 'available_until', 'is_available',
            'course_name', 'cohort_name', 'created_by_name',
            'total_questions', 'my_submission', 'my_latest_submission_id',
            'my_submission_status', 'attempts_remaining', 'can_attempt',
            'created_at', 'updated_at'
        ]
    
    @extend_schema_field(StudentSubmissionSerializer)
    def get_my_submission(self, obj):
        """Get student's latest submission for this test"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None
            
        latest_submission = obj.submissions.filter(student=request.user).order_by('-created_at').first()
        
        if latest_submission:
            return StudentSubmissionSerializer(latest_submission).data
        return None
    
    @extend_schema_field(serializers.IntegerField)
    def get_my_latest_submission_id(self, obj):
        """Get the ID of student's latest submission"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None
            
        latest_submission = obj.submissions.filter(student=request.user).order_by('-created_at').first()
        return latest_submission.id if latest_submission else None
    
    @extend_schema_field(serializers.CharField)
    def get_my_submission_status(self, obj):
        """Get status of student's latest submission"""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return None
            
        latest_submission = obj.submissions.filter(student=request.user).order_by('-created_at').first()
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
            student=request.user, 
            status='in_progress'
        ).exists()
        
        return not in_progress


class StudentTestDetailSerializer(StudentTestSerializer):
    """Detailed serializer for individual test view by students, includes questions"""
    
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta(StudentTestSerializer.Meta):
        fields = StudentTestSerializer.Meta.fields + ['questions']