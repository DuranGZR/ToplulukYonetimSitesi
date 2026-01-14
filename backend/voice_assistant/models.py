from django.db import models
from django.conf import settings
from django.utils import timezone


class VoiceCallLog(models.Model):
    """Telefon araması log kayıtları"""
    
    caller_number = models.CharField(max_length=20, verbose_name='Arayan Numara')
    called_number = models.CharField(max_length=20, verbose_name='Aranan Numara')
    
    # Soru ve cevap
    user_question = models.TextField(verbose_name='Kullanıcı Sorusu', blank=True)
    assistant_response = models.TextField(verbose_name='Asistan Cevabı', blank=True)
    
    # Durum
    STATUS_CHOICES = [
        ('CONNECTED', 'Bağlandı'),
        ('PROCESSING', 'İşleniyor'),
        ('COMPLETED', 'Tamamlandı'),
        ('FAILED', 'Başarısız'),
        ('REJECTED', 'Reddedildi'),  # Site dışı soru
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONNECTED')
    
    # Süre
    duration_seconds = models.IntegerField(default=0, verbose_name='Süre (saniye)')
    
    # Hata bilgisi
    error_message = models.TextField(blank=True, verbose_name='Hata Mesajı')
    
    # Tarih
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Telefon Araması Log'
        verbose_name_plural = 'Telefon Araması Logları'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['caller_number', 'created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.caller_number} - {self.get_status_display()} - {self.created_at}"

