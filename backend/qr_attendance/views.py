from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import QRCode, Attendance
from .serializers import QRCodeSerializer, AttendanceSerializer, ScanQRSerializer
from events.models import Event
from users.permissions import IsAdminUser

class QRCodeViewSet(viewsets.ModelViewSet):
    """QR Kod yönetimi"""
    queryset = QRCode.objects.all().select_related('event', 'event__created_by')
    serializer_class = QRCodeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Etkinlik için QR kod oluştur"""
        event_id = request.data.get('event_id')
        duration_hours = request.data.get('duration_hours', 24)
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Etkinlik bulunamadı'}, status=status.HTTP_404_NOT_FOUND)
        
        # Eski QR kodu varsa deaktive et
        QRCode.objects.filter(event=event).update(is_active=False)
        
        # Yeni QR kod oluştur
        qr_code = QRCode.objects.create(
            event=event,
            expires_at=timezone.now() + timedelta(hours=duration_hours)
        )
        
        serializer = self.get_serializer(qr_code)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """QR kodu deaktive et"""
        qr_code = self.get_object()
        qr_code.is_active = False
        qr_code.save()
        return Response({'message': 'QR kod deaktive edildi'})

class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """Yoklama kayıtları"""
    queryset = Attendance.objects.all().select_related('event', 'user').order_by('-scanned_at')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        return queryset
    
    @action(detail=False, methods=['post'])
    def scan(self, request):
        """QR kod okut ve yoklama kaydet"""
        serializer = ScanQRSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        code = serializer.validated_data['code']
        
        try:
            qr_code = QRCode.objects.get(code=code)
        except QRCode.DoesNotExist:
            return Response({'error': 'Geçersiz QR kod'}, status=status.HTTP_404_NOT_FOUND)
        
        if not qr_code.is_valid():
            return Response({'error': 'QR kod süresi dolmuş veya aktif değil'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Daha önce kaydedilmiş mi kontrol et
        if Attendance.objects.filter(event=qr_code.event, user=request.user).exists():
            return Response({'error': 'Bu etkinlik için zaten yoklama kaydınız var'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Yoklama kaydet
        attendance = Attendance.objects.create(
            event=qr_code.event,
            user=request.user,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        attendance_serializer = AttendanceSerializer(attendance)
        return Response({
            'message': 'Yoklama başarıyla kaydedildi',
            'attendance': attendance_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_attendances(self, request):
        """Kullanıcının yoklama kayıtları"""
        attendances = Attendance.objects.filter(user=request.user)
        serializer = self.get_serializer(attendances, many=True)
        return Response(serializer.data)
