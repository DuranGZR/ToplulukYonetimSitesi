from django.contrib import admin
from .models import Effort, EffortLike, EffortComment


@admin.register(Effort)
class EffortAdmin(admin.ModelAdmin):
    list_display = ['user', 'work_type', 'duration_display', 'date', 'points_earned', 'created_at']
    list_filter = ['work_type', 'date', 'committee', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'description']
    readonly_fields = ['points_earned', 'created_at', 'updated_at']
    
    fieldsets = [
        ('Temel Bilgiler', {
            'fields': ['user', 'work_type', 'date', 'duration_minutes', 'description']
        }),
        ('İlişkiler', {
            'fields': ['project', 'task', 'committee']
        }),
        ('Puan', {
            'fields': ['points_earned']
        }),
        ('Zaman Damgaları', {
            'fields': ['created_at', 'updated_at']
        }),
    ]


@admin.register(EffortLike)
class EffortLikeAdmin(admin.ModelAdmin):
    list_display = ['effort', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['effort__user__username', 'user__username']


@admin.register(EffortComment)
class EffortCommentAdmin(admin.ModelAdmin):
    list_display = ['effort', 'user', 'comment_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['effort__user__username', 'user__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    
    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Yorum'
