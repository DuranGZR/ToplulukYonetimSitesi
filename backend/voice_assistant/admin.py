"""
Voice Assistant Admin
"""

from django.contrib import admin
from .models import VoiceCallLog


@admin.register(VoiceCallLog)
class VoiceCallLogAdmin(admin.ModelAdmin):
    list_display = [
        'caller_number', 'called_number', 'status',
        'duration_seconds', 'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['caller_number', 'user_question', 'assistant_response']
    readonly_fields = ['created_at', 'ended_at']
    
    fieldsets = (
        ('Arama Bilgileri', {
            'fields': ('caller_number', 'called_number', 'status', 'duration_seconds')
        }),
        ('Soru ve Cevap', {
            'fields': ('user_question', 'assistant_response')
        }),
        ('Hata Bilgisi', {
            'fields': ('error_message',)
        }),
        ('Tarihler', {
            'fields': ('created_at', 'ended_at')
        }),
    )

