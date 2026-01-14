from django.contrib import admin
from .models import Meeting, MeetingAttendance


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'meeting_type', 'date_time', 'location',
        'committee', 'is_general', 'attendee_count', 'is_active'
    ]
    list_filter = ['meeting_type', 'is_general', 'is_active', 'date_time']
    search_fields = ['title', 'description', 'location']
    ordering = ['-date_time']
    readonly_fields = [
        'qr_code', 'qr_data', 'qr_expires_at',
        'created_by', 'reminder_sent', 'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('title', 'description', 'meeting_type', 'date_time', 'location', 'duration')
        }),
        ('Komite Bilgisi', {
            'fields': ('committee', 'is_general')
        }),
        ('QR Kod', {
            'fields': ('qr_code', 'qr_data', 'qr_expires_at'),
            'classes': ('collapse',)
        }),
        ('Gündem ve Notlar', {
            'fields': ('agenda_items', 'notes', 'decisions', 'actions')
        }),
        ('Durum', {
            'fields': ('is_active', 'reminder_sent', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(MeetingAttendance)
class MeetingAttendanceAdmin(admin.ModelAdmin):
    list_display = ['user', 'meeting', 'scanned_at', 'points_earned', 'is_cancelled']
    list_filter = ['is_cancelled', 'scanned_at']
    search_fields = ['user__username', 'meeting__title']
    ordering = ['-scanned_at']
