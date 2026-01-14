from django.contrib import admin
from .models import Committee


@admin.register(Committee)
class CommitteeAdmin(admin.ModelAdmin):
    list_display = ['name', 'leader', 'vice_leader', 'member_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description', 'leader__username', 'vice_leader__username']
    filter_horizontal = ['members']
    
    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Üye Sayısı'
