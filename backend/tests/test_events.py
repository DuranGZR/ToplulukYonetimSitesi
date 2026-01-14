"""
Test cases for Event Management and QR Attendance System
"""
from django.urls import reverse
from tests.base import BaseTestCase
from events.models import Event, EventAttendance
from datetime import datetime, timedelta
from django.utils import timezone


class EventManagementTests(BaseTestCase):
    """Test event CRUD operations"""
    
    def setUp(self):
        super().setUp()
        self.event = Event.objects.create(
            title='Test Event',
            description='Test event description',
            event_type='EGITIM',
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=2),
            location='Test Location',
            attendance_points=25,
            created_by=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
    
    def test_list_events(self):
        """Test listing events"""
        self.authenticate_member()
        url = reverse('event-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_create_event_as_admin(self):
        """Test creating event as admin"""
        self.authenticate_admin()
        url = reverse('event-list')
        data = {
            'title': 'New Event',
            'description': 'New event description',
            'event_type': 'SOSYAL',
            'start_time': (timezone.now() + timedelta(days=2)).isoformat(),
            'end_time': (timezone.now() + timedelta(days=2, hours=3)).isoformat(),
            'location': 'Campus Hall',
            'attendance_points': 30
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 201)
        event = Event.objects.get(title='New Event')
        self.assertEqual(event.approval_status, 'APPROVED')
        self.assertTrue(event.is_active)
    
    def test_event_detail(self):
        """Test retrieving event details"""
        self.authenticate_member()
        url = reverse('event-detail', kwargs={'pk': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Test Event')
    
    def test_generate_qr_code(self):
        """Test QR code generation for event"""
        self.authenticate_admin()
        url = reverse('event-generate-qr', kwargs={'pk': self.event.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.event.refresh_from_db()
        self.assertIsNotNone(self.event.qr_code)


class QRAttendanceTests(BaseTestCase):
    """Test QR code attendance system"""
    
    def setUp(self):
        super().setUp()
        self.event = Event.objects.create(
            title='QR Test Event',
            event_type='TEKNIK',
            start_time=timezone.now() - timedelta(hours=1),  # Started 1 hour ago
            end_time=timezone.now() + timedelta(hours=1),  # Ends in 1 hour
            location='Test Location',
            attendance_points=20,
            created_by=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        # Generate QR code
        self.event.generate_qr_code()
        self.event.save()
    
    def test_scan_qr_code_success(self):
        """Test successful QR code scan"""
        self.authenticate_member()
        url = reverse('event-scan-qr', kwargs={'pk': self.event.id})
        data = {
            'qr_data': self.event.qr_code_data
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        # Check attendance was created
        attendance = EventAttendance.objects.filter(
            event=self.event,
            user=self.member_user
        ).first()
        self.assertIsNotNone(attendance)
        self.assertEqual(attendance.points_earned, 20)
    
    def test_scan_qr_code_duplicate(self):
        """Test that duplicate scans are prevented"""
        # First scan
        EventAttendance.objects.create(
            event=self.event,
            user=self.member_user,
            points_earned=20
        )
        
        # Try to scan again
        self.authenticate_member()
        url = reverse('event-scan-qr', kwargs={'pk': self.event.id})
        data = {
            'qr_data': self.event.qr_code_data
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 400)
    
    def test_scan_expired_qr_code(self):
        """Test scanning expired QR code"""
        # Create event that ended more than 1 hour ago
        past_event = Event.objects.create(
            title='Past Event',
            event_type='SOSYAL',
            start_time=timezone.now() - timedelta(days=1, hours=3),
            end_time=timezone.now() - timedelta(days=1, hours=1, minutes=30),
            location='Past Location',
            attendance_points=15,
            created_by=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        past_event.generate_qr_code()
        past_event.save()
        
        self.authenticate_member()
        url = reverse('event-scan-qr', kwargs={'pk': past_event.id})
        data = {
            'qr_data': past_event.qr_code_data
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 400)
    
    def test_attendance_awards_points(self):
        """Test that attendance awards points to user"""
        initial_points = self.member_user.total_points
        
        EventAttendance.objects.create(
            event=self.event,
            user=self.member_user,
            points_earned=self.event.attendance_points
        )
        
        self.member_user.refresh_from_db()
        self.assertEqual(
            self.member_user.total_points,
            initial_points + self.event.attendance_points
        )


class EventAttendanceListTests(BaseTestCase):
    """Test event attendance listing"""
    
    def setUp(self):
        super().setUp()
        self.event = Event.objects.create(
            title='Attendance Test',
            event_type='EGITIM',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=2),
            location='Test Location',
            attendance_points=25,
            created_by=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        
        # Create attendances
        EventAttendance.objects.create(
            event=self.event,
            user=self.member_user,
            points_earned=25
        )
        EventAttendance.objects.create(
            event=self.event,
            user=self.committee_leader,
            points_earned=25
        )
    
    def test_get_event_attendances(self):
        """Test retrieving event attendances"""
        self.authenticate_admin()
        url = reverse('event-attendances', kwargs={'pk': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
    
    def test_my_events_endpoint(self):
        """Test retrieving user's attended events"""
        self.authenticate_member()
        url = reverse('event-my-events')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)


class EventApprovalTests(BaseTestCase):
    """Test event approval workflow"""
    
    def setUp(self):
        super().setUp()
        self.pending_event = Event.objects.create(
            title='Pending Event',
            description='Needs approval',
            event_type='PROJE',
            start_time=timezone.now() + timedelta(days=3),
            end_time=timezone.now() + timedelta(days=3, hours=4),
            location='Pending Location',
            attendance_points=40,
            created_by=self.committee_leader,
            approval_status='PENDING',
            is_active=False
        )
    
    def test_approve_event_as_admin(self):
        """Test approving event as admin"""
        self.authenticate_admin()
        url = reverse('event-approve', kwargs={'pk': self.pending_event.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.pending_event.refresh_from_db()
        self.assertEqual(self.pending_event.approval_status, 'APPROVED')
        self.assertTrue(self.pending_event.is_active)
