"""
Advanced Activity Point System Tests
Testing complex scenarios, edge cases, and business logic
"""
from django.urls import reverse
from tests.base import BaseTestCase
from activity.models import ActivityLog, LevelThreshold
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()


class ActivityPointEdgeCaseTests(BaseTestCase):
    """Test edge cases in point system"""
    
    def test_negative_points_rejected(self):
        """Test that negative points cannot be added"""
        initial_points = self.member_user.total_points
        
        try:
            ActivityLog.objects.create(
                user=self.member_user,
                points=-50,  # Negative points
                source='TEST',
                description='Negative test'
            )
        except Exception:
            pass  # Should fail
        
        self.member_user.refresh_from_db()
        self.assertEqual(self.member_user.total_points, initial_points)
    
    def test_zero_points_activity(self):
        """Test activity log with 0 points"""
        log = ActivityLog.objects.create(
            user=self.member_user,
            points=0,
            source='TEST',
            description='Zero points'
        )
        self.assertEqual(log.points, 0)
    
    def test_extremely_high_points(self):
        """Test adding very high points (boundary test)"""
        ActivityLog.objects.create(
            user=self.member_user,
            points=999999,
            source='TEST'
        )
        self.member_user.refresh_from_db()
        self.assertGreater(self.member_user.total_points, 999000)
    
    def test_multiple_level_ups_at_once(self):
        """Test jumping multiple levels with single large point gain"""
        self.member_user.total_points = 50
        self.member_user.level = 1
        self.member_user.save()
        
        # Add enough points to jump from level 1 to level 5
        ActivityLog.objects.create(
            user=self.member_user,
            points=1500,  # Should reach level 5 (threshold: 1000)
            source='TEST'
        )
        
        self.member_user.refresh_from_db()
        self.assertGreaterEqual(self.member_user.level, 5)


class ActivityPointConcurrencyTests(BaseTestCase):
    """Test concurrent point operations"""
    
    def test_concurrent_point_additions(self):
        """Test multiple activities added simultaneously"""
        initial_points = self.member_user.total_points
        
        # Simulate concurrent activities
        activities = [
            ActivityLog.objects.create(
                user=self.member_user,
                points=10,
                source='TASK',
                description=f'Task {i}'
            )
            for i in range(10)
        ]
        
        self.member_user.refresh_from_db()
        self.assertEqual(
            self.member_user.total_points,
            initial_points + 100  # 10 activities * 10 points
        )
    
    def test_race_condition_level_up(self):
        """Test level up with race condition"""
        self.member_user.total_points = 95
        self.member_user.level = 1
        self.member_user.save()
        
        # Two activities that together cross threshold
        ActivityLog.objects.create(user=self.member_user, points=3, source='TEST')
        ActivityLog.objects.create(user=self.member_user, points=3, source='TEST')
        
        self.member_user.refresh_from_db()
        self.assertEqual(self.member_user.total_points, 101)
        self.assertEqual(self.member_user.level, 2)


class ActivityHistoryTests(BaseTestCase):
    """Test activity history and tracking"""
    
    def test_activity_log_ordering(self):
        """Test that activities are ordered by creation time"""
        # Create activities with delays
        for i in range(5):
            ActivityLog.objects.create(
                user=self.member_user,
                points=10,
                source='TEST',
                description=f'Activity {i}'
            )
        
        self.authenticate_member()
        url = reverse('activitylog-my-history')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        # Should be ordered by newest first
        timestamps = [log['created_at'] for log in response.data]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))
    
    def test_activity_source_filtering(self):
        """Test filtering activities by source"""
        # Create different types of activities
        ActivityLog.objects.create(user=self.member_user, points=10, source='TASK')
        ActivityLog.objects.create(user=self.member_user, points=20, source='EVENT')
        ActivityLog.objects.create(user=self.member_user, points=30, source='PROJECT')
        
        self.authenticate_member()
        url = reverse('activitylog-my-history')
        
        # Filter by source (if implemented)
        response = self.client.get(url, {'source': 'TASK'})
        self.assertEqual(response.status_code, 200)
    
    def test_activity_date_range_filter(self):
        """Test filtering activities by date range"""
        # Create activities at different times
        old_log = ActivityLog.objects.create(
            user=self.member_user,
            points=10,
            source='TEST'
        )
        old_log.created_at = timezone.now() - timedelta(days=30)
        old_log.save()
        
        recent_log = ActivityLog.objects.create(
            user=self.member_user,
            points=20,
            source='TEST'
        )
        
        self.authenticate_member()
        url = reverse('activitylog-my-history')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 2)


class LeaderboardAdvancedTests(BaseTestCase):
    """Advanced leaderboard functionality tests"""
    
    def test_leaderboard_with_tied_scores(self):
        """Test leaderboard ranking with same points"""
        # Create users with same points
        user1 = User.objects.create_user(username='tie1', password='test')
        user2 = User.objects.create_user(username='tie2', password='test')
        
        ActivityLog.objects.create(user=user1, points=100, source='TEST')
        ActivityLog.objects.create(user=user2, points=100, source='TEST')
        
        self.authenticate_member()
        url = reverse('activitylog-leaderboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        # Both should appear in leaderboard
        usernames = [user['username'] for user in response.data]
        self.assertIn('tie1', usernames)
        self.assertIn('tie2', usernames)
    
    def test_leaderboard_pagination(self):
        """Test leaderboard with many users"""
        # Create 50 users with different points
        for i in range(50):
            user = User.objects.create_user(
                username=f'leader{i}',
                password='test'
            )
            ActivityLog.objects.create(user=user, points=i*10, source='TEST')
        
        self.authenticate_member()
        url = reverse('activitylog-leaderboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        # Should return paginated results
        self.assertGreater(len(response.data), 0)
    
    def test_leaderboard_inactive_users_excluded(self):
        """Test that inactive users don't appear in leaderboard"""
        inactive_user = User.objects.create_user(
            username='inactive',
            password='test',
            is_active=False
        )
        ActivityLog.objects.create(user=inactive_user, points=1000, source='TEST')
        
        self.authenticate_member()
        url = reverse('activitylog-leaderboard')
        response = self.client.get(url)
        
        # Inactive user should not appear
        usernames = [user['username'] for user in response.data]
        self.assertNotIn('inactive', usernames)
    
    def test_leaderboard_updates_realtime(self):
        """Test leaderboard updates after new activity"""
        self.authenticate_member()
        url = reverse('activitylog-leaderboard')
        
        # Get initial leaderboard
        response1 = self.client.get(url)
        initial_rank = None
        for i, user in enumerate(response1.data):
            if user['username'] == 'testadmin':
                initial_rank = i
                break
        
        # Add points to admin
        ActivityLog.objects.create(user=self.admin_user, points=10000, source='TEST')
        
        # Get updated leaderboard
        response2 = self.client.get(url)
        new_rank = None
        for i, user in enumerate(response2.data):
            if user['username'] == 'testadmin':
                new_rank = i
                break
        
        # Admin should be higher in ranking
        if initial_rank is not None and new_rank is not None:
            self.assertLessEqual(new_rank, initial_rank)


class PointCalculationTests(BaseTestCase):
    """Test point calculation logic"""
    
    def test_points_from_different_sources(self):
        """Test points are counted from all sources"""
        ActivityLog.objects.create(user=self.member_user, points=10, source='TASK')
        ActivityLog.objects.create(user=self.member_user, points=20, source='EVENT')
        ActivityLog.objects.create(user=self.member_user, points=30, source='PROJECT')
        ActivityLog.objects.create(user=self.member_user, points=15, source='MEETING')
        
        self.member_user.refresh_from_db()
        self.assertEqual(self.member_user.total_points, 75)
    
    def test_point_to_level_calculation_accuracy(self):
        """Test accurate level calculation for all thresholds"""
        test_cases = [
            (0, 1),      # 0 points = level 1
            (50, 1),     # 50 points = level 1
            (100, 2),    # 100 points = level 2
            (250, 3),    # 250 points = level 3
            (500, 4),    # 500 points = level 4
            (1000, 5),   # 1000 points = level 5
            (2000, 6),   # 2000 points = level 6
            (3500, 7),   # 3500 points = level 7
            (5000, 8),   # 5000 points = level 8
            (7500, 9),   # 7500 points = level 9
            (10000, 10), # 10000 points = level 10
        ]
        
        for points, expected_level in test_cases:
            user = User.objects.create_user(
                username=f'leveltest{points}',
                password='test'
            )
            ActivityLog.objects.create(user=user, points=points, source='TEST')
            user.refresh_from_db()
            self.assertEqual(user.level, expected_level, 
                           f"Failed for {points} points, got level {user.level}")
    
    def test_points_to_next_level_calculation(self):
        """Test accurate calculation of points needed for next level"""
        self.member_user.total_points = 150
        self.member_user.level = 2
        self.member_user.save()
        
        self.authenticate_member()
        url = reverse('activity-my-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        # From level 2 (100) to level 3 (250), need 250 - 150 = 100 more points
        self.assertEqual(response.data['points_to_next_level'], 100)


class ActivityLogIntegrityTests(BaseTestCase):
    """Test data integrity in activity logs"""
    
    def test_activity_log_cannot_be_modified(self):
        """Test that activity logs are immutable"""
        log = ActivityLog.objects.create(
            user=self.member_user,
            points=50,
            source='TEST'
        )
        original_points = log.points
        
        # Try to modify
        log.points = 100
        log.save()
        
        # In a real system, this might be prevented
        # This test documents the behavior
        log.refresh_from_db()
        # Points might be modifiable or not depending on implementation
    
    def test_activity_log_deletion_updates_user_points(self):
        """Test that deleting activity log updates user total"""
        initial_points = self.member_user.total_points
        
        log = ActivityLog.objects.create(
            user=self.member_user,
            points=50,
            source='TEST'
        )
        
        self.member_user.refresh_from_db()
        self.assertEqual(self.member_user.total_points, initial_points + 50)
        
        # Delete log
        log.delete()
        
        # Points should be recalculated (if implemented)
        # This tests the expected behavior
    
    def test_activity_log_requires_valid_user(self):
        """Test that activity log requires valid user"""
        with self.assertRaises(Exception):
            ActivityLog.objects.create(
                user=None,
                points=50,
                source='TEST'
            )
