"""
Voice Assistant Views
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .netgsm_handler import NetgsmVoiceHandler
from .models import VoiceCallLog
from .serializers import VoiceCallLogSerializer
from rest_framework import viewsets
import json


class VoiceCallLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Telefon araması log kayıtları - Admin için"""
    queryset = VoiceCallLog.objects.all()
    serializer_class = VoiceCallLogSerializer
    permission_classes = []  # Netgsm webhook için AllowAny
    
    def get_queryset(self):
        # Son 100 kaydı göster
        return VoiceCallLog.objects.all().order_by('-created_at')[:100]


# Netgsm webhook endpoints (AllowAny - Netgsm'den gelecek)
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def netgsm_webhook_view(request):
    """
    Netgsm incoming call webhook endpoint
    
    Request body (JSON):
    {
        "caller_number": "05333192803",
        "called_number": "02121234567",
        "call_id": "abc123",
        "timestamp": "2025-12-09T10:30:00Z"
    }
    
    Response (JSON):
    {
        "action": "speak",
        "text": "Welcome message...",
        "language": "tr-TR",
        "voice": "female",
        "next_action": "listen",
        "listen_timeout": 10,
        "webhook_url": "https://your-domain.com/api/v1/voice/process-speech/"
    }
    """
    try:
        # Parse request body
        data = json.loads(request.body.decode('utf-8'))
        
        # Create call log
        call_log = VoiceCallLog.objects.create(
            caller_number=data.get('caller_number', 'Unknown'),
            called_number=data.get('called_number', 'Unknown'),
            status='CONNECTED'
        )
        
        # Handle incoming call
        handler = NetgsmVoiceHandler()
        response = handler.handle_incoming_call(data)
        
        return JsonResponse(response, status=200)
        
    except Exception as e:
        print(f"[Netgsm Webhook] Error: {str(e)}")
        return JsonResponse({
            'action': 'speak',
            'text': 'Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar arayın.',
            'language': 'tr-TR',
            'voice': 'female',
            'next_action': 'hangup'
        }, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def process_speech_view(request):
    """
    Process user speech after listening
    
    Request body (JSON):
    {
        "call_id": "abc123",
        "speech_text": "İlk etkinlik ne zaman?",
        "confidence": 0.95
    }
    
    Response (JSON):
    {
        "action": "speak",
        "text": "Assistant response...",
        "language": "tr-TR",
        "voice": "female",
        "next_action": "listen" or "hangup",
        "listen_timeout": 10,
        "webhook_url": "https://your-domain.com/api/v1/voice/process-speech/"
    }
    """
    try:
        # Parse request body
        data = json.loads(request.body.decode('utf-8'))
        
        call_id = data.get('call_id', 'Unknown')
        user_question = data.get('speech_text', '').strip()
        
        # Update call log
        call_log = VoiceCallLog.objects.filter(
            caller_number=call_id  # Using call_id as identifier
        ).order_by('-created_at').first()
        
        if call_log:
            call_log.user_question = user_question
            call_log.status = 'PROCESSING'
            call_log.save()
        
        # Process speech
        handler = NetgsmVoiceHandler()
        response = handler.process_user_speech(data)
        
        # Update call log with response
        if call_log:
            call_log.assistant_response = response.get('text', '')
            call_log.status = 'COMPLETED' if response.get('next_action') == 'hangup' else 'PROCESSING'
            call_log.save()
        
        return JsonResponse(response, status=200)
        
    except Exception as e:
        print(f"[Process Speech] Error: {str(e)}")
        return JsonResponse({
            'action': 'speak',
            'text': 'Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar arayın.',
            'language': 'tr-TR',
            'voice': 'female',
            'next_action': 'hangup'
        }, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def call_status_callback_view(request):
    """
    Call status callback endpoint (call ended, etc.)
    
    Request body (JSON):
    {
        "call_id": "abc123",
        "status": "completed",
        "duration": 120
    }
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        
        call_id = data.get('call_id', 'Unknown')
        status = data.get('status', 'unknown')
        duration = data.get('duration', 0)
        
        # Update call log
        call_log = VoiceCallLog.objects.filter(
            caller_number=call_id
        ).order_by('-created_at').first()
        
        if call_log:
            call_log.duration_seconds = duration
            call_log.status = status.upper()
            call_log.save()
        
        return JsonResponse({'success': True}, status=200)
        
    except Exception as e:
        print(f"[Call Status] Error: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=200)

