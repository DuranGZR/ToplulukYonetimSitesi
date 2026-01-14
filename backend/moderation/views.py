from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType
from .models import UserReport
from .serializers import UserReportSerializer, CreateUserReportSerializer
from users.permissions import IsAdminUser

class UserReportViewSet(viewsets.ModelViewSet):
    queryset = UserReport.objects.all().select_related(
        'reporter', 'reported_user', 'resolved_by'
    ).order_by('-created_at')
    serializer_class = UserReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserReportSerializer
        return UserReportSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Sadece Başkan ve Başkan Yardımcısı tüm raporları görür
        if user.role in ['BASKAN', 'BASKAN_YARDIMCISI']:
            return UserReport.objects.all()
        return UserReport.objects.filter(reporter=user)
    
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def review(self, request, pk=None):
        """Mark report as reviewed with admin notes"""
        report = self.get_object()
        admin_notes = request.data.get('admin_notes', '')
        new_status = request.data.get('status', 'REVIEWED')
        
        # Eğer rapor RESOLVED olarak işaretleniyorsa ve daha önce RESOLVED değilse
        # Raporlanan kullanıcıdan puan kes ve bildirim gönder
        old_status = report.status
        report.status = new_status
        report.admin_notes = admin_notes
        report.resolved_by = request.user
        
        # Rapor türüne göre puan kesintisi miktarları
        PENALTY_POINTS = {
            'SPAM': 10,
            'HARASSMENT': 50,
            'INAPPROPRIATE': 30,
            'FAKE': 20,
            'OTHER': 15,
        }
        
        # Sadece RESOLVED olarak değişiyorsa ve daha önce RESOLVED değilse puan kes
        if new_status == 'RESOLVED' and old_status != 'RESOLVED':
            penalty_points = PENALTY_POINTS.get(report.report_type, 15)
            reported_user = report.reported_user
            
            # Puan kes (negatif değer ekle)
            level_change = reported_user.add_points(
                points=-penalty_points,
                source='REPORT',
                source_id=report.id,
                description=f"{report.get_report_type_display()} raporu nedeniyle {penalty_points} puan kesildi"
            )
            
            # ActivityLog'a created_by ekle (admin)
            from activity.models import ActivityLog
            ActivityLog.objects.filter(
                user=reported_user,
                source='REPORT',
                source_id=report.id
            ).update(created_by=request.user)
            
            # Bildirim oluştur
            from notifications.models import Notification
            report_content_type = ContentType.objects.get_for_model(UserReport)
            
            Notification.objects.create(
                recipient=reported_user,
                notification_type='REPORT_PENALTY',
                title='Rapor Cezası',
                message=f"Hakkınızda açılan rapor onaylandı. Rapor türü: {report.get_report_type_display()}. Bu nedenle {penalty_points} puanınız kesildi.",
                content_type=report_content_type,
                object_id=report.id,
                link=f'/moderation/reports/{report.id}'
            )
        
        report.save()
        
        serializer = self.get_serializer(report)
        response_data = serializer.data
        
        # Eğer puan kesildiyse, bilgi ekle
        if new_status == 'RESOLVED' and old_status != 'RESOLVED':
            penalty_points = PENALTY_POINTS.get(report.report_type, 15)
            response_data['penalty_applied'] = True
            response_data['penalty_points'] = penalty_points
            response_data['message'] = f"Rapor onaylandı ve {report.reported_user.username} kullanıcısından {penalty_points} puan kesildi."
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def pending(self, request):
        """Get all pending reports"""
        pending_reports = self.get_queryset().filter(status='PENDING')
        page = self.paginate_queryset(pending_reports)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(pending_reports, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """Get current user's reports"""
        my_reports = UserReport.objects.filter(reporter=request.user)
        serializer = self.get_serializer(my_reports, many=True)
        return Response(serializer.data)
