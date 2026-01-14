from django.contrib import admin
from .models import ChatRoom, ChatMessage


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'committee', 'created_at']
    list_filter = ['room_type', 'created_at']
    search_fields = ['name']
    filter_horizontal = ['participants']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'room', 'message_preview', 'created_at']
    list_filter = ['message_type', 'created_at']
    search_fields = ['message', 'sender__username']
    
    def message_preview(self, obj):
        return obj.message[:50]
    message_preview.short_description = 'Mesaj'
