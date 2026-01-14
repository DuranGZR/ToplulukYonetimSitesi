from django.db import models
from django.conf import settings
from django.utils import timezone
import qrcode
from io import BytesIO
from django.core.files import File


class Event(models.Model):
    """
    Topluluk etkinlikleri
    """
    EVENT_TYPE_CHOICES = [
        ('EGITIM', 'Eğitim'),
        ('TEKNIK', 'Teknik Çalışma'),
        ('SOSYAL', 'Sosyal Etkinlik'),
        ('PROJE', 'Proje Toplantısı'),
        ('DIGER', 'Diğer'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    
    date_time = models.DateTimeField()
    location = models.CharField(max_length=200)
    duration = models.IntegerField(default=60, help_text="Süre (dakika)")
    
    poster_image = models.ImageField(upload_to='event_posters/', null=True, blank=True)
    
    # QR kod
    qr_code = models.ImageField(upload_to='event_qr/', null=True, blank=True)
    qr_data = models.CharField(max_length=500, blank=True, help_text="QR kod verisi")
    qr_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Puan
    attendance_points = models.IntegerField(default=10, help_text="Katılım puanı")
    
    # Status
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_events')
    
    # Onay sistemi
    APPROVAL_STATUS_CHOICES = [
        ('PENDING', 'Onay Bekliyor'),
        ('APPROVED', 'Onaylandı'),
        ('REJECTED', 'Reddedildi'),
    ]
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='APPROVED')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_events'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_time']
        verbose_name = 'Etkinlik'
        verbose_name_plural = 'Etkinlikler'
    
    def __str__(self):
        return f"{self.title} - {self.get_event_type_display()}"
    
    def generate_qr_code(self):
        """QR kod oluştur"""
        import hashlib
        from datetime import timedelta
        
        # QR kod verisi: event_id + timestamp
        qr_data = f"HSD_EVENT_{self.id}_{timezone.now().timestamp()}"
        self.qr_data = hashlib.sha256(qr_data.encode()).hexdigest()
        
        # QR kod sona erme süresi (etkinlik bitişinden 1 saat sonra)
        self.qr_expires_at = self.date_time + timedelta(hours=self.duration/60 + 1)
        
        # QR kod görselini oluştur
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(self.qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        
        filename = f'event_{self.id}_qr.png'
        self.qr_code.save(filename, File(buffer), save=False)
        buffer.close()
        
        self.save()
    
    def is_qr_valid(self):
        """QR kod hala geçerli mi?"""
        if not self.qr_expires_at:
            return False
        return timezone.now() < self.qr_expires_at
    
    @property
    def attendee_count(self):
        """Katılımcı sayısı"""
        return self.attendances.count()
    
    @property
    def is_past(self):
        """Etkinlik geçmiş mi?"""
        return timezone.now() > self.date_time


class EventAttendance(models.Model):
    """
    Etkinlik katılımları
    """
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_attendances')
    
    scanned_at = models.DateTimeField(auto_now_add=True)
    points_earned = models.IntegerField(default=0)
    
    # İptal durumu
    is_cancelled = models.BooleanField(default=False)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_attendances'
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancel_reason = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['event', 'user']
        ordering = ['-scanned_at']
        verbose_name = 'Etkinlik Katılımı'
        verbose_name_plural = 'Etkinlik Katılımları'
    
    def __str__(self):
        return f"{self.user.username} - {self.event.title}"
