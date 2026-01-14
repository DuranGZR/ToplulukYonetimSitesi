from django.contrib import admin
from .models import LevelThreshold, ActivityLog, MonthlyLeaderboard, UserMonthlyStats


@admin.register(LevelThreshold)
class LevelThresholdAdmin(admin.ModelAdmin):
    list_display = ['level', 'min_points']
    ordering = ['level']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'points', 'source', 'description', 'created_at']
    list_filter = ['source', 'created_at']
    search_fields = ['user__username', 'description']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(MonthlyLeaderboard)
class MonthlyLeaderboardAdmin(admin.ModelAdmin):
    list_display = ['year', 'month', 'month_name', 'winning_points', 'winner_count', 'is_finalized', 'finalized_at']
    list_filter = ['year', 'month', 'is_finalized']
    search_fields = ['year', 'month']
    ordering = ['-year', '-month']
    readonly_fields = ['created_at', 'updated_at', 'finalized_at']
    filter_horizontal = ['winners']
    
    def winner_count(self, obj):
        return obj.winners.count()
    winner_count.short_description = 'Kazanan Sayısı'


@admin.register(UserMonthlyStats)
class UserMonthlyStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'year', 'month', 'points_earned', 'rank', 'is_winner']
    list_filter = ['year', 'month', 'is_winner']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    ordering = ['-year', '-month', '-points_earned']
    readonly_fields = ['created_at', 'updated_at']
