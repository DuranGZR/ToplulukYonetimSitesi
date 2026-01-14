from rest_framework import serializers
from .models import Meeting, MeetingAttendance
from committees.serializers import CommitteeSerializer
from users.serializers import UserSerializer


class MeetingAttendanceSerializer(serializers.ModelSerializer):
    """Toplantı katılım serializer"""
    user_name = serializers.SerializerMethodField()
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MeetingAttendance
        fields = [
            'id', 'user', 'user_name', 'user_full_name',
            'scanned_at', 'points_earned', 'is_cancelled',
            'cancelled_by', 'cancelled_at', 'cancel_reason'
        ]
        read_only_fields = ['scanned_at', 'points_earned', 'cancelled_at']
    
    def get_user_name(self, obj):
        return obj.user.username if obj.user else None
    
    def get_user_full_name(self, obj):
        return obj.user.full_name if obj.user else None


class MeetingSerializer(serializers.ModelSerializer):
    """Toplantı serializer (liste görünümü)"""
    meeting_type_display = serializers.CharField(source='get_meeting_type_display', read_only=True)
    committee_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    attendee_count = serializers.IntegerField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_qr_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'description', 'meeting_type', 'meeting_type_display',
            'date_time', 'location', 'duration', 'committee', 'committee_name',
            'is_general', 'qr_code', 'qr_data', 'qr_expires_at', 'is_qr_valid',
            'agenda_items', 'notes', 'decisions', 'actions',
            'created_by', 'created_by_name', 'is_active', 'reminder_sent',
            'attendee_count', 'is_past', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'qr_code', 'qr_data', 'qr_expires_at', 'created_by',
            'reminder_sent', 'created_at', 'updated_at'
        ]
    
    def get_committee_name(self, obj):
        return obj.committee.name if obj.committee else None
    
    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None


class MeetingDetailSerializer(serializers.ModelSerializer):
    """Toplantı detay serializer"""
    meeting_type_display = serializers.CharField(source='get_meeting_type_display', read_only=True)
    committee_detail = CommitteeSerializer(source='committee', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    attendee_count = serializers.IntegerField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_qr_valid = serializers.BooleanField(read_only=True)
    attendances = MeetingAttendanceSerializer(many=True, read_only=True)
    can_edit_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'description', 'meeting_type', 'meeting_type_display',
            'date_time', 'location', 'duration', 'committee', 'committee_detail',
            'is_general', 'qr_code', 'qr_data', 'qr_expires_at', 'is_qr_valid',
            'agenda_items', 'notes', 'decisions', 'actions',
            'created_by', 'created_by_detail', 'is_active', 'reminder_sent',
            'attendee_count', 'is_past', 'attendances', 'can_edit_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'qr_code', 'qr_data', 'qr_expires_at', 'created_by',
            'reminder_sent', 'created_at', 'updated_at'
        ]
    
    def get_can_edit_notes(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.can_user_edit_notes(request.user)
        return False


class MeetingCreateSerializer(serializers.ModelSerializer):
    """Toplantı oluşturma serializer"""
    
    class Meta:
        model = Meeting
        fields = [
            'title', 'description', 'meeting_type', 'date_time',
            'location', 'duration', 'committee', 'is_general',
            'agenda_items'
        ]
    
    def validate(self, data):
        """Toplantı oluşturma validasyonu"""
        user = self.context['request'].user
        
        # Genel toplantı sadece admin oluşturabilir
        if data.get('is_general', False):
            if not user.is_admin:
                raise serializers.ValidationError({
                    'is_general': 'Sadece başkan ve başkan yardımcıları genel toplantı oluşturabilir.'
                })
        
        # Komite toplantısı kontrolü
        committee = data.get('committee')
        if committee and not data.get('is_general', False):
            # Komite lideri veya yardımcısı mı kontrol et
            if not user.is_admin and not committee.is_leader_or_vice(user):
                raise serializers.ValidationError({
                    'committee': 'Bu komitenin toplantısını oluşturma yetkiniz yok.'
                })
        
        return data


class MeetingUpdateNotesSerializer(serializers.ModelSerializer):
    """Toplantı notları güncelleme serializer"""
    
    class Meta:
        model = Meeting
        fields = ['notes', 'decisions', 'actions']

