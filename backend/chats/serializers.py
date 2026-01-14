from rest_framework import serializers
from .models import ChatRoom, ChatMessage
from users.serializers import UserSerializer


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_full_name = serializers.SerializerMethodField()
    sender_profile_image = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'sender', 'sender_id', 'sender_username', 'sender_full_name', 
                  'sender_profile_image', 'message', 'message_type', 'timestamp', 'created_at', 'is_read']
        read_only_fields = ['sender', 'created_at']
    
    def get_sender_full_name(self, obj):
        """Sender'ın tam adını döndür"""
        if obj.sender:
            return obj.sender.get_full_name() or obj.sender.username
        return ''
    
    def get_sender_profile_image(self, obj):
        if obj.sender and obj.sender.profile_image:
            return obj.sender.profile_image.url
        return None
    
    def get_is_read(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.read_by.filter(id=request.user.id).exists()
        return False


class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'room_type', 'committee', 'project', 'participants', 
                  'last_message', 'unread_count', 'other_user', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_last_message(self, obj):
        # Use prefetched messages or query with select_related for efficiency
        last_msg = obj.messages.select_related('sender').order_by('-created_at').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'sender': last_msg.sender.username,
                'message': last_msg.message[:50],
                'created_at': last_msg.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.exclude(sender=request.user).exclude(
                read_by=request.user
            ).count()
        return 0
    
    def get_other_user(self, obj):
        """Özel mesaj için diğer kullanıcı"""
        request = self.context.get('request')
        if request and request.user and obj.room_type == 'PRIVATE':
            other = obj.get_other_participant(request.user)
            if other:
                return UserSerializer(other).data
        return None
