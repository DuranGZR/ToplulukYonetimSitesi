from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from .models import Meeting, MeetingAttendance
from .serializers import (
    MeetingSerializer, MeetingDetailSerializer, MeetingCreateSerializer,
    MeetingUpdateNotesSerializer, MeetingAttendanceSerializer
)
from .permissions import CanCreateMeeting, CanEditMeetingNotes, CanViewMeeting
from users.permissions import IsAdminUser
from events.models import Event
from tasks.models import Task


class MeetingViewSet(viewsets.ModelViewSet):
    """
    Toplantı yönetimi ViewSet
    """
    queryset = Meeting.objects.all().select_related(
        'created_by', 'committee', 'committee__leader', 'committee__vice_leader'
    ).prefetch_related('attendances', 'attendances__user')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MeetingCreateSerializer
        elif self.action == 'retrieve':
            return MeetingDetailSerializer
        elif self.action == 'update_notes':
            return MeetingUpdateNotesSerializer
        return MeetingSerializer
    
    def get_permissions(self):
        """Action bazlı permission kontrolü"""
        if self.action in ['create']:
            return [IsAuthenticated(), CanCreateMeeting()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]  # Sadece admin düzenleyebilir
        elif self.action in ['update_notes']:
            return [IsAuthenticated(), CanEditMeetingNotes()]
        elif self.action in ['retrieve', 'list']:
            return [IsAuthenticated()]  # Herkes görebilir ama filtreleme var
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Kullanıcının görebileceği toplantıları filtrele"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Admin her şeyi görebilir
        if user.is_admin:
            return queryset
        
        # Genel toplantılar + kullanıcının komite toplantıları
        from django.db.models import Q
        queryset = queryset.filter(
            Q(is_general=True) |  # Genel toplantılar
            Q(committee__members=user) |  # Komite üyesi
            Q(committee__leader=user) |  # Komite lideri
            Q(committee__vice_leader=user)  # Komite yardımcısı
        ).distinct()
        
        # Filtreleme
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        is_general = self.request.query_params.get('is_general')
        if is_general is not None:
            queryset = queryset.filter(is_general=is_general.lower() == 'true')
        
        meeting_type = self.request.query_params.get('meeting_type')
        if meeting_type:
            queryset = queryset.filter(meeting_type=meeting_type)
        
        return queryset
    
    def perform_create(self, serializer):
        """Toplantı oluşturma"""
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user
        
        # Genel toplantı kontrolü
        is_general = serializer.validated_data.get('is_general', False)
        if is_general and not user.is_admin:
            raise PermissionDenied('Sadece başkan ve başkan yardımcıları genel toplantı oluşturabilir.')
        
        # Komite toplantısı kontrolü
        committee = serializer.validated_data.get('committee')
        if not is_general:
            # Komite toplantısı için komite seçimi zorunlu
            if not committee:
                raise PermissionDenied('Komite toplantısı için komite seçimi gereklidir.')
            
            # Komite lideri veya yardımcısı ise, sadece kendi komitesine toplantı oluşturabilir
            if user.role in ['KOMITE_LIDERI', 'KOMITE_YARDIMCISI'] and not user.is_admin:
                if not committee.is_leader_or_vice(user):
                    raise PermissionDenied('Sadece kendi komitenize toplantı oluşturabilirsiniz.')
            elif not user.is_admin and not committee.is_leader_or_vice(user):
                raise PermissionDenied('Bu komitenin toplantısını oluşturma yetkiniz yok.')
        
        meeting = serializer.save(created_by=user)
        
        # QR kod otomatik oluştur
        meeting.generate_qr_code()
    
    @action(detail=True, methods=['post'])
    def generate_qr(self, request, pk=None):
        """QR kod oluştur/yenile"""
        meeting = self.get_object()
        meeting.generate_qr_code()
        
        serializer = MeetingDetailSerializer(meeting, context={'request': request})
        return Response({
            'message': 'QR kod başarıyla oluşturuldu!',
            'meeting': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """Toplantı QR kodunu göster"""
        meeting = self.get_object()
        if not meeting.is_qr_valid():
            return Response(
                {'error': 'QR kod süresi dolmuş veya geçersiz.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = MeetingDetailSerializer(meeting, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def scan_qr(self, request, pk=None):
        """QR kod tarama ve katılım kaydı"""
        meeting = self.get_object()
        user = request.user
        
        # QR kod kontrolü
        qr_data = request.data.get('qr_data')
        if not qr_data or qr_data != meeting.qr_data:
            return Response(
                {'error': 'Geçersiz QR kod.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # QR kod süresi kontrolü
        if not meeting.is_qr_valid():
            return Response(
                {'error': 'QR kod süresi dolmuş.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Daha önce katılım kaydı var mı?
        existing = MeetingAttendance.objects.filter(
            meeting=meeting,
            user=user,
            is_cancelled=False
        ).first()
        
        if existing:
            return Response(
                {'error': 'Bu toplantıya zaten katılım kaydınız var.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Katılım kaydı oluştur
        attendance = MeetingAttendance.objects.create(
            meeting=meeting,
            user=user,
            points_earned=5  # Toplantı katılım puanı (varsayılan 5)
        )
        
        # Kullanıcıya puan ekle
        level_change = user.add_points(
            points=5,
            source='MEETING',
            source_id=meeting.id,
            description=f"{meeting.title} toplantısına katılım"
        )
        
        message = f"5 puan kazandınız!"
        if level_change:
            message += f" Level {user.level}'e yükseldiniz!"
        
        serializer = MeetingAttendanceSerializer(attendance)
        return Response({
            'message': message,
            'attendance': serializer.data,
            'level_up': level_change is not None
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def attendances(self, request, pk=None):
        """Toplantı katılımcı listesi"""
        meeting = self.get_object()
        
        # Görüntüleme yetkisi kontrolü
        if not meeting.can_user_view(request.user):
            return Response(
                {'error': 'Bu toplantıyı görüntüleme yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        attendances = meeting.attendances.filter(is_cancelled=False)
        serializer = MeetingAttendanceSerializer(attendances, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['put', 'patch'])
    def update_notes(self, request, pk=None):
        """Toplantı notları, kararlar ve aksiyonları güncelle"""
        meeting = self.get_object()
        
        # Not düzenleme yetkisi kontrolü
        if not meeting.can_user_edit_notes(request.user):
            return Response(
                {'error': 'Toplantı notlarını düzenleme yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MeetingUpdateNotesSerializer(
            meeting,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        detail_serializer = MeetingDetailSerializer(meeting, context={'request': request})
        return Response({
            'message': 'Toplantı notları güncellendi.',
            'meeting': detail_serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_meetings(self, request):
        """Kullanıcının katıldığı toplantılar"""
        user = request.user
        attendances = MeetingAttendance.objects.filter(
            user=user,
            is_cancelled=False
        ).select_related('meeting', 'meeting__committee')
        
        meetings = [attendance.meeting for attendance in attendances]
        serializer = MeetingSerializer(meetings, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Yaklaşan toplantılar"""
        queryset = self.get_queryset().filter(date_time__gte=timezone.now())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CalendarView(APIView):
    """
    Takvim verileri için birleşik endpoint
    Events, Meetings ve Task deadlines'ı döndürür
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Aylık takvim verileri"""
        year = request.query_params.get('year', timezone.now().year)
        month = request.query_params.get('month', timezone.now().month)
        
        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response(
                {'error': 'Geçersiz yıl veya ay değeri.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from datetime import datetime, timedelta
        from calendar import monthrange
        
        # Ayın ilk ve son günü
        first_day = datetime(year, month, 1)
        last_day_num = monthrange(year, month)[1]
        last_day = datetime(year, month, last_day_num, 23, 59, 59)
        
        # Timezone aware
        first_day = timezone.make_aware(first_day)
        last_day = timezone.make_aware(last_day)
        
        user = request.user
        
        # Events
        events = Event.objects.filter(
            date_time__gte=first_day,
            date_time__lte=last_day,
            is_active=True
        )
        if not user.is_admin:
            events = events.filter(approval_status='APPROVED')
        
        # Meetings
        from django.db.models import Q
        meetings = Meeting.objects.filter(
            date_time__gte=first_day,
            date_time__lte=last_day,
            is_active=True
        )
        if not user.is_admin:
            meetings = meetings.filter(
                Q(is_general=True) |
                Q(committee__members=user) |
                Q(committee__leader=user) |
                Q(committee__vice_leader=user)
            ).distinct()
        
        # Task deadlines (gelecek için)
        tasks = Task.objects.filter(
            deadline__gte=first_day,
            deadline__lte=last_day,
            is_active=True,
            status__in=['BEKLEMEDE', 'DEVAM_EDIYOR']
        )
        
        # Serialize
        calendar_events = []
        
        # Events
        for event in events:
            end_time = event.date_time + timedelta(minutes=event.duration)
            calendar_events.append({
                'id': f'event_{event.id}',
                'type': 'event',
                'title': event.title,
                'start': event.date_time.isoformat(),
                'end': end_time.isoformat(),
                'color': '#dc2626',  # Kırmızı
                'url': f'/events/{event.id}',
                'description': event.description[:100] if event.description else '',
            })
        
        # Meetings
        for meeting in meetings:
            end_time = meeting.date_time + timedelta(minutes=meeting.duration)
            calendar_events.append({
                'id': f'meeting_{meeting.id}',
                'type': 'meeting',
                'title': meeting.title,
                'start': meeting.date_time.isoformat(),
                'end': end_time.isoformat(),
                'color': '#3b82f6',  # Mavi
                'url': f'/meetings/{meeting.id}',
                'description': meeting.description[:100] if meeting.description else '',
                'committee': meeting.committee.name if meeting.committee else None,
            })
        
        # Task deadlines
        for task in tasks:
            calendar_events.append({
                'id': f'task_{task.id}',
                'type': 'task',
                'title': f'⏰ {task.title}',
                'start': task.deadline.isoformat() if task.deadline else None,
                'end': task.deadline.isoformat() if task.deadline else None,
                'color': '#eab308',  # Sarı
                'url': f'/tasks/{task.id}',
                'description': task.description[:100] if task.description else '',
            })
        
        return Response({
            'year': year,
            'month': month,
            'events': calendar_events
        })
