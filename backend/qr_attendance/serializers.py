from rest_framework import serializers
from .models import QRCode, Attendance
from events.serializers import EventSerializer
from users.serializers import UserSerializer

class QRCodeSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    qr_data = serializers.SerializerMethodField()
    
    class Meta:
        model = QRCode
        fields = ['id', 'event', 'code', 'created_at', 'expires_at', 'is_active', 'qr_data']
        read_only_fields = ['code', 'created_at']
    
    def get_qr_data(self, obj):
        return str(obj.code)

class AttendanceSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Attendance
        fields = ['id', 'event', 'user', 'scanned_at', 'ip_address']
        read_only_fields = ['scanned_at', 'ip_address']

class ScanQRSerializer(serializers.Serializer):
    code = serializers.UUIDField()
