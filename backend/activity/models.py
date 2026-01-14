from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class LevelThreshold(models.Model):
    """
    Seviye eşik değerleri
    Örnek: Level 1: 0-100, Level 2: 100-250, Level 3: 250-500
    """
    level = models.PositiveIntegerField(unique=True, validators=[MinValueValidator(1)])
    min_points = models.IntegerField(validators=[MinValueValidator(0)])
    
    class Meta:
        ordering = ['level']
        verbose_name = 'Seviye Eşiği'
        verbose_name_plural = 'Seviye Eşikleri'
    
    def __str__(self):
        return f"Level {self.level}: {self.min_points}+ puan"


class ActivityLog(models.Model):
    """
    Kullanıcı aktivite log'ları - tüm puan hareketlerini kaydeder
    """
    
    SOURCE_CHOICES = [
        ('EVENT', 'Etkinlik'),
        ('TASK', 'Görev'),
        ('PROJECT', 'Proje'),
        ('EFFORT', 'Efor'),
        ('EFFORT_UPDATE', 'Efor Güncelleme'),
        ('MEETING', 'Toplantı'),
        ('MANUAL', 'Manuel (Admin)'),
        ('REPORT', 'Rapor Cezası'),
        ('OTHER', 'Diğer'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_logs')
    points = models.IntegerField(help_text="Kazanılan veya kaybedilen puan")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    source_id = models.IntegerField(null=True, blank=True, help_text="İlgili kaynak ID (event, task, project)")
    description = models.TextField(blank=True, help_text="Puan açıklaması")
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs_created',
        help_text="Admin tarafından eklendiyse"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Aktivite Logu'
        verbose_name_plural = 'Aktivite Logları'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username}: {self.points} puan ({self.get_source_display()})"


class MonthlyLeaderboard(models.Model):
    """
    Aylık lider tablosu - Her ayın sonunda dondurulur
    """
    year = models.IntegerField(help_text="Yıl (2025, 2026...)")
    month = models.IntegerField(help_text="Ay (1-12)")
    
    # Kazananlar (birden fazla olabilir - eşitlik durumunda)
    winners = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='monthly_wins',
        help_text="Ayın parlayan yıldızları"
    )
    winning_points = models.IntegerField(default=0, help_text="Kazanan puan")
    
    # Top 10 snapshot (JSON field)
    leaderboard_snapshot = models.JSONField(
        default=list,
        help_text="O ayın top 10 kullanıcısı [{user_id, username, points, rank}, ...]"
    )
    
    is_finalized = models.BooleanField(default=False, help_text="Ay sonunda finalize edildi mi?")
    finalized_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', '-month']
        unique_together = ['year', 'month']
        verbose_name = 'Aylık Lider Tablosu'
        verbose_name_plural = 'Aylık Lider Tabloları'
        indexes = [
            models.Index(fields=['-year', '-month']),
        ]
    
    def __str__(self):
        return f"{self.year}/{self.month:02d} - {self.winners.count()} Yıldız"
    
    @property
    def month_name(self):
        """Ay adını döndür (Türkçe)"""
        months = {
            1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
            5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
            9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
        }
        return months.get(self.month, '')


class UserMonthlyStats(models.Model):
    """
    Her kullanıcının aylık puan istatistikleri
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='monthly_stats'
    )
    year = models.IntegerField()
    month = models.IntegerField()
    
    points_earned = models.IntegerField(default=0, help_text="O ay toplanan puan")
    rank = models.IntegerField(null=True, blank=True, help_text="O ayki sıralama")
    is_winner = models.BooleanField(default=False, help_text="Ayın yıldızı mı?")
    
    # Aktivite detayları
    events_attended = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)
    projects_contributed = models.IntegerField(default=0)
    meetings_attended = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', '-month', '-points_earned']
        unique_together = ['user', 'year', 'month']
        verbose_name = 'Kullanıcı Aylık İstatistik'
        verbose_name_plural = 'Kullanıcı Aylık İstatistikleri'
        indexes = [
            models.Index(fields=['user', '-year', '-month']),
            models.Index(fields=['-year', '-month', '-points_earned']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.year}/{self.month:02d}: {self.points_earned} puan"
