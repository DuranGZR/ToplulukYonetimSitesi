from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('TASK_ASSIGNED', 'Görev Atandı'),
        ('TASK_COMPLETED', 'Görev Tamamlandı'),
        ('EVENT_REMINDER', 'Etkinlik Hatırlatma'),
        ('EVENT_CREATED', 'Yeni Etkinlik'),
        ('PROJECT_ASSIGNED', 'Projeye Atandı'),
        ('LEVEL_UP', 'Seviye Atlama'),
        ('ACHIEVEMENT', 'Başarı Kazanıldı'),
        ('REPORT_RESOLVED', 'Rapor Çözüldü'),
        ('REPORT_PENALTY', 'Rapor Cezası'),
        ('COMMENT', 'Yorum Yapıldı'),
        ('MENTION', 'Bahsedildi'),
        ('SYSTEM', 'Sistem Bildirimi'),
    ]
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Optional: Link to related object
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Optional: Link URL
    link = models.CharField(max_length=255, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.notification_type} - {self.recipient.username} - {self.title}"
