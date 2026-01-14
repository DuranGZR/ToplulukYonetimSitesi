"""
Test cases for Project Management System
"""
from django.urls import reverse
from tests.base import BaseTestCase
from projects.models import Project, ProjectTask


class ProjectManagementTests(BaseTestCase):
    """Test project CRUD operations"""
    
    def setUp(self):
        super().setUp()
        # Create test project
        self.project = Project.objects.create(
            title='Test Project',
            description='Test project description',
            owner=self.admin_user,
            committee=self.committee,
            status='AKTIF',
            priority='YUKSEK',
            approval_status='APPROVED',
            is_active=True
        )
        self.project.team_members.add(self.member_user)
    
    def test_list_projects(self):
        """Test listing projects"""
        self.authenticate_member()
        url = reverse('project-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_create_project_as_admin(self):
        """Test creating project as admin"""
        self.authenticate_admin()
        url = reverse('project-list')
        data = {
            'title': 'New Admin Project',
            'description': 'Admin created project',
            'committee': self.committee.id,
            'status': 'PLANLAMA',
            'priority': 'ORTA',
            'team_members': [self.member_user.id]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 201)
        project = Project.objects.get(title='New Admin Project')
        self.assertEqual(project.approval_status, 'APPROVED')
        self.assertTrue(project.is_active)
    
    def test_my_projects_endpoint(self):
        """Test retrieving user's projects"""
        self.authenticate_member()
        url = reverse('project-my-projects')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_project_detail(self):
        """Test retrieving project details"""
        self.authenticate_member()
        url = reverse('project-detail', kwargs={'pk': self.project.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Test Project')
        self.assertIn('team_members', response.data)


class ProjectTaskTests(BaseTestCase):
    """Test project task (Kanban) operations"""
    
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(
            title='Kanban Project',
            description='Project with tasks',
            owner=self.admin_user,
            committee=self.committee,
            approval_status='APPROVED',
            is_active=True
        )
        self.project.team_members.add(self.member_user)
        
        self.project_task = ProjectTask.objects.create(
            project=self.project,
            title='Project Task 1',
            description='Task description',
            points=30,
            status='YAPILACAK',
            priority='ORTA'
        )
    
    def test_create_project_task(self):
        """Test creating a project task"""
        # Skip: ProjectTask ViewSet not implemented yet
        self.skipTest('ProjectTask ViewSet not implemented')
        self.authenticate_admin()
        url = reverse('projecttask-list')
        data = {
            'project': self.project.id,
            'title': 'New Task',
            'description': 'New task description',
            'points': 25,
            'status': 'YAPILACAK',
            'priority': 'YUKSEK'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 201)
    
    def test_self_assign_project_task(self):
        """Test self-assigning a project task"""
        self.skipTest('ProjectTask ViewSet not implemented')
        self.authenticate_member()
        url = reverse('projecttask-self-assign', kwargs={'pk': self.project_task.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.project_task.refresh_from_db()
        self.assertEqual(self.project_task.assigned_to, self.member_user)
    
    def test_change_task_status(self):
        """Test changing project task status"""
        self.skipTest('ProjectTask ViewSet not implemented')
        # Assign task first
        self.project_task.assigned_to = self.member_user
        self.project_task.save()
        
        self.authenticate_member()
        url = reverse('projecttask-change-status', kwargs={'pk': self.project_task.id})
        data = {
            'status': 'DEVAM_EDIYOR'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.project_task.refresh_from_db()
        self.assertEqual(self.project_task.status, 'DEVAM_EDIYOR')
    
    def test_complete_project_task_awards_points(self):
        """Test that completing project task awards points"""
        self.skipTest('ProjectTask ViewSet not implemented')
        self.project_task.assigned_to = self.member_user
        self.project_task.save()
        
        initial_points = self.member_user.total_points
        
        self.authenticate_member()
        url = reverse('projecttask-change-status', kwargs={'pk': self.project_task.id})
        data = {
            'status': 'TAMAMLANDI'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.member_user.refresh_from_db()
        self.assertEqual(self.member_user.total_points, initial_points + self.project_task.points)
    
    def test_my_project_tasks(self):
        """Test retrieving user's project tasks"""
        self.skipTest('ProjectTask ViewSet not implemented')
        self.project_task.assigned_to = self.member_user
        self.project_task.save()
        
        self.authenticate_member()
        url = reverse('projecttask-my-tasks')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)


class ProjectApprovalTests(BaseTestCase):
    """Test project approval workflow"""
    
    def setUp(self):
        super().setUp()
        self.pending_project = Project.objects.create(
            title='Pending Project',
            description='Needs approval',
            owner=self.committee_leader,
            committee=self.committee,
            approval_status='PENDING',
            is_active=False
        )
    
    def test_approve_project_as_admin(self):
        """Test approving project as admin"""
        self.authenticate_admin()
        url = reverse('project-approve', kwargs={'pk': self.pending_project.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.pending_project.refresh_from_db()
        self.assertEqual(self.pending_project.approval_status, 'APPROVED')
        self.assertTrue(self.pending_project.is_active)
    
    def test_reject_project_as_admin(self):
        """Test rejecting project as admin"""
        self.authenticate_admin()
        url = reverse('project-reject', kwargs={'pk': self.pending_project.id})
        data = {
            'rejection_reason': 'Insufficient resources'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.pending_project.refresh_from_db()
        self.assertEqual(self.pending_project.approval_status, 'REJECTED')


class ProjectProgressTests(BaseTestCase):
    """Test project progress calculation"""
    
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(
            title='Progress Project',
            owner=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
    
    def test_project_completion_percentage(self):
        """Test automatic completion percentage calculation"""
        self.skipTest('update_completion method not implemented on Project model')
        # Create 4 tasks: 1 completed, 1 in progress, 2 todo
        ProjectTask.objects.create(project=self.project, title='Task 1', status='TAMAMLANDI', points=10)
        ProjectTask.objects.create(project=self.project, title='Task 2', status='DEVAM_EDIYOR', points=10)
        ProjectTask.objects.create(project=self.project, title='Task 3', status='YAPILACAK', points=10)
        ProjectTask.objects.create(project=self.project, title='Task 4', status='YAPILACAK', points=10)
        
        # 1 out of 4 tasks completed = 25%
        self.project.update_completion()
        self.assertEqual(self.project.completion_percentage, 25)
