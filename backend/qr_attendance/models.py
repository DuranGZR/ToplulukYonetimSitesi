from django.db import models
from django.utils import timezone
from events.models import Event
from users.models import User
import uuid

class QRCode(models.Model):
    """Etkinlik için QR kod"""
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='qr_code_obj')
    code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    def is_valid(self):
        return self.is_active and timezone.now() < self.expires_at
    
    class Meta:
        db_table = 'qr_codes'
        verbose_name = 'QR Kod'
        verbose_name_plural = 'QR Kodlar'
    
    def __str__(self):
        return f"QR Code for {self.event.title}"

class Attendance(models.Model):
    """Yoklama kaydı"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='qr_attendances')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='qr_attendances')
    scanned_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'qr_attendances'
        unique_together = ['event', 'user']
        verbose_name = 'QR Yoklama'
        verbose_name_plural = 'QR Yoklamalar'
        ordering = ['-scanned_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.event.title}"
