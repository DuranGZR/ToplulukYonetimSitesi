from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class UserReport(models.Model):
    REPORT_TYPES = [
        ('SPAM', 'Spam'),
        ('HARASSMENT', 'Taciz/Rahatsız Etme'),
        ('INAPPROPRIATE', 'Uygunsuz İçerik'),
        ('FAKE', 'Sahte Profil'),
        ('OTHER', 'Diğer'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Beklemede'),
        ('REVIEWED', 'İncelendi'),
        ('RESOLVED', 'Çözüldü'),
        ('DISMISSED', 'Reddedildi'),
    ]
    
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_made'
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_received'
    )
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Optional: Link to specific content (event, task, project, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    admin_notes = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_resolved'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'moderation_user_reports'
    
    def __str__(self):
        return f"{self.reporter.username} reported {self.reported_user.username} - {self.report_type}"
