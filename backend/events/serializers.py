from rest_framework import serializers
from .models import Event, EventAttendance
from users.serializers import UserSerializer


class EventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    attendee_count = serializers.IntegerField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_qr_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'event_type_display',
            'date_time', 'location', 'duration', 'poster_image',
            'attendance_points', 'is_active', 'attendee_count', 'is_past',
            'created_by', 'created_by_name', 'is_qr_valid',
            'approval_status', 'approved_by', 'approved_at', 'rejection_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'approved_by', 'approved_at']
    
    def get_is_qr_valid(self, obj):
        return obj.is_qr_valid()


class EventDetailSerializer(EventSerializer):
    """QR kod bilgilerini içeren detaylı serializer"""
    qr_code = serializers.ImageField(read_only=True)
    qr_expires_at = serializers.DateTimeField(read_only=True)
    
    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ['qr_code', 'qr_expires_at']


class EventAttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    
    class Meta:
        model = EventAttendance
        fields = [
            'id', 'event', 'event_title', 'user', 'user_name',
            'scanned_at', 'points_earned', 'is_cancelled'
        ]
        read_only_fields = ['id', 'scanned_at', 'points_earned']


class QRScanSerializer(serializers.Serializer):
    """QR kod tarama için serializer"""
    qr_data = serializers.CharField()
