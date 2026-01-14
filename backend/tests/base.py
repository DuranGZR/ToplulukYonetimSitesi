"""
Base test class for HSD Platform tests
Provides common test setup and helper methods
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from committees.models import Committee
from activity.models import LevelThreshold

User = get_user_model()


class BaseTestCase(TestCase):
    """Base test case with common setup"""
    
    def setUp(self):
        """Set up test data"""
        # Create level thresholds
        self.create_level_thresholds()
        
        # Create test users with different roles
        self.admin_user = User.objects.create_user(
            username='testadmin',
            email='admin@test.com',
            password='testpass123',
            role='BASKAN',
            first_name='Test',
            last_name='Admin'
        )
        
        self.vice_president_user = User.objects.create_user(
            username='testvice',
            email='vice@test.com',
            password='testpass123',
            role='BASKAN_YARDIMCISI',
            first_name='Test',
            last_name='Vice'
        )
        
        self.committee_leader = User.objects.create_user(
            username='testleader',
            email='leader@test.com',
            password='testpass123',
            role='KOMITE_LIDERI',
            first_name='Test',
            last_name='Leader'
        )
        
        self.committee_vice = User.objects.create_user(
            username='testviceleader',
            email='viceleader@test.com',
            password='testpass123',
            role='KOMITE_YARDIMCISI',
            first_name='Test',
            last_name='Vice Leader'
        )
        
        self.member_user = User.objects.create_user(
            username='testmember',
            email='member@test.com',
            password='testpass123',
            role='UYE',
            first_name='Test',
            last_name='Member'
        )
        
        # Create test committee
        self.committee = Committee.objects.create(
            name='Test Komite',
            description='Test komitesi',
            leader=self.committee_leader,
            vice_leader=self.committee_vice
        )
        self.committee.members.add(self.committee_leader, self.committee_vice, self.member_user)
        
        # Setup API client
        self.client = APIClient()
        
    def create_level_thresholds(self):
        """Create level thresholds for testing"""
        thresholds = [
            (1, 0),
            (2, 100),
            (3, 250),
            (4, 500),
            (5, 1000),
            (6, 2000),
            (7, 3500),
            (8, 5000),
            (9, 7500),
            (10, 10000),
        ]
        for level, min_points in thresholds:
            LevelThreshold.objects.get_or_create(level=level, min_points=min_points)
    
    def authenticate_user(self, user):
        """Authenticate a user and return token (access, refresh)"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return str(refresh.access_token), str(refresh)
    
    def authenticate_admin(self):
        """Authenticate as admin user"""
        return self.authenticate_user(self.admin_user)
    
    def authenticate_vice_president(self):
        """Authenticate as vice president user"""
        return self.authenticate_user(self.vice_president_user)
    
    def authenticate_committee_leader(self):
        """Authenticate as committee leader"""
        return self.authenticate_user(self.committee_leader)
    
    def authenticate_committee_vice(self):
        """Authenticate as committee vice leader"""
        return self.authenticate_user(self.committee_vice)
    
    def authenticate_member(self):
        """Authenticate as regular member"""
        return self.authenticate_user(self.member_user)
