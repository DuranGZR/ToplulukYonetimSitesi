from django.contrib import admin
from .models import Project, ProjectTask, ProjectComment


class ProjectTaskInline(admin.TabularInline):
    model = ProjectTask
    extra = 0
    fields = ['title', 'status', 'priority', 'assigned_to', 'points', 'deadline']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'owner', 'completion_percentage', 'task_count', 'created_at']
    list_filter = ['status', 'priority', 'is_active', 'created_at']
    search_fields = ['title', 'description', 'tags']
    readonly_fields = ['created_at', 'updated_at', 'completion_percentage', 'total_points']
    filter_horizontal = ['team_members']
    inlines = [ProjectTaskInline]
    
    fieldsets = [
        ('Temel Bilgiler', {
            'fields': ['title', 'description', 'status', 'priority']
        }),
        ('Takım', {
            'fields': ['owner', 'team_members']
        }),
        ('Tarihler', {
            'fields': ['start_date', 'end_date', 'deadline', 'created_at', 'updated_at']
        }),
        ('İstatistikler', {
            'fields': ['completion_percentage', 'total_points']
        }),
        ('Ekstra', {
            'fields': ['tags', 'repository_url', 'documentation_url', 'is_active'],
            'classes': ['collapse']
        }),
    ]
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.owner = request.user
        super().save_model(request, obj, form, change)


@admin.register(ProjectTask)
class ProjectTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'assigned_to', 'points', 'deadline', 'created_at']
    list_filter = ['status', 'priority', 'project', 'created_at']
    search_fields = ['title', 'description', 'project__title']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    
    fieldsets = [
        ('Temel Bilgiler', {
            'fields': ['project', 'title', 'description', 'status', 'priority']
        }),
        ('Atama & Puan', {
            'fields': ['assigned_to', 'points']
        }),
        ('Tarihler', {
            'fields': ['deadline', 'created_at', 'updated_at', 'completed_at']
        }),
        ('Sıralama', {
            'fields': ['order']
        }),
    ]


@admin.register(ProjectComment)
class ProjectCommentAdmin(admin.ModelAdmin):
    list_display = ['project', 'user', 'comment_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['project__title', 'user__first_name', 'user__last_name', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    
    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Yorum'
