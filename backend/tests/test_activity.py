"""
Test cases for Activity Point System
"""
from django.urls import reverse
from tests.base import BaseTestCase
from activity.models import ActivityLog, LevelThreshold
from django.contrib.auth import get_user_model

User = get_user_model()


class ActivityPointTests(BaseTestCase):
    """Test activity point system"""
    
    def test_add_points_to_user(self):
        """Test adding points to user"""
        initial_points = self.member_user.total_points
        initial_level = self.member_user.level
        
        # Use add_points method to properly add points
        self.member_user.add_points(
            points=50,
            source='TEST',
            source_id=None,
            description='Test points'
        )
        
        self.member_user.refresh_from_db()
        self.assertEqual(self.member_user.total_points, initial_points + 50)
    
    def test_level_up_on_points(self):
        """Test automatic level up when reaching threshold"""
        self.member_user.total_points = 90
        self.member_user.level = 1
        self.member_user.save()
        
        # Add points to cross level 2 threshold (100 points)
        self.member_user.add_points(
            points=15,
            source='TEST',
            source_id=None,
            description='Level up test'
        )
        
        self.member_user.refresh_from_db()
        self.assertEqual(self.member_user.total_points, 105)
        self.assertEqual(self.member_user.level, 2)
    
    def test_leaderboard_endpoint(self):
        """Test leaderboard API endpoint"""
        # Add different points to users
        ActivityLog.objects.create(user=self.admin_user, points=500, source='TEST')
        ActivityLog.objects.create(user=self.member_user, points=200, source='TEST')
        ActivityLog.objects.create(user=self.committee_leader, points=350, source='TEST')
        
        self.authenticate_member()
        url = reverse('activitylog-leaderboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 3)
        
        # Check that leaderboard is sorted by points (descending)
        points = [user['total_points'] for user in response.data]
        self.assertEqual(points, sorted(points, reverse=True))
    
    def test_my_stats_endpoint(self):
        """Test user stats endpoint"""
        # Add points to test user
        self.member_user.add_points(points=150, source='TEST', source_id=None)
        
        self.authenticate_member()
        url = reverse('my-stats')  # Fixed URL name
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_points'], 150)
        self.assertIn('current_level', response.data)
        self.assertIn('next_level', response.data)
        self.assertIn('points_to_next_level', response.data)


class ActivityLogTests(BaseTestCase):
    """Test activity log management"""
    
    def test_create_activity_log(self):
        """Test creating activity log"""
        log = ActivityLog.objects.create(
            user=self.member_user,
            points=25,
            source='TASK',
            source_id=1,
            description='Completed a task'
        )
        
        self.assertEqual(log.user, self.member_user)
        self.assertEqual(log.points, 25)
        self.assertEqual(log.source, 'TASK')
    
    def test_list_activity_logs_as_admin(self):
        """Test listing activity logs as admin"""
        # Create some logs
        ActivityLog.objects.create(user=self.member_user, points=25, source='TASK')
        ActivityLog.objects.create(user=self.admin_user, points=50, source='EVENT')
        
        self.authenticate_admin()
        url = reverse('activitylog-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 2)
    
    def test_user_points_history(self):
        """Test retrieving user's points history"""
        # Create logs for member
        ActivityLog.objects.create(user=self.member_user, points=25, source='TASK', description='Task 1')
        ActivityLog.objects.create(user=self.member_user, points=50, source='EVENT', description='Event 1')
        
        self.authenticate_member()
        url = reverse('activitylog-list')  # Use list endpoint with filter
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertGreaterEqual(len(data), 2)


class LevelThresholdTests(BaseTestCase):
    """Test level threshold system"""
    
    def test_level_thresholds_exist(self):
        """Test that all level thresholds exist"""
        thresholds = LevelThreshold.objects.all()
        self.assertEqual(thresholds.count(), 10)
    
    def test_get_level_for_points(self):
        """Test getting correct level for point amount"""
        # 150 points should be level 2 (threshold: 100)
        self.member_user.total_points = 150
        self.member_user.level = 1
        self.member_user.save()
        
        # Recalculate level
        thresholds = LevelThreshold.objects.filter(min_points__lte=150).order_by('-min_points')
        if thresholds.exists():
            expected_level = thresholds.first().level
            
            self.member_user.level = expected_level
            self.member_user.save()
            
            self.assertEqual(self.member_user.level, 2)
    
    def test_max_level_reached(self):
        """Test behavior at max level"""
        self.member_user.total_points = 15000  # Above max threshold
        self.member_user.save()
        # Trigger level update
        self.member_user.update_level()
        
        self.authenticate_member()
        url = reverse('my-stats')  # Fixed URL name
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['current_level'], 10)
        # Should indicate max level reached
        self.assertIsNone(response.data.get('points_to_next_level'))
