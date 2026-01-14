from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Event, EventAttendance
from .serializers import (
    EventSerializer, EventDetailSerializer,
    EventAttendanceSerializer, QRScanSerializer
)
from users.permissions import IsAdminUser


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().select_related('created_by', 'approved_by')
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Sadece Başkan ve Başkan Yardımcısı tüm etkinlikleri görür (pending dahil)
        if user.role in ['BASKAN', 'BASKAN_YARDIMCISI']:
            queryset = Event.objects.all()
            # Approval status filtresi (sadece admin için)
            approval_status_filter = self.request.query_params.get('approval_status')
            if approval_status_filter:
                queryset = queryset.filter(approval_status=approval_status_filter)
            return queryset
        return Event.objects.filter(approval_status='APPROVED')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EventDetailSerializer
        return EventSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Yetki kontrolü: Başkan ve Başkan Yardımcısı direkt onaylı, komite liderleri onay bekler
        if user.role in ['BASKAN', 'BASKAN_YARDIMCISI']:
            approval_status = 'APPROVED'  # Başkan/Başkan Yardımcısı direkt onaylı
            is_active = True  # Direkt aktif
        elif user.role in ['KOMITE_LIDERI', 'KOMITE_YARDIMCISI']:
            approval_status = 'PENDING'  # Komite liderleri onay bekler
            is_active = False  # Onay beklerken pasif
        else:
            approval_status = 'APPROVED'  # Normal üyeler için (varsayılan)
            is_active = False  # Normal üyeler için pasif (güvenlik)
        
        event = serializer.save(
            created_by=user,
            approval_status=approval_status,
            is_active=is_active
        )
        
        # QR kod manuel olarak oluşturulacak (otomatik değil)
    
    @action(detail=True, methods=['get'])
    def attendees(self, request, pk=None):
        """Etkinlik katılımcı listesi"""
        event = self.get_object()
        attendances = EventAttendance.objects.filter(event=event).select_related('user')
        serializer = EventAttendanceSerializer(attendances, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Etkinliği onayla (Admin)"""
        event = self.get_object()
        
        if event.approval_status == 'APPROVED':
            return Response({'error': 'Bu etkinlik zaten onaylanmış.'}, status=status.HTTP_400_BAD_REQUEST)
        
        event.approval_status = 'APPROVED'
        event.approved_by = request.user
        event.approved_at = timezone.now()
        event.save()
        
        return Response({'message': 'Etkinlik onaylandı.', 'event': EventSerializer(event).data})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Etkinliği reddet (Admin)"""
        event = self.get_object()
        
        if event.approval_status == 'REJECTED':
            return Response({'error': 'Bu etkinlik zaten reddedilmiş.'}, status=status.HTTP_400_BAD_REQUEST)
        
        event.approval_status = 'REJECTED'
        event.approved_by = request.user
        event.approved_at = timezone.now()
        event.rejection_reason = request.data.get('reason', '')
        event.save()
        
        return Response({'message': 'Etkinlik reddedildi.', 'event': EventSerializer(event).data})
    
    @action(detail=True, methods=['post'])
    def generate_qr(self, request, pk=None):
        """Etkinlik için QR kod oluştur/yenile (Başkan/Başkan Yardımcısı)"""
        user = request.user
        if user.role not in ['BASKAN', 'BASKAN_YARDIMCISI']:
            return Response({'error': 'Yetkiniz yok. Sadece Başkan ve Başkan Yardımcısı QR kod oluşturabilir.'}, status=status.HTTP_403_FORBIDDEN)
        
        event = self.get_object()
        event.generate_qr_code()
        serializer = EventDetailSerializer(event)
        return Response({'message': 'QR kod başarıyla oluşturuldu!', 'event': serializer.data})
    
    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """Etkinlik QR kodunu göster"""
        event = self.get_object()
        if not event.is_qr_valid():
            return Response(
                {'error': 'QR kod süresi dolmuş veya geçersiz.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = EventDetailSerializer(event)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def scan_qr(self, request, pk=None):
        """QR kod tarama ve katılım kaydı"""
        event = self.get_object()
        user = request.user
        
        # QR kod kontrolü
        qr_data = request.data.get('qr_data')
        if not qr_data or qr_data != event.qr_data:
            return Response(
                {'error': 'Geçersiz QR kod.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # QR kod süresi kontrolü
        if not event.is_qr_valid():
            return Response(
                {'error': 'QR kod süresi dolmuş.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Daha önce katılım kaydı var mı?
        if EventAttendance.objects.filter(event=event, user=user, is_cancelled=False).exists():
            return Response(
                {'error': 'Bu etkinliğe zaten katılım kaydınız var.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Katılım kaydı oluştur
        attendance = EventAttendance.objects.create(
            event=event,
            user=user,
            points_earned=event.attendance_points
        )
        
        # Kullanıcıya puan ekle
        level_change = user.add_points(
            points=event.attendance_points,
            source='EVENT',
            source_id=event.id,
            description=f"{event.title} etkinliğine katılım"
        )
        
        message = f"{event.attendance_points} puan kazandınız!"
        if level_change:
            old_level, new_level = level_change
            message += f" Tebrikler, Level {new_level}'e yükseldiniz!"
        
        return Response({
            'message': message,
            'attendance': EventAttendanceSerializer(attendance).data,
            'new_total': user.total_points,
            'new_level': user.level
        })
    
    @action(detail=True, methods=['get'])
    def attendances(self, request, pk=None):
        """Etkinlik katılımcıları"""
        event = self.get_object()
        attendances = event.attendances.filter(is_cancelled=False)
        serializer = EventAttendanceSerializer(attendances, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Yaklaşan etkinlikler (7 gün içinde)"""
        from datetime import timedelta
        
        now = timezone.now()
        seven_days_later = now + timedelta(days=7)
        
        events = self.queryset.filter(
            date_time__gte=now,
            date_time__lte=seven_days_later,
            is_active=True
        ).order_by('date_time')[:10]
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """Kullanıcının katıldığı etkinlikler"""
        attendances = EventAttendance.objects.filter(
            user=request.user,
            is_cancelled=False
        )
        event_ids = attendances.values_list('event_id', flat=True)
        events = self.queryset.filter(id__in=event_ids)
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)


class EventAttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """Katılım kayıtları - Admin için"""
    queryset = EventAttendance.objects.all()
    serializer_class = EventAttendanceSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Katılımı iptal et"""
        attendance = self.get_object()
        
        if attendance.is_cancelled:
            return Response(
                {'error': 'Bu katılım zaten iptal edilmiş.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Puanı geri al
        user = attendance.user
        user.total_points -= attendance.points_earned
        user.save()
        
        # Katılımı iptal et
        attendance.is_cancelled = True
        attendance.cancelled_by = request.user
        attendance.cancelled_at = timezone.now()
        attendance.cancel_reason = request.data.get('reason', 'Yönetici tarafından iptal edildi')
        attendance.save()
        
        return Response({
            'message': 'Katılım iptal edildi ve puanlar geri alındı.',
            'attendance': EventAttendanceSerializer(attendance).data
        })
