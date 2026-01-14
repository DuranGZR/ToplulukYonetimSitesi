"""
Voice Assistant Serializers
"""

from rest_framework import serializers
from .models import VoiceCallLog


class VoiceCallLogSerializer(serializers.ModelSerializer):
    """Telefon araması log serializer"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = VoiceCallLog
        fields = [
            'id', 'caller_number', 'called_number',
            'user_question', 'assistant_response',
            'status', 'status_display',
            'duration_seconds', 'error_message',
            'created_at', 'ended_at'
        ]
        read_only_fields = ['id', 'created_at', 'ended_at']

