from django.db import models
from django.conf import settings
from django.utils import timezone


class Task(models.Model):
    """Görev havuzu görevleri"""
    
    DIFFICULTY_CHOICES = [
        ('KOLAY', 'Kolay'),
        ('ORTA', 'Orta'),
        ('ZOR', 'Zor'),
    ]
    
    CATEGORY_CHOICES = [
        ('GELISTIRME', 'Yazılım Geliştirme'),
        ('TASARIM', 'Tasarım'),
        ('ICERIK', 'İçerik Üretimi'),
        ('ARASTIRMA', 'Araştırma'),
        ('DIGER', 'Diğer'),
    ]
    
    STATUS_CHOICES = [
        ('BEKLEMEDE', 'Beklemede'),
        ('DEVAM_EDIYOR', 'Devam Ediyor'),
        ('TAMAMLANDI', 'Tamamlandı'),
        ('IPTAL', 'İptal'),
    ]
    
    title = models.CharField('Başlık', max_length=200)
    description = models.TextField('Açıklama')
    category = models.CharField('Kategori', max_length=20, choices=CATEGORY_CHOICES)
    difficulty = models.CharField('Zorluk', max_length=10, choices=DIFFICULTY_CHOICES)
    points = models.IntegerField('Puan', default=10)
    
    status = models.CharField('Durum', max_length=20, choices=STATUS_CHOICES, default='BEKLEMEDE')
    
    # Görev ilişkileri
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks',
        verbose_name='Oluşturan'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        verbose_name='Atanan Kişi',
        help_text='DEPRECATED: assigned_users kullanın'
    )
    assigned_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_tasks_multi',
        blank=True,
        verbose_name='Atanan Kişiler',
        help_text='Göreve atanan birden fazla kişi'
    )
    committee = models.ForeignKey(
        'committees.Committee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        verbose_name='Komite',
        help_text='Bu görevi sadece seçilen komite üyeleri görebilir ve alabilir'
    )
    
    # Tarihler
    created_at = models.DateTimeField('Oluşturulma', auto_now_add=True)
    updated_at = models.DateTimeField('Güncellenme', auto_now=True)
    assigned_at = models.DateTimeField('Atanma Tarihi', null=True, blank=True)
    completed_at = models.DateTimeField('Tamamlanma Tarihi', null=True, blank=True)
    deadline = models.DateTimeField('Son Tarih', null=True, blank=True)
    
    # Ekstra alanlar
    tags = models.CharField('Etiketler', max_length=200, blank=True, help_text='Virgülle ayırın')
    requirements = models.TextField('Gereksinimler', blank=True)
    submission_url = models.URLField('Teslim URL', blank=True, help_text='GitHub, Drive vb.')
    
    # Onay sistemi
    APPROVAL_STATUS_CHOICES = [
        ('PENDING', 'Onay Bekliyor'),
        ('APPROVED', 'Onaylandı'),
        ('REJECTED', 'Reddedildi'),
    ]
    approval_status = models.CharField('Onay Durumu', max_length=20, choices=APPROVAL_STATUS_CHOICES, default='APPROVED')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_tasks',
        verbose_name='Onaylayan'
    )
    approved_at = models.DateTimeField('Onaylanma Tarihi', null=True, blank=True)
    rejection_reason = models.TextField('Red Sebebi', blank=True)
    
    # İptal sistemi
    cancellation_reason = models.TextField('İptal Sebebi', blank=True, help_text='Görev iptal edildiğinde sebep')
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_tasks',
        verbose_name='İptal Eden'
    )
    cancelled_at = models.DateTimeField('İptal Tarihi', null=True, blank=True)
    
    is_active = models.BooleanField('Aktif', default=True)
    
    class Meta:
        verbose_name = 'Görev'
        verbose_name_plural = 'Görevler'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def assign_to_user(self, user):
        """Görevi kullanıcıya ata"""
        self.assigned_to = user
        self.assigned_at = timezone.now()
        self.status = 'DEVAM_EDIYOR'
        self.save()
    
    def complete(self, completion_note=''):
        """Görevi tamamla"""
        if self.status == 'TAMAMLANDI':
            return False
        
        self.status = 'TAMAMLANDI'
        self.completed_at = timezone.now()
        self.save()
        
        # Kullanıcıya puan ekle
        if self.assigned_to:
            self.assigned_to.add_points(
                points=self.points,
                source='TASK',
                source_id=self.id,
                description=f"{self.title} görevini tamamladı"
            )
        
        # Tamamlama kaydı oluştur
        TaskCompletion.objects.create(
            task=self,
            user=self.assigned_to,
            points_earned=self.points,
            completion_note=completion_note
        )
        
        return True
    
    def cancel(self, reason='', cancelled_by=None):
        """Görevi iptal et"""
        self.status = 'IPTAL'
        self.cancellation_reason = reason
        if cancelled_by:
            self.cancelled_by = cancelled_by
        self.cancelled_at = timezone.now()
        self.save()
    
    @property
    def is_overdue(self):
        """Görev gecikti mi?"""
        if self.deadline and self.status not in ['TAMAMLANDI', 'IPTAL']:
            return timezone.now() > self.deadline
        return False
    
    @property
    def time_remaining(self):
        """Kalan süre"""
        if self.deadline and self.status not in ['TAMAMLANDI', 'IPTAL']:
            delta = self.deadline - timezone.now()
            if delta.total_seconds() > 0:
                days = delta.days
                hours = delta.seconds // 3600
                return f"{days} gün {hours} saat"
            return "Süresi doldu"
        return None


class TaskCompletion(models.Model):
    """Görev tamamlama kayıtları"""
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='completions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    points_earned = models.IntegerField('Kazanılan Puan')
    
    completed_at = models.DateTimeField('Tamamlanma', auto_now_add=True)
    completion_note = models.TextField('Tamamlama Notu', blank=True)
    
    # Onay süreci
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_completions'
    )
    approved_at = models.DateTimeField('Onaylanma', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Görev Tamamlama'
        verbose_name_plural = 'Görev Tamamlamalar'
        ordering = ['-completed_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.task.title}"


class TaskComment(models.Model):
    """Görev yorumları"""
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    comment = models.TextField('Yorum')
    created_at = models.DateTimeField('Oluşturulma', auto_now_add=True)
    updated_at = models.DateTimeField('Güncellenme', auto_now=True)
    
    class Meta:
        verbose_name = 'Görev Yorumu'
        verbose_name_plural = 'Görev Yorumları'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.task.title}"
