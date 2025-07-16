import json
from rest_framework import serializers
from rest_framework.utils.encoders import JSONEncoder as DRFJSONEncoder
from .models import AuditLog
from django.contrib.contenttypes.models import ContentType
from apps.cohorts.models import Cohort, Enrollment
from apps.invitations.models import Invitation
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field

User = get_user_model()


CONTENT_TYPE_MAP = {
    "invitations": ContentType.objects.get_for_model(Invitation),
    "users": ContentType.objects.get_for_model(User),
    "cohorts": ContentType.objects.get_for_model(Cohort),
    "students": ContentType.objects.get_for_model(User),
    "staff": ContentType.objects.get_for_model(User),
    "enrollments": ContentType.objects.get_for_model(Enrollment),
}

class SafeJSONField(serializers.JSONField):
    """
    A JSON field that safely handles non-serializable data by converting it
    to a string representation upon serialization failure.
    """
    def to_representation(self, value):
        try:
            # Test if the value is serializable
            json.dumps(value, cls=DRFJSONEncoder)
            return value
        except (TypeError, ValueError):
            return str(value)


class AuditLogSerializer(serializers.ModelSerializer):
    author_info = serializers.SerializerMethodField()
    data = SafeJSONField()
    previous_data = SafeJSONField()

    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['timestamp']

    @extend_schema_field(dict)
    def get_author_info(self, obj):
        if obj.author:
            return {
                'id': obj.author.id,
                'username': obj.author.username,
                'email': obj.author.email,
                'name': obj.author.get_full_name() or obj.author.username
            }
        return {'name': obj.author_name} if obj.author_name else None


class CreateAuditLogSerializer(serializers.ModelSerializer):
    author = serializers.JSONField(required=False, write_only=True)

    class Meta:
        model = AuditLog
        fields = ['resource', 'action', 'data', 'previous_data', 'meta', 'author']

    def create(self, validated_data):
        request = self.context.get('request')
        author_data = validated_data.pop('author', None)
        meta = validated_data.pop('meta', {})
        object_id = meta.pop('id', None)
        validated_data['meta'] = meta

        resource = validated_data.get('resource')
        if resource:
            content_type = CONTENT_TYPE_MAP.get(resource)
            if content_type:
                validated_data['content_type'] = content_type
                if object_id:
                    validated_data['object_id'] = object_id

        # Set author from request user or provided data
        if request and request.user.is_authenticated:
            validated_data['author'] = request.user
            validated_data['author_name'] = request.user.get_full_name() or request.user.username
        elif author_data:
            validated_data['author_name'] = author_data.get('name', 'Unknown')

        # Add request metadata
        if request:
            validated_data['ip_address'] = self.get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')

        return super().create(validated_data)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip