from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatRoom(models.Model):
    """
    Chat odaları - 4 tip:
    1. GENERAL - Genel chat (HSD Genel)
    2. COMMITTEE - Komite chatler
    3. PRIVATE - Özel mesajlar (1-1)
    4. PROJECT - Proje chatleri
    """
    ROOM_TYPE_CHOICES = [
        ('GENERAL', 'Genel Chat'),
        ('COMMITTEE', 'Komite Chat'),
        ('PRIVATE', 'Özel Mesaj'),
        ('PROJECT', 'Proje Chat'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='Oda Adı')
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='PRIVATE')
    
    # Komite chat için
    committee = models.OneToOneField(
        'committees.Committee',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='chat_room',
        verbose_name='Komite'
    )
    
    # Proje chat için
    project = models.OneToOneField(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='chat_room',
        verbose_name='Proje'
    )
    
    # Özel mesajlar için (2 kişi)
    participants = models.ManyToManyField(
        User,
        related_name='chat_rooms',
        blank=True,
        verbose_name='Katılımcılar'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Chat Odası'
        verbose_name_plural = 'Chat Odaları'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.get_room_type_display()} - {self.name}"
    
    def get_other_participant(self, user):
        """Özel mesajlarda diğer kişiyi döndür"""
        if self.room_type == 'PRIVATE':
            return self.participants.exclude(id=user.id).first()
        return None
    
    def can_access(self, user):
        """Kullanıcı bu odaya erişebilir mi?"""
        # Admin her yere girebilir
        if user.is_admin:
            return True
        
        # Genel chat herkese açık
        if self.room_type == 'GENERAL':
            return True
        
        # Komite chat - üye olmalı
        if self.room_type == 'COMMITTEE' and self.committee:
            return user.is_in_committee(self.committee)
        
        # Proje chat - proje üyesi olmalı
        if self.room_type == 'PROJECT' and self.project:
            return (
                self.project.owner == user or
                self.project.team_members.filter(id=user.id).exists() or
                (self.project.committee and user.is_in_committee(self.project.committee))
            )
        
        # Özel mesaj - katılımcı olmalı
        if self.room_type == 'PRIVATE':
            return self.participants.filter(id=user.id).exists()
        
        return False


class ChatMessage(models.Model):
    """Chat mesajları"""
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Oda'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name='Gönderen'
    )
    message = models.TextField(verbose_name='Mesaj')
    
    # Mesaj tipleri (text, image, file vs. - gelecek için)
    message_type = models.CharField(
        max_length=20,
        default='text',
        choices=[
            ('text', 'Metin'),
            ('image', 'Resim'),
            ('file', 'Dosya'),
        ]
    )
    
    # Okundu bilgisi için
    read_by = models.ManyToManyField(
        User,
        related_name='read_messages',
        blank=True,
        verbose_name='Okuyanlar'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Chat Mesajı'
        verbose_name_plural = 'Chat Mesajları'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username}: {self.message[:50]}"
    
    def mark_as_read(self, user):
        """Mesajı okundu olarak işaretle"""
        if user != self.sender:
            self.read_by.add(user)
