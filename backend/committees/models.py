from django.db import models


class Committee(models.Model):
    """Komite modeli"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Komite Adı')
    description = models.TextField(blank=True, verbose_name='Açıklama')
    leader = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_committees',
        verbose_name='Komite Lideri'
    )
    vice_leader = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vice_led_committees',
        verbose_name='Komite Başkan Yardımcısı'
    )
    members = models.ManyToManyField(
        'users.User',
        related_name='committees',
        blank=True,
        verbose_name='Üyeler'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Komite'
        verbose_name_plural = 'Komiteler'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_all_members(self):
        """Lider, yardımcı ve üyelerin hepsini döndür"""
        all_members = list(self.members.all())
        if self.leader and self.leader not in all_members:
            all_members.insert(0, self.leader)
        if self.vice_leader and self.vice_leader not in all_members:
            all_members.insert(1, self.vice_leader)
        return all_members
    
    def is_leader_or_vice(self, user):
        """Kullanıcı bu komitenin lideri veya yardımcısı mı?"""
        return user == self.leader or user == self.vice_leader


class CommitteeChatMessage(models.Model):
    """Committee chat messages for real-time communication"""
    committee = models.ForeignKey(
        Committee,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        verbose_name='Komite'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='committee_messages',
        verbose_name='Kullanıcı'
    )
    message = models.TextField(verbose_name='Mesaj')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Komite Mesajı'
        verbose_name_plural = 'Komite Mesajları'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.committee.name} - {self.created_at}"
