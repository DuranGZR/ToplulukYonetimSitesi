"""
WebSocket Consumer for committee team chat
Handles real-time messaging, typing indicators, and online members
"""

import json
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class CommitteeChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection to committee chat"""
        self.user = self.scope["user"]
        self.committee_id = self.scope['url_route']['kwargs']['committee_id']
        self.room_group_name = f'committee_chat_{self.committee_id}'
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Check if user is member of this committee
        has_access = await self.check_committee_access()
        if not has_access:
            await self.close()
            return
        
        # Join committee chat group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notify others that user is online
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_online',
                'user_id': self.user.id,
                'username': self.user.username,
                'full_name': self.user.get_full_name() or self.user.username,
                'profile_image': self.user.profile_image.url if self.user.profile_image else None
            }
        )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group_name'):
            # Notify others that user is offline
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_offline',
                    'user_id': self.user.id,
                    'username': self.user.username
                }
            )
            
            # Leave committee chat group
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

    async def user_online(self, event):
        """Notify that a user came online"""
        await self.send(text_data=json.dumps({
            'type': 'user_online',
            'user_id': event['user_id'],
            'username': event['username'],
            'full_name': event['full_name'],
            'profile_image': event['profile_image']
        }))

    async def user_offline(self, event):
        """Notify that a user went offline"""
        await self.send(text_data=json.dumps({
            'type': 'user_offline',
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
    def check_committee_access(self):
        """Check if user is member of this committee"""
        from committees.models import Committee
        try:
            committee = Committee.objects.get(id=self.committee_id)
            return self.user.is_in_committee(committee) or self.user.is_admin
        except Committee.DoesNotExist:
            return False

    @database_sync_to_async
    def save_chat_message(self, message_text):
        """Save chat message to database"""
        from committees.models import CommitteeChatMessage
        
        message = CommitteeChatMessage.objects.create(
            committee_id=self.committee_id,
            user=self.user,
            message=message_text
        )
        
        return {
            'id': message.id,
            'user_id': self.user.id,
            'username': self.user.username,
            'full_name': self.user.get_full_name() or self.user.username,
            'profile_image': self.user.profile_image.url if self.user.profile_image else None,
            'message': message.message,
            'timestamp': message.created_at.isoformat()
        }

    @database_sync_to_async
    def get_online_members(self):
        """Get list of online committee members"""
        from committees.models import Committee
        try:
            committee = Committee.objects.get(id=self.committee_id)
            members = committee.get_all_members()
            
            online_members = []
            for member in members:
                if member.is_online:
                    online_members.append({
                        'id': member.id,
                        'username': member.username,
                        'full_name': member.get_full_name() or member.username,
                        'profile_image': member.profile_image.url if member.profile_image else None
                    })
            
            return online_members
        except Committee.DoesNotExist:
            return []
