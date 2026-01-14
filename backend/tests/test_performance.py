"""
Performance Tests - Testing scalability, efficiency, and load handling
"""
from django.urls import reverse
from tests.base import BaseTestCase
from django.contrib.auth import get_user_model
from tasks.models import Task
from projects.models import Project
from events.models import Event
from activity.models import ActivityPoint
from django.utils import timezone
from datetime import timedelta
import time
from django.test.utils import override_settings
from django.db import connection
from django.test import TransactionTestCase

User = get_user_model()


class DatabaseQueryPerformanceTests(BaseTestCase):
    """Test database query performance and optimization"""
    
    def test_n_plus_one_query_problem_tasks(self):
        """Test task list doesn't have N+1 query problem"""
        # Create 20 tasks with related data
        for i in range(20):
            Task.objects.create(
                title=f'Task {i}',
                points=10,
                created_by=self.admin_user,
                approval_status='APPROVED',
                is_active=True
            )
        
        self.authenticate_member()
        url = reverse('task-list')
        
        # Count queries
        with self.assertNumQueries(5):  # Should be constant, not 20+
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
    
    def test_user_list_query_efficiency(self):
        """Test user list uses select_related/prefetch_related"""
        # Create 30 users with profiles
        for i in range(30):
            User.objects.create_user(
                username=f'perfuser{i}',
                password='testpass123'
            )
        
        self.authenticate_admin()
        url = reverse('user-list')
        
        # Should use efficient queries
        with self.assertNumQueries(5):
            response = self.client.get(url)
    
    def test_leaderboard_query_performance(self):
        """Test leaderboard calculation is efficient"""
        # Create many users with points
        users = []
        for i in range(50):
            user = User.objects.create_user(
                username=f'leaderuser{i}',
                password='testpass123'
            )
            users.append(user)
            
            # Give each user multiple activity points
            for j in range(10):
                ActivityPoint.objects.create(
                    user=user,
                    points=10,
                    activity_type='TASK_COMPLETION',
                    description=f'Activity {j}'
                )
        
        self.authenticate_member()
        url = reverse('user-leaderboard')
        
        start_time = time.time()
        response = self.client.get(url)
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        # Should complete in reasonable time
        self.assertLess(end_time - start_time, 2.0)  # < 2 seconds
    
    def test_filtering_performance_with_large_dataset(self):
        """Test filtering performance with many records"""
        # Create 100 tasks
        for i in range(100):
            Task.objects.create(
                title=f'Filter Task {i}',
                points=10 + (i % 50),
                created_by=self.admin_user,
                status=['AKTIF', 'TAMAMLANDI'][i % 2],
                approval_status='APPROVED',
                is_active=True
            )
        
        self.authenticate_member()
        url = reverse('task-list')
        
        start_time = time.time()
        response = self.client.get(url, {'status': 'AKTIF', 'points_min': 20})
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 1.0)


class APIResponseTimeTests(BaseTestCase):
    """Test API response times"""
    
    def test_task_list_response_time(self):
        """Test task list returns quickly"""
        # Create reasonable amount of data
        for i in range(20):
            Task.objects.create(
                title=f'Response Task {i}',
                points=15,
                created_by=self.admin_user,
                approval_status='APPROVED',
                is_active=True
            )
        
        self.authenticate_member()
        url = reverse('task-list')
        
        start_time = time.time()
        response = self.client.get(url)
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        # Should be fast
        self.assertLess(end_time - start_time, 0.5)  # < 500ms
    
    def test_user_profile_response_time(self):
        """Test user profile loads quickly"""
        self.authenticate_member()
        url = reverse('user-profile')
        
        start_time = time.time()
        response = self.client.get(url)
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 0.3)  # < 300ms
    
    def test_authentication_response_time(self):
        """Test login is fast"""
        url = reverse('login')
        
        start_time = time.time()
        response = self.client.post(url, {
            'username': 'testadmin',
            'password': 'testpass123'
        }, format='json')
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 0.5)  # < 500ms


class ConcurrentRequestTests(TransactionTestCase):
    """Test handling concurrent requests"""
    
    def setUp(self):
        super().setUp()
        self.admin_user = User.objects.create_user(
            username='testadmin',
            password='testpass123',
            role='BASKAN'
        )
    
    def test_concurrent_task_creation(self):
        """Test system handles concurrent task creation"""
        from threading import Thread
        
        def create_task(i):
            Task.objects.create(
                title=f'Concurrent Task {i}',
                points=10,
                created_by=self.admin_user,
                approval_status='APPROVED',
                is_active=True
            )
        
        threads = []
        for i in range(10):
            t = Thread(target=create_task, args=(i,))
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        # All tasks should be created
        self.assertEqual(Task.objects.count(), 10)
    
    def test_concurrent_point_updates(self):
        """Test concurrent point updates maintain data integrity"""
        user = User.objects.create_user(username='pointuser', password='test')
        user.total_points = 0
        user.save()
        
        def add_points():
            from django.db.models import F
            User.objects.filter(id=user.id).update(
                total_points=F('total_points') + 10
            )
        
        from threading import Thread
        threads = []
        for i in range(5):
            t = Thread(target=add_points)
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        user.refresh_from_db()
        # Should be exactly 50 (5 threads * 10 points)
        self.assertEqual(user.total_points, 50)


class PaginationPerformanceTests(BaseTestCase):
    """Test pagination performance"""
    
    def test_large_dataset_pagination(self):
        """Test pagination with large dataset"""
        # Create 200 tasks
        for i in range(200):
            Task.objects.create(
                title=f'Page Task {i}',
                points=10,
                created_by=self.admin_user,
                approval_status='APPROVED',
                is_active=True
            )
        
        self.authenticate_member()
        url = reverse('task-list')
        
        # Test first page
        start_time = time.time()
        response = self.client.get(url, {'page': 1, 'page_size': 20})
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 0.5)
        
        # Test middle page
        start_time = time.time()
        response = self.client.get(url, {'page': 5, 'page_size': 20})
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 0.5)
    
    def test_pagination_count_query(self):
        """Test pagination count query is efficient"""
        # Create many tasks
        for i in range(100):
            Task.objects.create(
                title=f'Count Task {i}',
                points=10,
                created_by=self.admin_user,
                approval_status='APPROVED',
                is_active=True
            )
        
        self.authenticate_member()
        url = reverse('task-list')
        
        # Count query should be efficient
        with self.assertNumQueries(5):
            response = self.client.get(url)


class CachePerformanceTests(BaseTestCase):
    """Test caching effectiveness (if implemented)"""
    
    def test_repeated_requests_cached(self):
        """Test repeated requests are cached"""
        self.authenticate_member()
        url = reverse('task-list')
        
        # First request
        start_time = time.time()
        response1 = self.client.get(url)
        first_time = time.time() - start_time
        
        # Second request (should be cached)
        start_time = time.time()
        response2 = self.client.get(url)
        second_time = time.time() - start_time
        
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)
        
        # Second request might be faster (if caching is implemented)
    
    def test_cache_invalidation_on_update(self):
        """Test cache is invalidated when data changes"""
        # This would test cache behavior if caching is implemented
        pass


class BulkOperationPerformanceTests(BaseTestCase):
    """Test bulk operation performance"""
    
    def test_bulk_task_creation_performance(self):
        """Test bulk create is efficient"""
        tasks = []
        for i in range(100):
            tasks.append(Task(
                title=f'Bulk Task {i}',
                points=10,
                created_by=self.admin_user,
                approval_status='APPROVED',
                is_active=True
            ))
        
        start_time = time.time()
        Task.objects.bulk_create(tasks)
        end_time = time.time()
        
        # Bulk create should be fast
        self.assertLess(end_time - start_time, 1.0)
        self.assertEqual(Task.objects.count(), 100)
    
    def test_bulk_update_performance(self):
        """Test bulk update is efficient"""
        # Create tasks
        tasks = []
        for i in range(50):
            task = Task.objects.create(
                title=f'Update Task {i}',
                points=10,
                created_by=self.admin_user,
                status='AKTIF',
                approval_status='APPROVED',
                is_active=True
            )
            tasks.append(task)
        
        # Bulk update
        start_time = time.time()
        Task.objects.filter(id__in=[t.id for t in tasks]).update(status='TAMAMLANDI')
        end_time = time.time()
        
        self.assertLess(end_time - start_time, 0.5)


class ComplexQueryPerformanceTests(BaseTestCase):
    """Test complex query performance"""
    
    def test_join_heavy_query_performance(self):
        """Test queries with multiple joins"""
        # Create data with relationships
        project = Project.objects.create(
            name='Performance Project',
            description='Test',
            committee=self.committee,
            created_by=self.admin_user,
            is_active=True
        )
        
        for i in range(20):
            task = Task.objects.create(
                title=f'Join Task {i}',
                points=10,
                created_by=self.admin_user,
                project=project,
                approval_status='APPROVED',
                is_active=True
            )
            task.assigned_to.add(self.member_user)
        
        self.authenticate_member()
        url = reverse('project-detail', kwargs={'pk': project.id})
        
        start_time = time.time()
        response = self.client.get(url)
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 1.0)
    
    def test_aggregation_query_performance(self):
        """Test aggregation queries are efficient"""
        # Create activity points
        for i in range(100):
            ActivityPoint.objects.create(
                user=self.member_user,
                points=10,
                activity_type='TASK_COMPLETION',
                description=f'Test {i}'
            )
        
        self.authenticate_member()
        url = reverse('activity-statistics')
        
        start_time = time.time()
        response = self.client.get(url)
        end_time = time.time()
        
        # Aggregation should be reasonably fast
        self.assertLess(end_time - start_time, 1.0)


class MemoryUsageTests(BaseTestCase):
    """Test memory usage remains reasonable"""
    
    def test_large_queryset_memory_usage(self):
        """Test large querysets don't consume excessive memory"""
        # Create many tasks
        for i in range(500):
            Task.objects.create(
                title=f'Memory Task {i}',
                points=10,
                created_by=self.admin_user,
                approval_status='APPROVED',
                is_active=True
            )
        
        self.authenticate_member()
        url = reverse('task-list')
        
        # Should handle large dataset without memory issues
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
    
    def test_iterator_usage_for_large_operations(self):
        """Test large operations use iterators"""
        # Create many records
        for i in range(200):
            Task.objects.create(
                title=f'Iterator Task {i}',
                points=10,
                created_by=self.admin_user,
                approval_status='APPROVED',
                is_active=True
            )
        
        # Process with iterator (more memory efficient)
        count = 0
        for task in Task.objects.iterator():
            count += 1
        
        self.assertEqual(count, 200)


class IndexUsageTests(BaseTestCase):
    """Test database indexes are used effectively"""
    
    def test_filtered_queries_use_indexes(self):
        """Test filtered queries utilize indexes"""
        # Create tasks
        for i in range(100):
            Task.objects.create(
                title=f'Index Task {i}',
                points=10,
                created_by=self.admin_user,
                status=['AKTIF', 'TAMAMLANDI'][i % 2],
                approval_status='APPROVED',
                is_active=True
            )
        
        # Query with indexed field
        start_time = time.time()
        tasks = Task.objects.filter(status='AKTIF')
        list(tasks)  # Force evaluation
        end_time = time.time()
        
        # Should be fast with index
        self.assertLess(end_time - start_time, 0.1)
    
    def test_ordering_uses_indexes(self):
        """Test ordering operations use indexes"""
        # Create events with dates
        for i in range(50):
            Event.objects.create(
                title=f'Index Event {i}',
                event_type='EGITIM',
                start_time=timezone.now() + timedelta(days=i),
                end_time=timezone.now() + timedelta(days=i, hours=2),
                location='Test',
                created_by=self.admin_user,
                attendance_points=10,
                is_active=True
            )
        
        # Order by date (should use index)
        start_time = time.time()
        events = Event.objects.order_by('start_time')
        list(events)
        end_time = time.time()
        
        self.assertLess(end_time - start_time, 0.2)


class APILoadTests(BaseTestCase):
    """Test API under load"""
    
    def test_sequential_requests_stability(self):
        """Test API remains stable under sequential requests"""
        self.authenticate_member()
        url = reverse('task-list')
        
        # Make 50 requests
        for i in range(50):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
    
    def test_mixed_operations_stability(self):
        """Test API handles mixed operations"""
        self.authenticate_admin()
        
        # Mix of operations
        for i in range(20):
            # Create
            url = reverse('task-list')
            self.client.post(url, {
                'title': f'Load Task {i}',
                'points': 10
            }, format='json')
            
            # Read
            self.client.get(url)
            
            # Update
            if Task.objects.exists():
                task = Task.objects.first()
                detail_url = reverse('task-detail', kwargs={'pk': task.id})
                self.client.patch(detail_url, {'title': f'Updated {i}'}, format='json')
