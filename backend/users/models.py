from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator
from .validators import validate_image_size, validate_image_extension


class User(AbstractUser):
    # Override email to make it unique
    email = models.EmailField('email address', unique=True, blank=False)
    """
    Custom User model for HSD Platform
    Roles: Başkan (Admin), Başkan Yardımcısı, Birim Başkanı, Üye
    """
    
    ROLE_CHOICES = [
        ('BASKAN', 'Başkan'),
        ('BASKAN_YARDIMCISI', 'Başkan Yardımcısı'),
        ('KOMITE_LIDERI', 'Komite Lideri'),
        ('KOMITE_YARDIMCISI', 'Komite Başkan Yardımcısı'),
        ('UYE', 'Üye'),
    ]
    
    # Role and permissions
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='UYE')
    
    # Profile information
    department = models.CharField(max_length=100, blank=True, help_text="Bölüm (ör: Bilgisayar Mühendisliği)")
    grade = models.PositiveIntegerField(null=True, blank=True, help_text="Sınıf (1-4)")
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True, help_text="Kısa tanıtım")
    profile_image = models.ImageField(
        upload_to='profiles/',
        null=True,
        blank=True,
        validators=[validate_image_size, validate_image_extension],
        help_text="Profil resmi (Max 5MB, jpg/png/gif/webp)"
    )
    
    # Activity tracking
    star_count = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Kaç kez 'Ayın Parlayan Yıldızı' oldu")
    
    # Online status for real-time features
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['username']
        verbose_name = 'Kullanıcı'
        verbose_name_plural = 'Kullanıcılar'
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        """Başkan veya Başkan Yardımcısı mı?"""
        return self.role in ['BASKAN', 'BASKAN_YARDIMCISI']
    
    @property
    def is_committee_leader(self):
        """Komite lideri veya yardımcısı mı?"""
        return self.role in ['KOMITE_LIDERI', 'KOMITE_YARDIMCISI']
    
    @property
    def is_moderator(self):
        """Moderator yetkisi var mı? (Admin veya komite lideri)"""
        return self.is_admin or self.is_committee_leader
    
    @property
    def can_manage_content(self):
        """İçerik yönetimi yapabilir mi? (Admin veya komite lideri)"""
        return self.is_admin or self.is_committee_leader
    
    @property
    def full_name(self):
        return self.get_full_name() or self.username
    
    def get_user_committees(self):
        """Kullanıcının üyesi olduğu tüm komiteleri döndür"""
        from committees.models import Committee
        # Üye olduğu komiteler + lider olduğu + yardımcı olduğu
        return Committee.objects.filter(
            models.Q(members=self) | 
            models.Q(leader=self) | 
            models.Q(vice_leader=self)
        ).distinct()
    
    def is_in_committee(self, committee):
        """Kullanıcı belirtilen komitede mi?"""
        if not committee:
            return False
        return (
            self in committee.members.all() or
            self == committee.leader or
            self == committee.vice_leader
        )
    
    def can_manage_committee(self, committee):
        """Kullanıcı belirtilen komiteyi yönetebilir mi?"""
        if self.is_admin:
            return True
        if not committee:
            return False
        return committee.is_leader_or_vice(self)
    
    def add_points(self, points, source, source_id, description=""):
        """Kullanıcıya puan ekle ve ActivityLog oluştur"""
        from activity.models import ActivityLog
        
        # ActivityLog oluştur (aylık sistemde puanlar ActivityLog üzerinden hesaplanıyor)
        ActivityLog.objects.create(
            user=self,
            points=points,
            source=source,
            source_id=source_id,
            description=description
        )


class Skill(models.Model):
    """
    Kullanıcı yetenekleri/teknolojileri
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=50, help_text="Teknoloji/yetenek adı (ör: React, Python, Figma)")
    proficiency = models.IntegerField(
        default=1,
        choices=[
            (1, 'Başlangıç'),
            (2, 'Temel'),
            (3, 'Orta'),
            (4, 'İyi'),
            (5, 'Uzman'),
        ],
        help_text="Yetenek seviyesi (1-5)"
    )
    is_learning = models.BooleanField(default=False, help_text="Öğrenmek istiyor mu?")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-proficiency', 'name']
        unique_together = ['user', 'name']
        verbose_name = 'Yetenek'
        verbose_name_plural = 'Yetenekler'
    
    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.get_proficiency_display()})"


class SocialLink(models.Model):
    """
    Kullanıcı sosyal medya ve iletişim linkleri
    """
    PLATFORM_CHOICES = [
        ('linkedin', 'LinkedIn'),
        ('github', 'GitHub'),
        ('twitter', 'Twitter/X'),
        ('instagram', 'Instagram'),
        ('website', 'Kişisel Website'),
        ('medium', 'Medium'),
        ('youtube', 'YouTube'),
        ('behance', 'Behance'),
        ('dribbble', 'Dribbble'),
        ('other', 'Diğer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_links')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, help_text="Platform türü")
    title = models.CharField(max_length=50, help_text="Başlık (ör: 'LinkedIn Profilim', 'Portfolio')")
    url = models.URLField(max_length=500, help_text="Link URL'i")
    order = models.PositiveIntegerField(default=0, help_text="Gösterim sırası")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Sosyal Link'
        verbose_name_plural = 'Sosyal Linkler'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_platform_display()}"
