from django.contrib import admin
from .models import Event, EventAttendance


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'date_time', 'location', 'attendee_count', 'is_active']
    list_filter = ['event_type', 'is_active', 'date_time']
    search_fields = ['title', 'description', 'location']
    ordering = ['-date_time']
    readonly_fields = ['qr_code', 'qr_data', 'qr_expires_at', 'created_at', 'updated_at']


@admin.register(EventAttendance)
class EventAttendanceAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'scanned_at', 'points_earned', 'is_cancelled']
    list_filter = ['is_cancelled', 'scanned_at']
    search_fields = ['user__username', 'event__title']
    ordering = ['-scanned_at']
