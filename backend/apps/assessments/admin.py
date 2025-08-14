from django.contrib import admin
from .models import Test, Question, QuestionOption, Submission, Answer


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 0
    fields = ['text', 'order', 'is_correct']


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ['question_type', 'title', 'is_required', 'order']
    readonly_fields = ['created_at']


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'cohort', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'course', 'cohort', 'created_at']
    search_fields = ['title', 'description', 'course__name', 'cohort__name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [QuestionInline]
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'instructions')
        }),
        ('Relationships', {
            'fields': ('course', 'cohort', 'created_by')
        }),
        ('Settings', {
            'fields': ('time_limit_minutes', 'max_attempts', 'allow_review_after_submission', 'randomize_questions')
        }),
        ('Availability', {
            'fields': ('status', 'available_from', 'available_until')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'test', 'question_type', 'is_required', 'order']
    list_filter = ['question_type', 'is_required', 'test__course', 'test__cohort']
    search_fields = ['title', 'description', 'test__title']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [QuestionOptionInline]
    
    fieldsets = (
        (None, {
            'fields': ('test', 'question_type', 'title', 'description', 'is_required', 'order')
        }),
        ('File Upload Settings', {
            'fields': ('max_file_size_mb', 'allowed_file_types'),
            'classes': ('collapse',)
        }),
        ('Scripture Reference Settings', {
            'fields': ('required_translation', 'allow_multiple_verses'),
            'classes': ('collapse',)
        }),
        ('Essay/Reflection Settings', {
            'fields': ('min_word_count', 'max_word_count'),
            'classes': ('collapse',)
        }),
        ('Text Input Settings', {
            'fields': ('text_max_length', 'text_placeholder'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question', 'order', 'is_correct']
    list_filter = ['is_correct', 'question__question_type']
    search_fields = ['text', 'question__title']


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    readonly_fields = ['answered_at', 'created_at']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'test', 'status', 'attempt_number', 'submitted_at', 'score']
    list_filter = ['status', 'test__course', 'test__cohort', 'submitted_at']
    search_fields = ['student__email', 'student__first_name', 'student__last_name', 'test__title']
    readonly_fields = ['started_at', 'created_at', 'updated_at', 'completion_percentage']
    inlines = [AnswerInline]
    
    fieldsets = (
        (None, {
            'fields': ('test', 'student', 'attempt_number', 'status')
        }),
        ('Timing', {
            'fields': ('started_at', 'submitted_at', 'time_spent_minutes')
        }),
        ('Grading', {
            'fields': ('score', 'max_score', 'graded_by', 'graded_at', 'feedback'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'completion_percentage'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['submission', 'question', 'display_answer', 'answered_at']
    list_filter = ['question__question_type', 'is_flagged', 'answered_at']
    search_fields = ['submission__student__email', 'question__title', 'text_answer']
    readonly_fields = ['answered_at', 'created_at', 'updated_at', 'display_answer']
    
    fieldsets = (
        (None, {
            'fields': ('submission', 'question', 'is_flagged')
        }),
        ('Answer Content', {
            'fields': ('text_answer', 'boolean_answer', 'date_answer', 'file_answer', 'selected_options')
        }),
        ('Grading', {
            'fields': ('points_earned', 'max_points', 'feedback'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('answered_at', 'display_answer'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
