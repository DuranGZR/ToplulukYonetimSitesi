from django.db import models
from django.conf import settings
from django.utils import timezone
import qrcode
from io import BytesIO
from django.core.files import File
import hashlib
from datetime import timedelta


class Meeting(models.Model):
    """
    Topluluk toplantıları
    """
    MEETING_TYPE_CHOICES = [
        ('KOMITE', 'Komite Toplantısı'),
        ('GENEL_KURUL', 'Genel Kurul'),
        ('EGITIM', 'Eğitim'),
        ('KOORDINASYON', 'Koordinasyon'),
        ('DIGER', 'Diğer'),
    ]
    
    title = models.CharField(max_length=200, verbose_name='Toplantı Başlığı')
    description = models.TextField(verbose_name='Açıklama', blank=True)
    meeting_type = models.CharField(
        max_length=20, 
        choices=MEETING_TYPE_CHOICES,
        verbose_name='Toplantı Türü'
    )
    
    date_time = models.DateTimeField(verbose_name='Tarih ve Saat')
    location = models.CharField(max_length=200, verbose_name='Lokasyon')
    duration = models.IntegerField(default=60, help_text="Süre (dakika)", verbose_name='Süre')
    
    # Komite ilişkisi (null ise genel toplantı)
    committee = models.ForeignKey(
        'committees.Committee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='meetings',
        verbose_name='Komite'
    )
    is_general = models.BooleanField(
        default=False,
        help_text="Genel toplantı mı? (Komite dışı)",
        verbose_name='Genel Toplantı'
    )
    
    # QR kod
    qr_code = models.ImageField(upload_to='meeting_qr/', null=True, blank=True, verbose_name='QR Kod')
    qr_data = models.CharField(max_length=500, blank=True, help_text="QR kod verisi")
    qr_expires_at = models.DateTimeField(null=True, blank=True, verbose_name='QR Kod Son Geçerlilik')
    
    # Gündem maddeleri
    agenda_items = models.TextField(
        blank=True,
        help_text="Gündem maddeleri (her satır bir madde)",
        verbose_name='Gündem Maddeleri'
    )
    
    # Toplantı notları (sadece admin/başkan yardımcıları yazabilir)
    notes = models.TextField(blank=True, verbose_name='Toplantı Notları')
    
    # Kararlar ve aksiyonlar
    decisions = models.TextField(
        blank=True,
        help_text="Alınan kararlar",
        verbose_name='Kararlar'
    )
    actions = models.TextField(
        blank=True,
        help_text="Aksiyonlar ve sorumluları",
        verbose_name='Aksiyonlar'
    )
    
    # Oluşturan ve onay
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_meetings',
        verbose_name='Oluşturan'
    )
    
    # Status
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    
    # Hatırlatma gönderildi mi?
    reminder_sent = models.BooleanField(default=False, verbose_name='Hatırlatma Gönderildi')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Oluşturulma Tarihi')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Güncellenme Tarihi')
    
    class Meta:
        ordering = ['-date_time']
        verbose_name = 'Toplantı'
        verbose_name_plural = 'Toplantılar'
    
    def __str__(self):
        return f"{self.title} - {self.get_meeting_type_display()}"
    
    def generate_qr_code(self):
        """QR kod oluştur"""
        # QR kod verisi: meeting_id + timestamp
        qr_data = f"HSD_MEETING_{self.id}_{timezone.now().timestamp()}"
        self.qr_data = hashlib.sha256(qr_data.encode()).hexdigest()
        
        # QR kod sona erme süresi (toplantı bitişinden 1 saat sonra)
        self.qr_expires_at = self.date_time + timedelta(minutes=self.duration + 60)
        
        # QR kod görselini oluştur
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(self.qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        
        filename = f'meeting_{self.id}_qr.png'
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
        return self.attendances.filter(is_cancelled=False).count()
    
    @property
    def is_past(self):
        """Toplantı geçmiş mi?"""
        return timezone.now() > self.date_time
    
    def can_user_edit_notes(self, user):
        """Kullanıcı notları düzenleyebilir mi?"""
        return user.is_admin
    
    def can_user_view(self, user):
        """Kullanıcı toplantıyı görebilir mi?"""
        if self.is_general:
            return True  # Genel toplantılar herkes görebilir
        if not self.committee:
            return True  # Komite yoksa genel sayılır
        # Komite toplantısı ise komite üyeleri görebilir
        return user.is_in_committee(self.committee) or user.is_admin


class MeetingAttendance(models.Model):
    """
    Toplantı katılımları
    """
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name='attendances',
        verbose_name='Toplantı'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meeting_attendances',
        verbose_name='Kullanıcı'
    )
    
    scanned_at = models.DateTimeField(auto_now_add=True, verbose_name='Taranma Tarihi')
    points_earned = models.IntegerField(default=0, verbose_name='Kazanılan Puan')
    
    # İptal durumu
    is_cancelled = models.BooleanField(default=False, verbose_name='İptal Edildi')
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_meeting_attendances',
        verbose_name='İptal Eden'
    )
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name='İptal Tarihi')
    cancel_reason = models.TextField(blank=True, verbose_name='İptal Sebebi')
    
    class Meta:
        unique_together = ['meeting', 'user']
        ordering = ['-scanned_at']
        verbose_name = 'Toplantı Katılımı'
        verbose_name_plural = 'Toplantı Katılımları'
    
    def __str__(self):
        return f"{self.user.username} - {self.meeting.title}"
