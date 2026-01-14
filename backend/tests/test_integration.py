"""
Integration Tests - Testing Complete User Workflows
End-to-end testing of complex multi-step processes
"""
from django.urls import reverse
from tests.base import BaseTestCase
from tasks.models import Task
from projects.models import Project, ProjectTask
from events.models import Event, EventAttendance
from meetings.models import Meeting, MeetingAttendance
from notifications.models import Notification
from activity.models import ActivityLog
from django.utils import timezone
from datetime import timedelta


class NewMemberOnboardingIntegrationTest(BaseTestCase):
    """Test complete onboarding flow for new member"""
    
    def test_new_member_complete_journey(self):
        """Test: Admin creates user -> User logs in -> Joins committee -> Claims task -> Completes task -> Gains points -> Levels up"""
        
        # Step 1: Admin creates new user
        self.authenticate_admin()
        create_url = reverse('user-list')
        user_data = {
            'username': 'newjourneyuser',
            'email': 'journey@test.com',
            'password': 'testpass123',
            'first_name': 'Journey',
            'last_name': 'User',
            'role': 'UYE'
        }
        response = self.client.post(create_url, user_data, format='json')
        self.assertEqual(response.status_code, 201)
        new_user_id = response.data['id']
        
        # Step 2: New user logs in
        login_url = reverse('login')
        login_data = {
            'username': 'newjourneyuser',
            'password': 'testpass123'
        }
        response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        
        # Step 3: Admin adds user to committee
        self.authenticate_admin()
        self.committee.members.add(new_user_id)
        self.committee.save()
        
        # Step 4: Create task for committee
        task = Task.objects.create(
            title='Onboarding Task',
            description='First task for new member',
            points=100,
            difficulty='KOLAY',
            created_by=self.admin_user,
            committee=self.committee,
            approval_status='APPROVED',
            is_active=True
        )
        
        # Step 5: New user claims task
        from django.contrib.auth import get_user_model
        User = get_user_model()
        new_user = User.objects.get(id=new_user_id)
        
        self.authenticate_user(new_user)
        claim_url = reverse('task-claim', kwargs={'pk': task.id})
        response = self.client.post(claim_url, format='json')
        self.assertEqual(response.status_code, 200)
        
        # Step 6: User completes task
        complete_url = reverse('task-complete', kwargs={'pk': task.id})
        response = self.client.post(complete_url, 
                                   {'submission_url': 'https://github.com/complete'},
                                   format='json')
        self.assertEqual(response.status_code, 200)
        
        # Step 7: Admin approves completion
        self.authenticate_admin()
        approve_url = reverse('task-approve-completion', kwargs={'pk': task.id})
        response = self.client.post(approve_url, format='json')
        self.assertEqual(response.status_code, 200)
        
        # Step 8: Verify user gained points and leveled up
        new_user.refresh_from_db()
        self.assertEqual(new_user.total_points, 100)
        self.assertEqual(new_user.level, 2)  # Should be level 2 with 100 points
        
        # Step 9: Verify notification was sent
        notifications = Notification.objects.filter(recipient=new_user)
        self.assertGreater(notifications.count(), 0)


class EventAttendanceIntegrationTest(BaseTestCase):
    """Test complete event attendance workflow"""
    
    def test_event_lifecycle_with_attendees(self):
        """Test: Create event -> Generate QR -> Users scan -> Attendance recorded -> Points awarded"""
        
        # Step 1: Admin creates event
        self.authenticate_admin()
        event = Event.objects.create(
            title='Integration Test Event',
            description='Full workflow test',
            event_type='TEKNIK',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=2),
            location='Test Hall',
            attendance_points=50,
            created_by=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        
        # Step 2: Generate QR code
        event.generate_qr_code()
        event.save()
        self.assertIsNotNone(event.qr_code_data)
        
        # Step 3: Multiple users scan QR
        users = [self.member_user, self.committee_leader, self.committee_vice]
        
        for user in users:
            initial_points = user.total_points
            
            # Scan QR
            self.authenticate_user(user)
            scan_url = reverse('event-scan-qr', kwargs={'pk': event.id})
            response = self.client.post(scan_url, 
                                       {'qr_data': event.qr_code_data},
                                       format='json')
            self.assertEqual(response.status_code, 200)
            
            # Verify attendance recorded
            attendance = EventAttendance.objects.filter(
                event=event,
                user=user
            ).first()
            self.assertIsNotNone(attendance)
            self.assertEqual(attendance.points_earned, 50)
            
            # Verify points awarded
            user.refresh_from_db()
            self.assertEqual(user.total_points, initial_points + 50)
        
        # Step 4: Admin views attendee list
        self.authenticate_admin()
        attendees_url = reverse('event-attendances', kwargs={'pk': event.id})
        response = self.client.get(attendees_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)


class ProjectCollaborationIntegrationTest(BaseTestCase):
    """Test complete project collaboration workflow"""
    
    def test_project_team_collaboration(self):
        """Test: Create project -> Add team -> Create tasks -> Assign -> Complete -> Track progress"""
        
        # Step 1: Committee leader creates project
        self.authenticate_committee_leader()
        create_url = reverse('project-list')
        project_data = {
            'title': 'Team Collaboration Project',
            'description': 'Testing team workflow',
            'committee': self.committee.id,
            'status': 'AKTIF',
            'priority': 'YUKSEK',
            'team_members': [self.member_user.id, self.committee_vice.id]
        }
        response = self.client.post(create_url, project_data, format='json')
        self.assertEqual(response.status_code, 201)
        project_id = response.data['id']
        
        project = Project.objects.get(id=project_id)
        
        # Step 2: Create multiple project tasks
        tasks_data = [
            {'title': 'Task 1', 'points': 30, 'status': 'YAPILACAK'},
            {'title': 'Task 2', 'points': 40, 'status': 'YAPILACAK'},
            {'title': 'Task 3', 'points': 50, 'status': 'YAPILACAK'},
        ]
        
        task_ids = []
        for task_data in tasks_data:
            task = ProjectTask.objects.create(
                project=project,
                title=task_data['title'],
                points=task_data['points'],
                status=task_data['status']
            )
            task_ids.append(task.id)
        
        # Step 3: Team member 1 self-assigns first task
        self.authenticate_member()
        assign_url = reverse('projecttask-self-assign', kwargs={'pk': task_ids[0]})
        response = self.client.post(assign_url, format='json')
        self.assertEqual(response.status_code, 200)
        
        # Step 4: Team member 2 self-assigns second task
        self.authenticate_user(self.committee_vice)
        assign_url = reverse('projecttask-self-assign', kwargs={'pk': task_ids[1]})
        response = self.client.post(assign_url, format='json')
        self.assertEqual(response.status_code, 200)
        
        # Step 5: Complete tasks
        for i, task_id in enumerate(task_ids[:2]):
            user = self.member_user if i == 0 else self.committee_vice
            self.authenticate_user(user)
            
            # Move to in progress
            status_url = reverse('projecttask-change-status', kwargs={'pk': task_id})
            response = self.client.post(status_url, 
                                       {'status': 'DEVAM_EDIYOR'},
                                       format='json')
            self.assertEqual(response.status_code, 200)
            
            # Complete
            response = self.client.post(status_url, 
                                       {'status': 'TAMAMLANDI'},
                                       format='json')
            self.assertEqual(response.status_code, 200)
        
        # Step 6: Verify project progress
        project.refresh_from_db()
        project.update_completion()
        # 2 out of 3 tasks completed = ~67%
        self.assertGreaterEqual(project.completion_percentage, 60)
        
        # Step 7: Verify points awarded to team members
        self.member_user.refresh_from_db()
        self.committee_vice.refresh_from_db()
        self.assertGreater(self.member_user.total_points, 0)
        self.assertGreater(self.committee_vice.total_points, 0)


class CommitteeWorkflowIntegrationTest(BaseTestCase):
    """Test committee-based workflow"""
    
    def test_committee_content_creation_approval(self):
        """Test: Committee leader creates content -> Admin reviews -> Approves/Rejects"""
        
        # Step 1: Committee leader creates task (pending approval)
        self.authenticate_committee_leader()
        task_url = reverse('task-list')
        task_data = {
            'title': 'Committee Task Pending',
            'description': 'Needs approval',
            'points': 40,
            'difficulty': 'ORTA',
            'committee': self.committee.id
        }
        response = self.client.post(task_url, task_data, format='json')
        self.assertEqual(response.status_code, 201)
        task_id = response.data['id']
        
        task = Task.objects.get(id=task_id)
        self.assertEqual(task.approval_status, 'PENDING')
        self.assertFalse(task.is_active)
        
        # Step 2: Regular member cannot see pending task
        self.authenticate_member()
        list_url = reverse('task-list')
        response = self.client.get(list_url)
        task_ids_visible = [t['id'] for t in response.data]
        self.assertNotIn(task_id, task_ids_visible)
        
        # Step 3: Admin reviews and approves
        self.authenticate_admin()
        approve_url = reverse('task-approve', kwargs={'pk': task_id})
        response = self.client.post(approve_url, format='json')
        self.assertEqual(response.status_code, 200)
        
        task.refresh_from_db()
        self.assertEqual(task.approval_status, 'APPROVED')
        self.assertTrue(task.is_active)
        
        # Step 4: Now member can see task
        self.authenticate_member()
        response = self.client.get(list_url)
        task_ids_visible = [t['id'] for t in response.data]
        self.assertIn(task_id, task_ids_visible)


class MeetingWorkflowIntegrationTest(BaseTestCase):
    """Test meeting workflow"""
    
    def test_meeting_creation_attendance_notes(self):
        """Test: Create meeting -> Generate QR -> Attendance -> Add notes"""
        
        # Step 1: Committee leader creates meeting
        self.authenticate_committee_leader()
        meeting_url = reverse('meeting-list')
        meeting_data = {
            'title': 'Weekly Standup',
            'description': 'Team sync meeting',
            'meeting_type': 'KOMITE',
            'date_time': (timezone.now() + timedelta(hours=1)).isoformat(),
            'location': 'Meeting Room A',
            'duration': 60,
            'committee': self.committee.id,
            'is_general': False,
            'agenda_items': ['Topic 1', 'Topic 2', 'Topic 3']
        }
        response = self.client.post(meeting_url, meeting_data, format='json')
        self.assertEqual(response.status_code, 201)
        meeting_id = response.data['id']
        
        meeting = Meeting.objects.get(id=meeting_id)
        self.assertIsNotNone(meeting.qr_code_data)
        
        # Step 2: Committee members attend
        members = [self.member_user, self.committee_vice]
        
        for member in members:
            self.authenticate_user(member)
            scan_url = reverse('meeting-scan-qr', kwargs={'pk': meeting_id})
            response = self.client.post(scan_url,
                                       {'qr_data': meeting.qr_code_data},
                                       format='json')
            self.assertEqual(response.status_code, 200)
        
        # Step 3: Admin adds meeting notes
        self.authenticate_admin()
        notes_url = reverse('meeting-update-notes', kwargs={'pk': meeting_id})
        notes_data = {
            'notes': 'Meeting went well. Discussed project timelines.',
            'decisions': ['Decision 1', 'Decision 2'],
            'actions': ['Action item 1', 'Action item 2']
        }
        response = self.client.patch(notes_url, notes_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        meeting.refresh_from_db()
        self.assertEqual(meeting.notes, 'Meeting went well. Discussed project timelines.')
        self.assertEqual(len(meeting.decisions), 2)
        
        # Step 4: Verify attendance and points
        for member in members:
            attendance = MeetingAttendance.objects.filter(
                meeting=meeting,
                user=member
            ).first()
            self.assertIsNotNone(attendance)
            self.assertEqual(attendance.points_earned, 5)


class MultiModuleIntegrationTest(BaseTestCase):
    """Test interactions between multiple modules"""
    
    def test_task_project_event_points_accumulation(self):
        """Test points accumulation from multiple sources"""
        
        initial_points = self.member_user.total_points
        
        # Source 1: Complete a task (50 points)
        task = Task.objects.create(
            title='Multi Source Task',
            points=50,
            created_by=self.admin_user,
            status='TAMAMLANDI',
            approval_status='APPROVED',
            is_active=True
        )
        task.assigned_users.add(self.member_user)
        
        ActivityLog.objects.create(
            user=self.member_user,
            points=50,
            source='TASK',
            source_id=task.id
        )
        
        # Source 2: Attend an event (30 points)
        event = Event.objects.create(
            title='Multi Source Event',
            event_type='SOSYAL',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=2),
            location='Hall',
            attendance_points=30,
            created_by=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        
        EventAttendance.objects.create(
            event=event,
            user=self.member_user,
            points_earned=30
        )
        
        ActivityLog.objects.create(
            user=self.member_user,
            points=30,
            source='EVENT',
            source_id=event.id
        )
        
        # Source 3: Complete project task (40 points)
        project = Project.objects.create(
            title='Multi Source Project',
            owner=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        
        project_task = ProjectTask.objects.create(
            project=project,
            title='Project Task',
            points=40,
            status='TAMAMLANDI',
            assigned_to=self.member_user
        )
        
        ActivityLog.objects.create(
            user=self.member_user,
            points=40,
            source='PROJECT',
            source_id=project_task.id
        )
        
        # Source 4: Attend meeting (5 points)
        meeting = Meeting.objects.create(
            title='Multi Source Meeting',
            meeting_type='GENEL_KURUL',
            date_time=timezone.now(),
            location='Room',
            duration=60,
            is_general=True
        )
        
        MeetingAttendance.objects.create(
            meeting=meeting,
            user=self.member_user,
            points_earned=5
        )
        
        ActivityLog.objects.create(
            user=self.member_user,
            points=5,
            source='MEETING',
            source_id=meeting.id
        )
        
        # Verify total points: 50 + 30 + 40 + 5 = 125
        self.member_user.refresh_from_db()
        expected_points = initial_points + 125
        self.assertEqual(self.member_user.total_points, expected_points)
        
        # Verify level calculation
        self.assertGreaterEqual(self.member_user.level, 2)
        
        # Verify activity history
        logs = ActivityLog.objects.filter(user=self.member_user)
        self.assertEqual(logs.count(), 4)


class PermissionHierarchyIntegrationTest(BaseTestCase):
    """Test permission hierarchy across modules"""
    
    def test_role_based_access_control(self):
        """Test different roles accessing different resources"""
        
        # Create content from different roles
        admin_task = Task.objects.create(
            title='Admin Task',
            points=30,
            created_by=self.admin_user,
            approval_status='APPROVED',
            is_active=True
        )
        
        leader_task = Task.objects.create(
            title='Leader Task',
            points=25,
            created_by=self.committee_leader,
            committee=self.committee,
            approval_status='PENDING',
            is_active=False
        )
        
        # Test admin can see everything
        self.authenticate_admin()
        url = reverse('task-list')
        response = self.client.get(url)
        task_ids = [t['id'] for t in response.data]
        self.assertIn(admin_task.id, task_ids)
        self.assertIn(leader_task.id, task_ids)
        
        # Test member only sees approved
        self.authenticate_member()
        response = self.client.get(url)
        task_ids = [t['id'] for t in response.data]
        self.assertIn(admin_task.id, task_ids)
        self.assertNotIn(leader_task.id, task_ids)
        
        # Test committee leader can see own pending
        self.authenticate_committee_leader()
        response = self.client.get(url)
        # Implementation depends on filtering logic
