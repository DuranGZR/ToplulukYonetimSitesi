"""
Voice Assistant URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VoiceCallLogViewSet,
    netgsm_webhook_view,
    process_speech_view,
    call_status_callback_view
)

router = DefaultRouter()
router.register(r'voice/calls', VoiceCallLogViewSet, basename='voice-call-log')

urlpatterns = [
    path('', include(router.urls)),
    
    # Netgsm webhook endpoints (AllowAny - Netgsm'den gelecek)
    path('voice/webhook/', netgsm_webhook_view, name='netgsm-webhook'),
    path('voice/process-speech/', process_speech_view, name='process-speech'),
    path('voice/call-status/', call_status_callback_view, name='call-status-callback'),
]

