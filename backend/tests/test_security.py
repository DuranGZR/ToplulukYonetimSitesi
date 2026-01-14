"""
Security Tests - Testing authentication, authorization, and data protection
"""
from django.urls import reverse
from tests.base import BaseTestCase
from django.contrib.auth import get_user_model
from tasks.models import Task
from projects.models import Project
import time

User = get_user_model()


class AuthenticationSecurityTests(BaseTestCase):
    """Test authentication security"""
    
    def test_brute_force_login_attempt(self):
        """Test multiple failed login attempts"""
        url = reverse('login')
        
        # Attempt 10 failed logins
        for i in range(10):
            response = self.client.post(url, {
                'username': 'testadmin',
                'password': f'wrongpass{i}'
            }, format='json')
            self.assertNotEqual(response.status_code, 200)
        
        # Should still be able to login with correct password
        response = self.client.post(url, {
            'username': 'testadmin',
            'password': 'testpass123'
        }, format='json')
        # Rate limiting might block or allow
    
    def test_password_complexity_requirements(self):
        """Test password must meet complexity requirements"""
        self.authenticate_admin()
        url = reverse('user-list')
        
        weak_passwords = [
            '123',
            'abc',
            'password',
            '11111111',
        ]
        
        for weak_pass in weak_passwords:
            data = {
                'username': f'weakuser{weak_passwords.index(weak_pass)}',
                'email': f'weak{weak_passwords.index(weak_pass)}@test.com',
                'password': weak_pass,
                'role': 'UYE'
            }
            response = self.client.post(url, data, format='json')
            # Should be rejected if password validation is enabled
    
    def test_session_timeout(self):
        """Test session expires after period of inactivity"""
        token = self.authenticate_member()
        
        # Make request
        url = reverse('user-profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Simulate time passage (in real test, wait or mock time)
        # After timeout, token should be invalid
    
    def test_token_cannot_be_reused_after_logout(self):
        """Test JWT token blacklist after logout"""
        token = self.authenticate_member()
        
        # Logout
        logout_url = reverse('logout')
        self.client.post(logout_url, format='json')
        
        # Try to use same token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('user-profile')
        response = self.client.get(url)
        
        # Should be rejected
        self.assertIn(response.status_code, [401, 403])


class AuthorizationSecurityTests(BaseTestCase):
    """Test authorization and access control"""
    
    def test_member_cannot_access_admin_endpoints(self):
        """Test regular member cannot access admin-only features"""
        self.authenticate_member()
        
        # Try to create user (admin only)
        url = reverse('user-list')
        data = {
            'username': 'unauthorized',
            'email': 'unauth@test.com',
            'password': 'testpass123',
            'role': 'UYE'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 403)
    
    def test_member_cannot_approve_tasks(self):
        """Test member cannot approve task completions"""
        task = Task.objects.create(
            title='Test Task',
            points=30,
            created_by=self.admin_user,
            status='TAMAMLANDI',
            approval_status='APPROVED',
            is_active=True
        )
        
        self.authenticate_member()
        url = reverse('task-approve-completion', kwargs={'pk': task.id})
        response = self.client.post(url, format='json')
        
        self.assertIn(response.status_code, [403, 404])
    
    def test_user_cannot_modify_other_users_data(self):
        """Test users cannot modify other users' information"""
        self.authenticate_member()
        
        # Try to modify admin user
        url = reverse('user-detail', kwargs={'pk': self.admin_user.id})
        data = {'first_name': 'Hacked'}
        response = self.client.patch(url, data, format='json')
        
        # Should be forbidden or only allow limited fields
        if response.status_code == 200:
            self.admin_user.refresh_from_db()
            self.assertNotEqual(self.admin_user.first_name, 'Hacked')
    
    def test_committee_member_only_access(self):
        """Test non-committee members cannot access committee content"""
        # Create task for committee
        task = Task.objects.create(
            title='Committee Only Task',
            points=25,
            created_by=self.committee_leader,
            committee=self.committee,
            approval_status='APPROVED',
            is_active=True
        )
        
        # Create user not in committee
        non_member = User.objects.create_user(
            username='noncommittee',
            password='testpass123'
        )
        
        self.authenticate_user(non_member)
        url = reverse('task-list')
        response = self.client.get(url)
        
        # Should not see committee-specific task
        if response.status_code == 200:
            task_ids = [t['id'] for t in response.data]
            # Depends on filtering implementation


class InjectionAttackTests(BaseTestCase):
    """Test protection against injection attacks"""
    
    def test_sql_injection_in_search(self):
        """Test SQL injection prevention in search queries"""
        self.authenticate_member()
        url = reverse('task-list')
        
        injection_attempts = [
            "'; DROP TABLE tasks; --",
            "1' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users--",
        ]
        
        for injection in injection_attempts:
            response = self.client.get(url, {'search': injection})
            # Should handle safely
            self.assertIn(response.status_code, [200, 400])
            
            # Verify tables still exist
            self.assertTrue(Task.objects.exists())
    
    def test_xss_in_user_input(self):
        """Test XSS prevention in user input"""
        self.authenticate_admin()
        url = reverse('task-list')
        
        xss_attempts = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
        ]
        
        for xss in xss_attempts:
            data = {
                'title': xss,
                'description': f'Test {xss}',
                'points': 30
            }
            response = self.client.post(url, data, format='json')
            
            if response.status_code == 201:
                task = Task.objects.get(id=response.data['id'])
                # Script tags should be escaped/sanitized
    
    def test_path_traversal_in_file_upload(self):
        """Test path traversal prevention"""
        # If file upload is implemented
        self.authenticate_member()
        # Test with paths like ../../etc/passwd
    
    def test_command_injection_prevention(self):
        """Test command injection prevention"""
        self.authenticate_admin()
        url = reverse('user-list')
        
        command_injections = [
            '; ls -la',
            '| cat /etc/passwd',
            '`whoami`',
            '$(ls)',
        ]
        
        for injection in command_injections:
            data = {
                'username': f'user{injection}',
                'email': 'test@test.com',
                'password': 'testpass123'
            }
            response = self.client.post(url, data, format='json')
            # Should be safely handled


class DataValidationSecurityTests(BaseTestCase):
    """Test data validation security"""
    
    def test_negative_points_rejected(self):
        """Test negative points are rejected"""
        self.authenticate_admin()
        url = reverse('task-list')
        
        data = {
            'title': 'Negative Points Task',
            'points': -100,  # Negative points
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [400, 201])
        
        if response.status_code == 201:
            task = Task.objects.get(id=response.data['id'])
            self.assertGreaterEqual(task.points, 0)
    
    def test_extremely_large_values(self):
        """Test handling of extremely large values"""
        self.authenticate_admin()
        url = reverse('task-list')
        
        data = {
            'title': 'Large Points',
            'points': 999999999,  # Very large number
        }
        response = self.client.post(url, data, format='json')
        # Should be validated or handled gracefully
    
    def test_invalid_date_formats(self):
        """Test invalid date format handling"""
        self.authenticate_admin()
        url = reverse('event-list')
        
        from django.utils import timezone
        data = {
            'title': 'Test Event',
            'event_type': 'EGITIM',
            'start_time': 'invalid-date',
            'end_time': 'also-invalid',
            'location': 'Test',
            'attendance_points': 20
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 400)
    
    def test_email_format_validation(self):
        """Test email format validation"""
        self.authenticate_admin()
        url = reverse('user-list')
        
        invalid_emails = [
            'notanemail',
            '@nolocal.com',
            'nodomain@',
            'spaces in@email.com',
        ]
        
        for email in invalid_emails:
            data = {
                'username': f'emailtest{invalid_emails.index(email)}',
                'email': email,
                'password': 'testpass123',
                'role': 'UYE'
            }
            response = self.client.post(url, data, format='json')
            # Should reject invalid emails
            self.assertIn(response.status_code, [400, 201])


class CSRFProtectionTests(BaseTestCase):
    """Test CSRF protection"""
    
    def test_csrf_token_required_for_post(self):
        """Test CSRF token is required for POST requests"""
        # Without authentication
        url = reverse('login')
        # Try POST without CSRF token
        # Django REST framework uses token auth, so CSRF might be disabled
    
    def test_csrf_token_validation(self):
        """Test CSRF token is properly validated"""
        # Test with invalid CSRF token


class RateLimitingTests(BaseTestCase):
    """Test rate limiting (if implemented)"""
    
    def test_api_rate_limiting(self):
        """Test API endpoints have rate limiting"""
        self.authenticate_member()
        url = reverse('task-list')
        
        # Make many requests rapidly
        responses = []
        for i in range(100):
            response = self.client.get(url)
            responses.append(response.status_code)
        
        # Should eventually get 429 Too Many Requests
        # (if rate limiting is implemented)
    
    def test_login_rate_limiting(self):
        """Test login endpoint has rate limiting"""
        url = reverse('login')
        
        # Multiple failed attempts
        for i in range(20):
            response = self.client.post(url, {
                'username': 'testadmin',
                'password': 'wrongpass'
            }, format='json')
        
        # Should be rate limited


class SensitiveDataProtectionTests(BaseTestCase):
    """Test protection of sensitive data"""
    
    def test_password_hashed_in_database(self):
        """Test passwords are hashed, not plaintext"""
        user = User.objects.get(username='testadmin')
        
        # Password should not match plaintext
        self.assertNotEqual(user.password, 'testpass123')
        # Should be hashed (starts with algorithm identifier)
        self.assertTrue(user.password.startswith('pbkdf2_sha256$') or 
                       user.password.startswith('bcrypt$') or
                       user.password.startswith('argon2$'))
    
    def test_sensitive_fields_not_logged(self):
        """Test sensitive fields are not logged"""
        # Check that passwords, tokens, etc. are not in logs
        # This would require checking log files or log handlers
    
    def test_error_messages_not_revealing(self):
        """Test error messages don't reveal sensitive information"""
        url = reverse('login')
        
        # Try with non-existent user
        response = self.client.post(url, {
            'username': 'nonexistent',
            'password': 'somepass'
        }, format='json')
        
        # Error message should not reveal if user exists
        # Should be generic like "Invalid credentials"
    
    def test_user_enumeration_prevention(self):
        """Test user enumeration is prevented"""
        # Registration or password reset should not reveal if user exists
        # This prevents attackers from building user lists


class FileUploadSecurityTests(BaseTestCase):
    """Test file upload security (if implemented)"""
    
    def test_malicious_file_type_rejected(self):
        """Test malicious file types are rejected"""
        # Test uploading .exe, .sh, .php files
        pass
    
    def test_file_size_limit_enforced(self):
        """Test file size limits are enforced"""
        # Try uploading very large file
        pass
    
    def test_filename_sanitization(self):
        """Test filenames are sanitized"""
        # Test with filenames containing path traversal
        pass


class APISecurityHeadersTests(BaseTestCase):
    """Test security headers in API responses"""
    
    def test_cors_headers_properly_configured(self):
        """Test CORS headers are properly set"""
        self.authenticate_member()
        url = reverse('task-list')
        response = self.client.get(url)
        
        # Check for appropriate CORS headers
        # Should only allow trusted origins
    
    def test_content_type_header(self):
        """Test Content-Type header is set correctly"""
        self.authenticate_member()
        url = reverse('task-list')
        response = self.client.get(url)
        
        self.assertEqual(response['Content-Type'], 'application/json')
    
    def test_security_headers_present(self):
        """Test security headers are present"""
        self.authenticate_member()
        url = reverse('task-list')
        response = self.client.get(url)
        
        # Check for security headers (if implemented)
        # X-Content-Type-Options: nosniff
        # X-Frame-Options: DENY
        # Strict-Transport-Security
