from rest_framework import serializers
from apps.courses.models import Course


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model"""
    
    class Meta:
        model = Course
        fields = (
            "id",
            "name",
            "program_type",
            "module_count",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class CourseListSerializer(serializers.ModelSerializer):
    """Simplified serializer for course listings"""
    
    class Meta:
        model = Course
        fields = (
            "id",
            "name",
            "program_type",
            "module_count",
            "is_active",
        ) 