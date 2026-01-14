from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator


class Effort(models.Model):
    """
    Günlük çalışma kayıtları - Kullanıcıların günlük çalışmalarını paylaştığı model
    """
    
    WORK_TYPE_CHOICES = [
        ('PROJE', 'Proje'),
        ('GOREV', 'Görev'),
        ('GENEL', 'Genel Çalışma'),
        ('EGITIM', 'Eğitim'),
        ('ARASTIRMA', 'Araştırma'),
        ('TOPLANTI', 'Toplantı'),
        ('DIGER', 'Diğer'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='efforts',
        verbose_name='Kullanıcı'
    )
    
    work_type = models.CharField(
        max_length=20,
        choices=WORK_TYPE_CHOICES,
        verbose_name='Çalışma Türü'
    )
    
    # Opsiyonel bağlantılar
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='efforts',
        verbose_name='Proje',
        help_text='Hangi proje için çalışıldı?'
    )
    
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='efforts',
        verbose_name='Görev',
        help_text='Hangi görev için çalışıldı?'
    )
    
    # Süre ve açıklama
    duration_minutes = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Süre (Dakika)',
        help_text='Çalışma süresi dakika cinsinden'
    )
    
    description = models.TextField(
        verbose_name='Açıklama',
        blank=True,
        help_text='Ne çalışıldı? Kısa açıklama'
    )
    
    # Tarih (sadece bugün kayıt edilebilir, ama geçmiş görüntülenebilir)
    date = models.DateField(
        default=timezone.now,
        verbose_name='Tarih',
        db_index=True
    )
    
    # Puan (otomatik hesaplanır: 1 saat = 10 puan, yani 60 dakika = 10 puan)
    points_earned = models.IntegerField(
        default=0,
        verbose_name='Kazanılan Puan'
    )
    
    # Komite (otomatik olarak kullanıcının komitesinden alınır)
    committee = models.ForeignKey(
        'committees.Committee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='efforts',
        verbose_name='Komite'
    )
    
    # Zaman damgaları
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Oluşturulma')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Güncellenme')
    
    class Meta:
        verbose_name = 'Efor'
        verbose_name_plural = 'Eforlar'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['-date', '-created_at']),
            models.Index(fields=['user', '-date']),
            models.Index(fields=['committee', '-date']),
            models.Index(fields=['work_type', '-date']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(duration_minutes__gte=1),
                name='duration_minutes_positive'
            ),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.get_work_type_display()} - {self.date}"
    
    def save(self, *args, **kwargs):
        # Puan hesaplama: 1 saat (60 dakika) = 10 puan
        # Yani 1 dakika = 10/60 = 1/6 puan ≈ 0.167 puan
        # Ama tam sayı için: points = (duration_minutes * 10) / 60
        # Yuvarlayalım:
        self.points_earned = round((self.duration_minutes * 10) / 60)
        if self.points_earned < 1 and self.duration_minutes > 0:
            self.points_earned = 1  # En az 1 puan
        
        # Komite'yi otomatik olarak kullanıcının komitesinden al
        if not self.committee:
            user_committees = self.user.get_user_committees()
            if user_committees.exists():
                # İlk komiteyi al (kullanıcı birden fazla komitede olabilir)
                self.committee = user_committees.first()
        
        super().save(*args, **kwargs)
    
    @property
    def duration_hours(self):
        """Süreyi saat cinsinden döndür"""
        return round(self.duration_minutes / 60, 2)
    
    @property
    def duration_display(self):
        """Süreyi okunabilir formatta döndür"""
        hours = self.duration_minutes // 60
        minutes = self.duration_minutes % 60
        
        if hours > 0 and minutes > 0:
            return f"{hours} saat {minutes} dakika"
        elif hours > 0:
            return f"{hours} saat"
        else:
            return f"{minutes} dakika"


class EffortLike(models.Model):
    """Efor beğenileri"""
    
    effort = models.ForeignKey(
        Effort,
        on_delete=models.CASCADE,
        related_name='likes',
        verbose_name='Efor'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='effort_likes',
        verbose_name='Kullanıcı'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Beğenilme Tarihi')
    
    class Meta:
        verbose_name = 'Efor Beğenisi'
        verbose_name_plural = 'Efor Beğenileri'
        ordering = ['-created_at']
        unique_together = ['effort', 'user']  # Bir kullanıcı bir eforu sadece bir kez beğenebilir
        indexes = [
            models.Index(fields=['effort', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} beğendi: {self.effort}"


class EffortComment(models.Model):
    """Efor yorumları"""
    
    effort = models.ForeignKey(
        Effort,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Efor'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='effort_comments',
        verbose_name='Kullanıcı'
    )
    
    comment = models.TextField(verbose_name='Yorum')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yorum Tarihi')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Güncellenme Tarihi')
    
    class Meta:
        verbose_name = 'Efor Yorumu'
        verbose_name_plural = 'Efor Yorumları'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['effort', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} yorumladı: {self.effort}"
