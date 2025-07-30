from rest_framework import serializers
from apps.classes.models import Class, Attendance
from apps.courses.models import Course
from apps.cohorts.models import Cohort
from apps.users.models import User


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class model"""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    lecturer_name = serializers.CharField(source='lecturer.get_full_name', read_only=True)
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Class
        fields = (
            "id",
            "course",
            "course_name",
            "lecturer",
            "lecturer_name",
            "cohort",
            "cohort_name",
            "title",
            "description",
            "scheduled_at",
            "duration_minutes",
            "zoom_meeting_id",
            "zoom_join_url",
            "recording_url",
        )
        read_only_fields = ("course_name", "lecturer_name", "cohort_name")


class ClassListSerializer(serializers.ModelSerializer):
    """Simplified serializer for class listings"""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    lecturer_name = serializers.CharField(source='lecturer.get_full_name', read_only=True)
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Class
        fields = (
            "id",
            "course_name",
            "lecturer_name",
            "cohort_name",
            "title",
            "scheduled_at",
            "duration_minutes",
        )
        read_only_fields = ("course_name", "lecturer_name", "cohort_name")


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model"""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    class_title = serializers.CharField(source='class_session.title', read_only=True)
    
    class Meta:
        model = Attendance
        fields = (
            "id",
            "class_session",
            "class_title",
            "student",
            "student_name",
            "join_time",
            "leave_time",
            "duration_minutes",
            "via_recording",
        )
        read_only_fields = ("student_name", "class_title") 