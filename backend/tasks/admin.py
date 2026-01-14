from django.contrib import admin
from .models import Task, TaskCompletion, TaskComment


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'difficulty', 'points', 'status', 'assigned_to', 'created_by', 'created_at']
    list_filter = ['status', 'category', 'difficulty', 'is_active', 'created_at']
    search_fields = ['title', 'description', 'tags']
    readonly_fields = ['created_at', 'updated_at', 'assigned_at', 'completed_at']
    
    fieldsets = [
        ('Temel Bilgiler', {
            'fields': ['title', 'description', 'category', 'difficulty', 'points']
        }),
        ('Durum & Atama', {
            'fields': ['status', 'created_by', 'assigned_to', 'assigned_at', 'completed_at']
        }),
        ('Tarihler', {
            'fields': ['deadline', 'created_at', 'updated_at']
        }),
        ('Ekstra', {
            'fields': ['tags', 'requirements', 'submission_url', 'is_active'],
            'classes': ['collapse']
        }),
    ]
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(TaskCompletion)
class TaskCompletionAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'points_earned', 'completed_at', 'approved_by', 'approved_at']
    list_filter = ['completed_at', 'approved_at']
    search_fields = ['task__title', 'user__first_name', 'user__last_name']
    readonly_fields = ['completed_at', 'approved_at']


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'comment_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['task__title', 'user__first_name', 'user__last_name', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    
    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Yorum'
