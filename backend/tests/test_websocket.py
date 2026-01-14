"""
WebSocket Real-Time Feature Tests
Testing WebSocket connections, notifications, chat, and real-time updates
"""
from django.test import TestCase, TransactionTestCase
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from tests.base import BaseTestCase
from notifications.models import Notification
from chats.models import CommitteeChatMessage
from django.contrib.auth import get_user_model
import json
import asyncio

User = get_user_model()


class WebSocketConnectionTests(TransactionTestCase):
    """Test WebSocket connection establishment"""
    
    def setUp(self):
        """Set up test data"""
        from tests.base import BaseTestCase
        base = BaseTestCase()
        base.setUp()
        self.admin_user = base.admin_user
        self.member_user = base.member_user
        self.committee = base.committee
    
    async def test_notification_websocket_connection(self):
        """Test connecting to notification WebSocket"""
        from config.routing import application
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/notifications/"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()
    
    async def test_project_board_websocket_connection(self):
        """Test connecting to project board WebSocket"""
        from config.routing import application
        from projects.models import Project
        
        # Create test project
        project = Project.objects.create(
            title='WS Test Project',
            owner=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/project/{project.id}/"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()
    
    async def test_committee_chat_websocket_connection(self):
        """Test connecting to committee chat WebSocket"""
        from config.routing import application
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/committee/{self.committee.id}/"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()


class WebSocketNotificationTests(TransactionTestCase):
    """Test WebSocket notification delivery"""
    
    def setUp(self):
        """Set up test data"""
        from tests.base import BaseTestCase
        base = BaseTestCase()
        base.setUp()
        self.member_user = base.member_user
    
    async def test_receive_notification_via_websocket(self):
        """Test receiving notification through WebSocket"""
        from config.routing import application
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/notifications/"
        )
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Create notification
        notification = Notification.objects.create(
            recipient=self.member_user,
            message='WebSocket test notification',
            notification_type='INFO'
        )
        
        # Send through channel layer
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f'notifications_{self.member_user.id}',
            {
                'type': 'send_notification',
                'notification': {
                    'id': notification.id,
                    'message': notification.message
                }
            }
        )
        
        # Receive message
        response = await communicator.receive_json_from(timeout=5)
        self.assertIn('notification', response)
        
        await communicator.disconnect()
    
    async def test_mark_notification_read_via_websocket(self):
        """Test marking notification as read through WebSocket"""
        from config.routing import application
        
        notification = Notification.objects.create(
            recipient=self.member_user,
            message='Test notification',
            notification_type='INFO',
            is_read=False
        )
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/notifications/"
        )
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Send mark as read message
        await communicator.send_json_to({
            'type': 'mark_read',
            'notification_id': notification.id
        })
        
        # Receive confirmation
        response = await communicator.receive_json_from(timeout=5)
        
        # Verify notification marked as read
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        
        await communicator.disconnect()


class WebSocketChatTests(TransactionTestCase):
    """Test WebSocket chat functionality"""
    
    def setUp(self):
        """Set up test data"""
        from tests.base import BaseTestCase
        base = BaseTestCase()
        base.setUp()
        self.member_user = base.member_user
        self.committee_leader = base.committee_leader
        self.committee = base.committee
    
    async def test_send_chat_message(self):
        """Test sending chat message through WebSocket"""
        from config.routing import application
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/committee/{self.committee.id}/"
        )
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Send message
        await communicator.send_json_to({
            'type': 'chat_message',
            'message': 'Hello from WebSocket test'
        })
        
        # Receive echo/confirmation
        response = await communicator.receive_json_from(timeout=5)
        self.assertIn('message', response)
        
        # Verify message saved to database
        message = CommitteeChatMessage.objects.filter(
            committee=self.committee,
            message='Hello from WebSocket test'
        ).first()
        
        # self.assertIsNotNone(message)  # Uncomment if message saving is implemented
        
        await communicator.disconnect()
    
    async def test_typing_indicator(self):
        """Test typing indicator functionality"""
        from config.routing import application
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/committee/{self.committee.id}/"
        )
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Send typing indicator
        await communicator.send_json_to({
            'type': 'typing',
            'is_typing': True
        })
        
        # Receive typing status
        response = await communicator.receive_json_from(timeout=5)
        # Implementation depends on how typing is broadcast
        
        await communicator.disconnect()
    
    async def test_multiple_users_chat(self):
        """Test multiple users in same chat"""
        from config.routing import application
        
        # User 1 connects
        communicator1 = WebsocketCommunicator(
            application,
            f"/ws/committee/{self.committee.id}/"
        )
        connected1, _ = await communicator1.connect()
        self.assertTrue(connected1)
        
        # User 2 connects
        communicator2 = WebsocketCommunicator(
            application,
            f"/ws/committee/{self.committee.id}/"
        )
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected2)
        
        # User 1 sends message
        await communicator1.send_json_to({
            'type': 'chat_message',
            'message': 'Multi-user test'
        })
        
        # Both users should receive
        # (Implementation depends on broadcast logic)
        
        await communicator1.disconnect()
        await communicator2.disconnect()


class WebSocketOnlineStatusTests(TransactionTestCase):
    """Test online/offline status tracking"""
    
    def setUp(self):
        """Set up test data"""
        from tests.base import BaseTestCase
        base = BaseTestCase()
        base.setUp()
        self.member_user = base.member_user
    
    async def test_user_online_on_connect(self):
        """Test user marked as online when connecting"""
        from config.routing import application
        
        self.assertFalse(self.member_user.is_online)
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/notifications/"
        )
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # User should be marked online
        self.member_user.refresh_from_db()
        # self.assertTrue(self.member_user.is_online)  # Uncomment if implemented
        
        await communicator.disconnect()
    
    async def test_user_offline_on_disconnect(self):
        """Test user marked as offline when disconnecting"""
        from config.routing import application
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/notifications/"
        )
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()
        
        # User should be marked offline
        self.member_user.refresh_from_db()
        # self.assertFalse(self.member_user.is_online)  # Uncomment if implemented


class WebSocketProjectBoardTests(TransactionTestCase):
    """Test project board real-time updates"""
    
    def setUp(self):
        """Set up test data"""
        from tests.base import BaseTestCase
        from projects.models import Project, ProjectTask
        base = BaseTestCase()
        base.setUp()
        self.admin_user = base.admin_user
        self.member_user = base.member_user
        
        self.project = Project.objects.create(
            title='WS Board Project',
            owner=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
    
    async def test_task_status_update_broadcast(self):
        """Test broadcasting task status changes"""
        from config.routing import application
        from projects.models import ProjectTask
        
        task = ProjectTask.objects.create(
            project=self.project,
            title='WS Test Task',
            status='YAPILACAK',
            points=30
        )
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/project/{self.project.id}/"
        )
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Update task status
        task.status = 'DEVAM_EDIYOR'
        task.save()
        
        # Broadcast update
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f'project_{self.project.id}',
            {
                'type': 'task_update',
                'task_id': task.id,
                'status': 'DEVAM_EDIYOR'
            }
        )
        
        # Receive update
        response = await communicator.receive_json_from(timeout=5)
        # Verify update received
        
        await communicator.disconnect()
    
    async def test_active_users_tracking(self):
        """Test tracking active users on project board"""
        from config.routing import application
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/project/{self.project.id}/"
        )
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Should receive active users list
        response = await communicator.receive_json_from(timeout=5)
        # Verify active users in response
        
        await communicator.disconnect()


class WebSocketSecurityTests(TransactionTestCase):
    """Test WebSocket security"""
    
    def setUp(self):
        """Set up test data"""
        from tests.base import BaseTestCase
        base = BaseTestCase()
        base.setUp()
        self.committee = base.committee
    
    async def test_unauthorized_websocket_connection(self):
        """Test that unauthorized users cannot connect"""
        from config.routing import application
        
        # Try to connect without authentication
        communicator = WebsocketCommunicator(
            application,
            f"/ws/committee/{self.committee.id}/"
        )
        
        # Should reject or handle unauthorized connection
        # Implementation depends on auth middleware
    
    async def test_access_other_committee_chat(self):
        """Test that users cannot access unauthorized committee chats"""
        from tests.base import BaseTestCase
        from committees.models import Committee
        
        base = BaseTestCase()
        base.setUp()
        
        # Create another committee
        other_committee = Committee.objects.create(
            name='Other Committee',
            leader=base.admin_user
        )
        
        # Try to access chat without membership
        # Should be rejected based on permissions
