"""
Test cases for Meeting Management System
"""
from django.urls import reverse
from tests.base import BaseTestCase
from meetings.models import Meeting, MeetingAttendance
from datetime import datetime, timedelta
from django.utils import timezone


class MeetingManagementTests(BaseTestCase):
    """Test meeting CRUD operations"""
    
    def setUp(self):
        super().setUp()
        self.meeting = Meeting.objects.create(
            title='Committee Meeting',
            description='Monthly committee meeting',
            meeting_type='KOMITE',
            date_time=timezone.now() + timedelta(days=1),
            location='Meeting Room',
            duration=60,
            committee=self.committee,
            is_general=False
        )
    
    def test_list_meetings(self):
        """Test listing meetings"""
        self.authenticate_committee_leader()
        url = reverse('meeting-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_create_committee_meeting_as_leader(self):
        """Test creating committee meeting as committee leader"""
        self.authenticate_committee_leader()
        url = reverse('meeting-list')
        data = {
            'title': 'New Committee Meeting',
            'description': 'Planning session',
            'meeting_type': 'KOMITE',
            'date_time': (timezone.now() + timedelta(days=2)).isoformat(),
            'location': 'Conference Room',
            'duration': 90,
            'committee': self.committee.id,
            'is_general': False,
            'agenda_items': ['Item 1', 'Item 2']
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 201)
    
    def test_create_general_meeting_as_admin(self):
        """Test creating general meeting as admin"""
        self.authenticate_admin()
        url = reverse('meeting-list')
        data = {
            'title': 'General Assembly',
            'description': 'Annual general meeting',
            'meeting_type': 'GENEL_KURUL',
            'date_time': (timezone.now() + timedelta(days=7)).isoformat(),
            'location': 'Main Hall',
            'duration': 120,
            'is_general': True
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 201)
    
    def test_member_cannot_create_meeting(self):
        """Test that regular member cannot create meeting"""
        self.authenticate_member()
        url = reverse('meeting-list')
        data = {
            'title': 'Unauthorized Meeting',
            'meeting_type': 'KOMITE',
            'date_time': (timezone.now() + timedelta(days=1)).isoformat(),
            'location': 'Room',
            'duration': 60,
            'committee': self.committee.id
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 403)
    
    def test_update_meeting_notes(self):
        """Test updating meeting notes as admin"""
        self.authenticate_admin()
        url = reverse('meeting-update-notes', kwargs={'pk': self.meeting.id})
        data = {
            'notes': 'Meeting notes content',
            'decisions': ['Decision 1', 'Decision 2'],
            'actions': ['Action 1', 'Action 2']
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.meeting.refresh_from_db()
        self.assertEqual(self.meeting.notes, 'Meeting notes content')
        self.assertEqual(len(self.meeting.decisions), 2)


class MeetingQRAttendanceTests(BaseTestCase):
    """Test meeting QR attendance system"""
    
    def setUp(self):
        super().setUp()
        self.meeting = Meeting.objects.create(
            title='QR Meeting Test',
            meeting_type='KOORDINASYON',
            date_time=timezone.now(),
            location='Test Room',
            duration=60,
            is_general=True
        )
        # Generate QR code
        self.meeting.generate_qr_code()
        self.meeting.save()
    
    def test_scan_meeting_qr_success(self):
        """Test successful meeting QR scan"""
        self.authenticate_member()
        url = reverse('meeting-scan-qr', kwargs={'pk': self.meeting.id})
        data = {
            'qr_data': self.meeting.qr_code_data
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        # Check attendance was created
        attendance = MeetingAttendance.objects.filter(
            meeting=self.meeting,
            user=self.member_user
        ).first()
        self.assertIsNotNone(attendance)
        self.assertEqual(attendance.points_earned, 5)  # Default meeting points
    
    def test_scan_meeting_qr_duplicate(self):
        """Test that duplicate meeting scans are prevented"""
        # First scan
        MeetingAttendance.objects.create(
            meeting=self.meeting,
            user=self.member_user,
            points_earned=5
        )
        
        # Try to scan again
        self.authenticate_member()
        url = reverse('meeting-scan-qr', kwargs={'pk': self.meeting.id})
        data = {
            'qr_data': self.meeting.qr_code_data
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 400)
    
    def test_get_meeting_attendances(self):
        """Test retrieving meeting attendances"""
        # Create attendances
        MeetingAttendance.objects.create(
            meeting=self.meeting,
            user=self.member_user,
            points_earned=5
        )
        MeetingAttendance.objects.create(
            meeting=self.meeting,
            user=self.committee_leader,
            points_earned=5
        )
        
        self.authenticate_admin()
        url = reverse('meeting-attendances', kwargs={'pk': self.meeting.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)


class MeetingPermissionTests(BaseTestCase):
    """Test meeting permission system"""
    
    def setUp(self):
        super().setUp()
        self.committee_meeting = Meeting.objects.create(
            title='Committee Only Meeting',
            meeting_type='KOMITE',
            date_time=timezone.now() + timedelta(days=1),
            location='Private Room',
            duration=60,
            committee=self.committee,
            is_general=False
        )
        
        self.general_meeting = Meeting.objects.create(
            title='General Meeting',
            meeting_type='GENEL_KURUL',
            date_time=timezone.now() + timedelta(days=1),
            location='Public Hall',
            duration=90,
            is_general=True
        )
    
    def test_committee_member_can_view_committee_meeting(self):
        """Test that committee member can view committee meeting"""
        self.authenticate_member()  # member is in committee
        url = reverse('meeting-detail', kwargs={'pk': self.committee_meeting.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
    
    def test_non_committee_member_cannot_view_committee_meeting(self):
        """Test that non-committee member cannot view committee meeting"""
        # Create user not in committee
        non_member = self.vice_president_user
        self.authenticate_vice_president()
        url = reverse('meeting-detail', kwargs={'pk': self.committee_meeting.id})
        response = self.client.get(url)
        
        # Vice president (admin) can view all meetings
        self.assertEqual(response.status_code, 200)
    
    def test_anyone_can_view_general_meeting(self):
        """Test that any user can view general meeting"""
        self.authenticate_member()
        url = reverse('meeting-detail', kwargs={'pk': self.general_meeting.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)


class MeetingFilterTests(BaseTestCase):
    """Test meeting filtering"""
    
    def setUp(self):
        super().setUp()
        # Create upcoming and past meetings
        self.upcoming = Meeting.objects.create(
            title='Upcoming Meeting',
            meeting_type='EGITIM',
            date_time=timezone.now() + timedelta(days=3),
            location='Room A',
            duration=60,
            is_general=True
        )
        
        self.past = Meeting.objects.create(
            title='Past Meeting',
            meeting_type='KOORDINASYON',
            date_time=timezone.now() - timedelta(days=2),
            location='Room B',
            duration=90,
            is_general=True
        )
    
    def test_my_meetings_endpoint(self):
        """Test retrieving user's meetings"""
        self.authenticate_committee_leader()
        url = reverse('meeting-my-meetings')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
    
    def test_upcoming_meetings_endpoint(self):
        """Test retrieving upcoming meetings"""
        self.authenticate_member()
        url = reverse('meeting-upcoming')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        # Should include upcoming meeting
        meeting_ids = [m['id'] for m in response.data]
        self.assertIn(self.upcoming.id, meeting_ids)
