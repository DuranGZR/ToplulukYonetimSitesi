from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Skill, SocialLink


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'star_count', 'department', 'is_active']
    list_filter = ['role', 'is_active', 'department']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['username']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('HSD Bilgileri', {
            'fields': ('role', 'department', 'grade', 'phone', 'bio', 'profile_image')
        }),
        ('Yıldız Kazanımları', {
            'fields': ('star_count',)
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('HSD Bilgileri', {
            'fields': ('role', 'department', 'grade', 'email', 'first_name', 'last_name')
        }),
    )


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'proficiency', 'is_learning', 'created_at']
    list_filter = ['proficiency', 'is_learning']
    search_fields = ['user__username', 'name']
    ordering = ['-created_at']


@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ['user', 'platform', 'title', 'url', 'order', 'created_at']
    list_filter = ['platform']
    search_fields = ['user__username', 'title', 'url']
    ordering = ['user', 'order', '-created_at']
