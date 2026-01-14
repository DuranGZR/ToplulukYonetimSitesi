from django.db import models
from django.conf import settings
from django.utils import timezone


class Project(models.Model):
    """Proje yönetimi"""
    
    STATUS_CHOICES = [
        ('PLANLAMA', 'Planlama'),
        ('AKTIF', 'Aktif'),
        ('BEKLEMEDE', 'Beklemede'),
        ('TAMAMLANDI', 'Tamamlandı'),
        ('IPTAL', 'İptal'),
    ]
    
    PRIORITY_CHOICES = [
        ('DUSUK', 'Düşük'),
        ('ORTA', 'Orta'),
        ('YUKSEK', 'Yüksek'),
        ('KRITIK', 'Kritik'),
    ]
    
    title = models.CharField('Proje Adı', max_length=200)
    description = models.TextField('Açıklama')
    status = models.CharField('Durum', max_length=20, choices=STATUS_CHOICES, default='PLANLAMA')
    priority = models.CharField('Öncelik', max_length=10, choices=PRIORITY_CHOICES, default='ORTA')
    
    # İlişkiler
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects',
        verbose_name='Proje Sahibi'
    )
    team_members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='projects',
        verbose_name='Takım Üyeleri',
        blank=True
    )
    committee = models.ForeignKey(
        'committees.Committee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='projects',
        verbose_name='Komite',
        help_text='Bu projeyi sadece seçilen komite üyeleri görebilir'
    )
    
    # Tarihler
    start_date = models.DateField('Başlangıç Tarihi', null=True, blank=True)
    end_date = models.DateField('Bitiş Tarihi', null=True, blank=True)
    deadline = models.DateField('Son Tarih', null=True, blank=True)
    
    created_at = models.DateTimeField('Oluşturulma', auto_now_add=True)
    updated_at = models.DateTimeField('Güncellenme', auto_now=True)
    
    # İstatistikler
    total_points = models.IntegerField('Toplam Puan', default=0)
    completion_percentage = models.IntegerField('Tamamlanma %', default=0)
    
    # Ekstra
    tags = models.CharField('Etiketler', max_length=200, blank=True)
    repository_url = models.URLField('Repository URL', blank=True)
    documentation_url = models.URLField('Dokümantasyon URL', blank=True)
    
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
        related_name='approved_projects',
        verbose_name='Onaylayan'
    )
    approved_at = models.DateTimeField('Onaylanma Tarihi', null=True, blank=True)
    rejection_reason = models.TextField('Red Sebebi', blank=True)
    
    is_active = models.BooleanField('Aktif', default=True)
    
    class Meta:
        verbose_name = 'Proje'
        verbose_name_plural = 'Projeler'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['owner']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def update_statistics(self):
        """Proje istatistiklerini güncelle"""
        tasks = self.tasks.all()
        total_tasks = tasks.count()
        
        if total_tasks > 0:
            completed_tasks = tasks.filter(status='TAMAMLANDI').count()
            self.completion_percentage = int((completed_tasks / total_tasks) * 100)
            self.total_points = sum(task.points for task in tasks.filter(status='TAMAMLANDI'))
        else:
            self.completion_percentage = 0
            self.total_points = 0
        
        self.save()
    
    def add_team_member(self, user):
        """Takıma üye ekle"""
        self.team_members.add(user)
    
    def remove_team_member(self, user):
        """Takımdan üye çıkar"""
        self.team_members.remove(user)
    
    @property
    def is_overdue(self):
        """Proje gecikti mi?"""
        if self.deadline and self.status not in ['TAMAMLANDI', 'IPTAL']:
            from datetime import date
            return date.today() > self.deadline
        return False
    
    @property
    def task_count(self):
        """Toplam görev sayısı"""
        return self.tasks.count()
    
    @property
    def completed_task_count(self):
        """Tamamlanan görev sayısı"""
        return self.tasks.filter(status='TAMAMLANDI').count()


class ProjectTask(models.Model):
    """Proje içindeki görevler"""
    
    STATUS_CHOICES = [
        ('YAPILACAK', 'Yapılacak'),
        ('DEVAM_EDIYOR', 'Devam Ediyor'),
        ('TAMAMLANDI', 'Tamamlandı'),
    ]
    
    PRIORITY_CHOICES = [
        ('DUSUK', 'Düşük'),
        ('ORTA', 'Orta'),
        ('YUKSEK', 'Yüksek'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    
    title = models.CharField('Görev', max_length=200)
    description = models.TextField('Açıklama', blank=True)
    status = models.CharField('Durum', max_length=20, choices=STATUS_CHOICES, default='YAPILACAK')
    priority = models.CharField('Öncelik', max_length=10, choices=PRIORITY_CHOICES, default='ORTA')
    
    # Atama
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_tasks',
        verbose_name='Atanan Kişi'
    )
    
    # Puan
    points = models.IntegerField('Puan', default=5)
    
    # Tarihler
    created_at = models.DateTimeField('Oluşturulma', auto_now_add=True)
    updated_at = models.DateTimeField('Güncellenme', auto_now=True)
    completed_at = models.DateTimeField('Tamamlanma', null=True, blank=True)
    deadline = models.DateField('Son Tarih', null=True, blank=True)
    
    # Sıralama (Kanban board için)
    order = models.IntegerField('Sıra', default=0)
    
    class Meta:
        verbose_name = 'Proje Görevi'
        verbose_name_plural = 'Proje Görevleri'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"{self.project.title} - {self.title}"
    
    def complete(self):
        """Görevi tamamla"""
        import logging
        logger = logging.getLogger(__name__)
        
        if self.status == 'TAMAMLANDI':
            logger.warning(f"Görev zaten tamamlanmış: {self.id} - {self.title}")
            return False
        
        self.status = 'TAMAMLANDI'
        self.completed_at = timezone.now()
        self.save()
        
        logger.info(f"Görev tamamlandı: {self.id} - {self.title}, assigned_to: {self.assigned_to}")
        
        # Kullanıcıya puan ekle
        # assigned_to None olabilir, bu durumda puan eklenmez
        if self.assigned_to_id:  # assigned_to_id kullan (ForeignKey ID'si)
            try:
                # assigned_to'yu refresh et (güncel veri için)
                # ForeignKey olduğu için refresh_from_db() çalışmaz, yeniden çekmemiz gerekir
                from users.models import User
                user = User.objects.get(id=self.assigned_to_id)
                
                logger.info(f"Puan ekleniyor: User={user.id} ({user.username}), Points={self.points}, Source=PROJECT, SourceID={self.project.id}")
                logger.info(f"Kullanıcının mevcut total_points: {user.total_points}")
                
                # Puan ekle
                result = user.add_points(
                    points=self.points,
                    source='PROJECT',
                    source_id=self.project.id,
                    description=f"{self.project.title} - {self.title} görevini tamamladı"
                )
                
                # Kullanıcıyı yeniden çek (puanlar güncellenmiş olabilir)
                user = User.objects.get(id=user.id)
                logger.info(f"Puan eklendi. Yeni total_points: {user.total_points}, Level change: {result}")
                
            except Exception as e:
                # Hata durumunda logla ama işlemi durdurma
                logger.error(f"Proje görevi tamamlanırken puan eklenemedi: {e}", exc_info=True)
        else:
            # assigned_to None ise logla
            logger.warning(f"Proje görevi tamamlandı ama assigned_to None: {self.id} - {self.title}")
        
        # Proje istatistiklerini güncelle
        self.project.update_statistics()
        
        return True
    
    def change_status(self, new_status):
        """Durum değiştir"""
        import logging
        logger = logging.getLogger(__name__)
        
        old_status = self.status
        logger.info(f"Görev durumu değiştiriliyor: {self.id} - {self.title}, {old_status} -> {new_status}, assigned_to: {self.assigned_to}")
        
        # Eğer TAMAMLANDI'ya geçiyorsa, complete() metodunu çağır
        # complete() metodu zaten status'ü TAMAMLANDI yapıyor
        if new_status == 'TAMAMLANDI' and old_status != 'TAMAMLANDI':
            logger.info(f"Görev tamamlanıyor, complete() çağrılıyor: {self.id} - {self.title}")
            self.complete()
        else:
            # Diğer durumlar için sadece status'ü güncelle
            self.status = new_status
            self.save()
            self.project.update_statistics()
    
    @property
    def is_overdue(self):
        """Görev gecikti mi?"""
        if self.deadline and self.status != 'TAMAMLANDI':
            from datetime import date
            return date.today() > self.deadline
        return False


class ProjectComment(models.Model):
    """Proje yorumları"""
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    comment = models.TextField('Yorum')
    created_at = models.DateTimeField('Oluşturulma', auto_now_add=True)
    updated_at = models.DateTimeField('Güncellenme', auto_now=True)
    
    class Meta:
        verbose_name = 'Proje Yorumu'
        verbose_name_plural = 'Proje Yorumları'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.project.title}"
