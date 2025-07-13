from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    author_info = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['timestamp']
    
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
    author = serializers.JSONField(required=False)
    
    class Meta:
        model = AuditLog
        fields = ['resource', 'action', 'data', 'previous_data', 'meta', 'author']
    
    def create(self, validated_data):
        request = self.context.get('request')
        author_data = validated_data.pop('author', None)
        
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