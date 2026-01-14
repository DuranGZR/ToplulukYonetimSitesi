from rest_framework import serializers
from .models import ActivityLog, LevelThreshold, MonthlyLeaderboard, UserMonthlyStats
from users.serializers import UserSerializer


class LevelThresholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = LevelThreshold
        fields = ['id', 'level', 'min_points']


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_name', 'points', 'source', 'source_display',
            'source_id', 'description', 'created_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at']


class MonthlyLeaderboardSerializer(serializers.ModelSerializer):
    month_name = serializers.CharField(read_only=True)
    winner_details = serializers.SerializerMethodField()
    
    class Meta:
        model = MonthlyLeaderboard
        fields = [
            'id', 'year', 'month', 'month_name', 'winners', 'winner_details',
            'winning_points', 'leaderboard_snapshot', 'is_finalized',
            'finalized_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_winner_details(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.winners.all(), many=True).data


class UserMonthlyStatsSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserMonthlyStats
        fields = [
            'id', 'user', 'user_name', 'user_username', 'year', 'month',
            'points_earned', 'rank', 'is_winner', 'events_attended',
            'tasks_completed', 'projects_contributed', 'meetings_attended',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
