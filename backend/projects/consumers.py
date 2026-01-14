"""
WebSocket Consumer for real-time project board updates
Handles task drag-drop, assignments, and status changes in real-time
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class ProjectBoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection to a project board"""
        self.user = self.scope["user"]
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.room_group_name = f'project_board_{self.project_id}'
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Check if user has access to this project
        has_access = await self.check_project_access()
        if not has_access:
            await self.close()
            return
        
        # Join project board group
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
                'full_name': self.user.get_full_name() or self.user.username
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
            
            # Leave project board group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'task_update':
                # Broadcast task update to all connected users
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'task_updated',
                        'task': data.get('task'),
                        'user_id': self.user.id,
                        'username': self.user.username
                    }
                )
            elif message_type == 'task_move':
                # Task moved between columns
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'task_moved',
                        'task_id': data.get('task_id'),
                        'from_status': data.get('from_status'),
                        'to_status': data.get('to_status'),
                        'user_id': self.user.id,
                        'username': self.user.username
                    }
                )
            elif message_type == 'task_assigned':
                # Task assigned to user
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'task_assignment_changed',
                        'task_id': data.get('task_id'),
                        'assigned_to': data.get('assigned_to'),
                        'user_id': self.user.id,
                        'username': self.user.username
                    }
                )
            elif message_type == 'typing':
                # User is typing (for comments/chat)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_typing',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'is_typing': data.get('is_typing', True)
                    }
                )
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    # Event handlers for channel layer messages
    async def user_joined(self, event):
        """Send user joined notification"""
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'username': event['username'],
            'full_name': event['full_name']
        }))

    async def user_left(self, event):
        """Send user left notification"""
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def task_updated(self, event):
        """Broadcast task update"""
        await self.send(text_data=json.dumps({
            'type': 'task_updated',
            'task': event['task'],
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def task_moved(self, event):
        """Broadcast task move"""
        await self.send(text_data=json.dumps({
            'type': 'task_moved',
            'task_id': event['task_id'],
            'from_status': event['from_status'],
            'to_status': event['to_status'],
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def task_assignment_changed(self, event):
        """Broadcast task assignment change"""
        await self.send(text_data=json.dumps({
            'type': 'task_assigned',
            'task_id': event['task_id'],
            'assigned_to': event['assigned_to'],
            'user_id': event['user_id'],
            'username': event['username']
        }))

    async def user_typing(self, event):
        """Broadcast typing indicator"""
        # Don't send typing indicator back to the user who is typing
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing']
            }))

    @database_sync_to_async
    def check_project_access(self):
        """Check if user has access to this project"""
        from projects.models import Project
        try:
            project = Project.objects.get(id=self.project_id)
            # Check if user is owner or team member
            return (
                project.owner == self.user or
                self.user in project.team_members.all() or
                self.user.is_admin
            )
        except Project.DoesNotExist:
            return False
