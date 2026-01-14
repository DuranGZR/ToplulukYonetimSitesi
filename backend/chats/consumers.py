"""
Universal Chat Consumer for HSD Platform
Handles: General chat, Committee chats, Private messages
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Check if user has access to this room
        has_access = await self.check_room_access()
        if not has_access:
            await self.close()
            return
        
        # Join chat room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notify others that user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user_id': self.user.id,
                'username': self.user.username,
                'full_name': self.user.get_full_name() or self.user.username,
                'profile_image': self.user.profile_image.url if self.user.profile_image else None
            }
        )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group_name'):
            # Notify others that user left
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'user_id': self.user.id,
                    'username': self.user.username
                }
            )
            
            # Leave chat room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'chat_message':
                # Save message to database
                message_data = await self.save_chat_message(data.get('message'))
                
                # Broadcast message to all users in the room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_data
                    }
                )
            elif message_type == 'typing':
                # Broadcast typing indicator
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'is_typing': data.get('is_typing', True)
                    }
                )
            elif message_type == 'get_online_members':
                # Return list of online members
                online_members = await self.get_online_members()
                await self.send(text_data=json.dumps({
                    'type': 'online_members',
                    'members': online_members
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    # Event handlers
    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def user_joined(self, event):
        """Notify that a user joined"""
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'username': event['username'],
            'full_name': event['full_name'],
            'profile_image': event['profile_image']
        }))

    async def user_left(self, event):
        """Notify that a user left"""
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def typing_indicator(self, event):
        """Send typing indicator"""
        # Don't send typing indicator back to the user who is typing
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing']
            }))

    @database_sync_to_async
    def check_room_access(self):
        """Check if user has access to this room"""
        from chats.models import ChatRoom
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            return room.can_access(self.user)
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_chat_message(self, message_text):
        """Save chat message to database"""
        from chats.models import ChatMessage
        
        # self.user bağlantı kurulurken alınan user, her zaman güncel olmalı
        # Ama emin olmak için scope'dan da kontrol edelim
        current_user = self.user
        if not current_user or not current_user.is_authenticated:
            # Eğer user bilgisi yoksa, scope'dan al
            current_user = self.scope.get('user')
        
        message = ChatMessage.objects.create(
            room_id=self.room_id,
            sender=current_user,
            message=message_text
        )
        
        # Mesajı kaydettikten sonra sender bilgisini tekrar al (fresh from DB)
        message.refresh_from_db()
        sender = message.sender
        
        return {
            'id': message.id,
            'sender_id': sender.id,
            'sender_username': sender.username,
            'sender_full_name': sender.get_full_name() or sender.username,
            'sender_profile_image': sender.profile_image.url if sender.profile_image else None,
            'message': message.message,
            'timestamp': message.created_at.isoformat()
        }

    @database_sync_to_async
    def get_online_members(self):
        """Get list of online users in room"""
        from chats.models import ChatRoom
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            
            # Genel chat - tüm online kullanıcılar
            if room.room_type == 'GENERAL':
                online_users = User.objects.filter(is_online=True)
            # Komite chat - komite üyelerinden online olanlar
            elif room.room_type == 'COMMITTEE' and room.committee:
                members = room.committee.get_all_members()
                online_users = [m for m in members if m.is_online]
            # Özel chat - katılımcılardan online olanlar
            elif room.room_type == 'PRIVATE':
                online_users = room.participants.filter(is_online=True)
            # Proje chat - proje üyelerinden online olanlar
            elif room.room_type == 'PROJECT' and room.project:
                from django.db.models import Q
                online_users = User.objects.filter(
                    Q(id=room.project.owner_id) | 
                    Q(id__in=room.project.team_members.values_list('id', flat=True))
                ).filter(is_online=True)
            else:
                online_users = []
            
            return [{
                'id': user.id,
                'username': user.username,
                'full_name': user.get_full_name() or user.username,
                'profile_image': user.profile_image.url if user.profile_image else None
            } for user in online_users]
        except ChatRoom.DoesNotExist:
            return []
