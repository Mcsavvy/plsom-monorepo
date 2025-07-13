"""
Custom serializers for the project
"""

from rest_framework import serializers

class SuccessResponseSerializer(serializers.Serializer):
    """Serializer for success responses"""

    detail = serializers.CharField()
