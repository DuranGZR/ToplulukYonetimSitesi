from rest_framework import serializers
from .models import UserReport
from users.serializers import UserSerializer

class UserReportSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    reported_user = UserSerializer(read_only=True)
    resolved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = UserReport
        fields = [
            'id', 'reporter', 'reported_user', 'report_type', 'description',
            'status', 'content_type', 'object_id', 'admin_notes',
            'resolved_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reporter', 'created_at', 'updated_at']

class CreateUserReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserReport
        fields = ['reported_user', 'report_type', 'description', 'content_type', 'object_id']
