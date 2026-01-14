"""
Test cases for Notification System
"""
from django.urls import reverse
from tests.base import BaseTestCase
from notifications.models import Notification


class NotificationTests(BaseTestCase):
    """Test notification system"""
    
    def setUp(self):
        super().setUp()
        # Create test notification
        self.notification = Notification.objects.create(
            recipient=self.member_user,
            message='Test notification',
            notification_type='INFO',
            link='/test-link/'
        )
    
    def test_list_notifications(self):
        """Test listing user's notifications"""
        self.authenticate_member()
        url = reverse('notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_user_sees_only_own_notifications(self):
        """Test that users see only their notifications"""
        # Create notification for another user
        Notification.objects.create(
            recipient=self.admin_user,
            message='Admin notification',
            notification_type='INFO'
        )
        
        self.authenticate_member()
        url = reverse('notification-list')
        response = self.client.get(url)
        
        # Member should only see their notification
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['recipient'], self.member_user.id)
    
    def test_mark_notification_as_read(self):
        """Test marking notification as read"""
        self.authenticate_member()
        url = reverse('notification-mark-read', kwargs={'pk': self.notification.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)
    
    def test_mark_all_notifications_as_read(self):
        """Test marking all notifications as read"""
        # Create multiple notifications
        Notification.objects.create(
            recipient=self.member_user,
            message='Notification 2',
            notification_type='INFO'
        )
        Notification.objects.create(
            recipient=self.member_user,
            message='Notification 3',
            notification_type='SUCCESS'
        )
        
        self.authenticate_member()
        url = reverse('notification-mark-all-read')
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, 200)
        # Check all notifications are marked as read
        unread_count = Notification.objects.filter(
            recipient=self.member_user,
            is_read=False
        ).count()
        self.assertEqual(unread_count, 0)
    
    def test_get_unread_count(self):
        """Test getting unread notification count"""
        # Create multiple unread notifications
        Notification.objects.create(
            recipient=self.member_user,
            message='Unread 1',
            notification_type='INFO'
        )
        Notification.objects.create(
            recipient=self.member_user,
            message='Unread 2',
            notification_type='WARNING'
        )
        
        self.authenticate_member()
        url = reverse('notification-unread-count')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['unread_count'], 3)  # Including setUp notification
    
    def test_delete_notification(self):
        """Test deleting notification"""
        self.authenticate_member()
        url = reverse('notification-detail', kwargs={'pk': self.notification.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            Notification.objects.filter(id=self.notification.id).exists()
        )


class NotificationCreationTests(BaseTestCase):
    """Test automatic notification creation"""
    
    def test_task_assignment_creates_notification(self):
        """Test that assigning task creates notification"""
        from tasks.models import Task
        
        task = Task.objects.create(
            title='Assigned Task',
            points=30,
            created_by=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        task.assigned_users.add(self.member_user)
        
        # Check notification was created
        notification = Notification.objects.filter(
            recipient=self.member_user,
            notification_type='TASK_ASSIGNED'
        ).first()
        
        self.assertIsNotNone(notification)
    
    def test_project_assignment_creates_notification(self):
        """Test that adding to project creates notification"""
        from projects.models import Project
        
        project = Project.objects.create(
            title='Team Project',
            description='Test',
            owner=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        project.team_members.add(self.member_user)
        
        # Check notification was created
        notification = Notification.objects.filter(
            recipient=self.member_user,
            notification_type='PROJECT_ASSIGNED'
        ).first()
        
        self.assertIsNotNone(notification)


class NotificationTypeTests(BaseTestCase):
    """Test different notification types"""
    
    def test_info_notification(self):
        """Test INFO type notification"""
        notif = Notification.objects.create(
            recipient=self.member_user,
            message='Info message',
            notification_type='INFO'
        )
        self.assertEqual(notif.notification_type, 'INFO')
    
    def test_success_notification(self):
        """Test SUCCESS type notification"""
        notif = Notification.objects.create(
            recipient=self.member_user,
            message='Success message',
            notification_type='SUCCESS'
        )
        self.assertEqual(notif.notification_type, 'SUCCESS')
    
    def test_warning_notification(self):
        """Test WARNING type notification"""
        notif = Notification.objects.create(
            recipient=self.member_user,
            message='Warning message',
            notification_type='WARNING'
        )
        self.assertEqual(notif.notification_type, 'WARNING')
    
    def test_error_notification(self):
        """Test ERROR type notification"""
        notif = Notification.objects.create(
            recipient=self.member_user,
            message='Error message',
            notification_type='ERROR'
        )
        self.assertEqual(notif.notification_type, 'ERROR')
