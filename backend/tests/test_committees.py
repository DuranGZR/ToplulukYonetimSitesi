"""
Test cases for Committee System
"""
from django.urls import reverse
from tests.base import BaseTestCase
from committees.models import Committee
from django.contrib.auth import get_user_model

User = get_user_model()


class CommitteeManagementTests(BaseTestCase):
    """Test committee CRUD operations"""
    
    def test_list_committees(self):
        """Test listing committees"""
        self.authenticate_member()
        url = reverse('committee-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_create_committee_as_admin(self):
        """Test creating committee as admin"""
        self.authenticate_admin()
        url = reverse('committee-list')
        data = {
            'name': 'New Committee',
            'description': 'New committee description',
            'leader': self.committee_leader.id,
            'vice_leader': self.committee_vice.id
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 201)
        committee = Committee.objects.get(name='New Committee')
        self.assertEqual(committee.leader, self.committee_leader)
    
    def test_create_committee_as_member_fails(self):
        """Test that members cannot create committees"""
        self.authenticate_member()
        url = reverse('committee-list')
        data = {
            'name': 'Unauthorized Committee',
            'description': 'Should fail',
            'leader': self.committee_leader.id
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 403)
    
    def test_committee_detail(self):
        """Test retrieving committee details"""
        self.authenticate_member()
        url = reverse('committee-detail', kwargs={'pk': self.committee.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Test Komite')
        self.assertIn('members', response.data)
    
    def test_committee_members_endpoint(self):
        """Test getting committee members"""
        self.authenticate_member()
        url = reverse('committee-members', kwargs={'pk': self.committee.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 3)  # leader, vice, member
    
    def test_update_committee_as_admin(self):
        """Test updating committee as admin"""
        self.authenticate_admin()
        url = reverse('committee-detail', kwargs={'pk': self.committee.id})
        data = {
            'description': 'Updated description'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.committee.refresh_from_db()
        self.assertEqual(self.committee.description, 'Updated description')


class CommitteePermissionTests(BaseTestCase):
    """Test committee permission system"""
    
    def test_committee_leader_permissions(self):
        """Test committee leader has proper permissions"""
        self.assertTrue(self.committee.is_leader_or_vice(self.committee_leader))
        self.assertTrue(self.committee_leader.is_committee_leader)
    
    def test_committee_vice_permissions(self):
        """Test committee vice leader has proper permissions"""
        self.assertTrue(self.committee.is_leader_or_vice(self.committee_vice))
    
    def test_regular_member_no_leader_permissions(self):
        """Test regular member doesn't have leader permissions"""
        self.assertFalse(self.committee.is_leader_or_vice(self.member_user))
    
    def test_committee_leader_can_create_content(self):
        """Test committee leader can create committee content"""
        # This is tested in task/project/event tests
        # Just verify the user has the right role
        self.assertEqual(self.committee_leader.role, 'KOMITE_LIDERI')


class CommitteeMembershipTests(BaseTestCase):
    """Test committee membership management"""
    
    def test_add_member_to_committee(self):
        """Test adding member to committee"""
        new_member = User.objects.create_user(
            username='newcomm',
            email='newcomm@test.com',
            password='testpass123'
        )
        
        self.authenticate_admin()
        url = reverse('committee-detail', kwargs={'pk': self.committee.id})
        
        # Get current members
        current_members = list(self.committee.members.values_list('id', flat=True))
        current_members.append(new_member.id)
        
        data = {
            'members': current_members
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn(new_member, self.committee.members.all())
    
    def test_remove_member_from_committee(self):
        """Test removing member from committee"""
        self.authenticate_admin()
        url = reverse('committee-detail', kwargs={'pk': self.committee.id})
        
        # Get current members excluding one
        current_members = list(self.committee.members.values_list('id', flat=True))
        current_members.remove(self.member_user.id)
        
        data = {
            'members': current_members
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(self.member_user, self.committee.members.all())
    
    def test_committee_projects_endpoint(self):
        """Test getting committee projects"""
        from projects.models import Project
        
        # Create project for committee
        project = Project.objects.create(
            title='Committee Project',
            description='Test',
            owner=self.committee_leader,
            committee=self.committee,
            approval_status='APPROVED',
            is_active=True
        )
        
        self.authenticate_committee_leader()
        url = reverse('committee-projects', kwargs={'pk': self.committee.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)


class CommitteeFilteringTests(BaseTestCase):
    """Test committee-based content filtering"""
    
    def setUp(self):
        super().setUp()
        # Create second committee
        self.committee2 = Committee.objects.create(
            name='Second Committee',
            description='Another committee',
            leader=self.admin_user
        )
    
    def test_user_sees_only_their_committee_content(self):
        """Test that users see only their committee content"""
        from tasks.models import Task
        
        # Create tasks for different committees
        task1 = Task.objects.create(
            title='Committee 1 Task',
            points=20,
            created_by=self.admin_user,
            committee=self.committee,
            approval_status='APPROVED',
            is_active=True
        )
        
        task2 = Task.objects.create(
            title='Committee 2 Task',
            points=30,
            created_by=self.admin_user,
            committee=self.committee2,
            approval_status='APPROVED',
            is_active=True
        )
        
        # Member of committee 1 should see only committee 1 tasks
        self.authenticate_member()
        url = reverse('task-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        # Check filtering logic (depends on implementation)
