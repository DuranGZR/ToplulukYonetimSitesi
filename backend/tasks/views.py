from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Task, TaskCompletion, TaskComment
from .serializers import (
    TaskSerializer, TaskDetailSerializer, TaskCompletionSerializer,
    TaskCommentSerializer, TaskAssignSerializer, TaskCompleteSerializer,
    TaskTransferSerializer, TaskCancelSerializer
)
from users.permissions import IsAdminUser
from users.models import User


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.filter(is_active=True).select_related(
        'created_by', 'assigned_to', 'committee', 'approved_by', 'cancelled_by'
    )
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Admin veya komite liderleri oluşturabilir
            from users.permissions import IsCommitteeLeaderOrAdmin
            return [IsCommitteeLeaderOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        # Approval status filtresi varsa önce onu uygula
        approval_status_filter = self.request.query_params.get('approval_status')
        
        # Admin kullanıcılar için tüm görevleri göster (pasif dahil)
        if user.role in ['BASKAN', 'BASKAN_YARDIMCISI']:
            queryset = Task.objects.all().select_related(
                'created_by', 'assigned_to', 'committee', 'approved_by', 'cancelled_by'
            )
            # Approval status filtresi varsa uygula
            if approval_status_filter:
                queryset = queryset.filter(approval_status=approval_status_filter)
        else:
            queryset = super().get_queryset()
            # Diğerleri sadece onaylı görevleri görür
            # Herkes tüm onaylı görevleri görebilir (komite filtresi yok - "Tümü" sekmesi için)
            queryset = queryset.filter(approval_status='APPROVED')
        
        # Diğer filtreler (status, category, vb.)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Atanmamış görevler (Görev Havuzu)"""
        user = request.user
        
        # Görev havuzu için doğrudan Task.objects kullan
        from .models import Task
        from django.db.models import Q, Count
        
        # Temel filtreler: beklemede durumunda, assigned_to null ve aktif
        # Görev havuzunda sadece assigned_to null olan görevler gözükmeli (henüz kimse üstlenmemiş)
        # Görev havuzunda sadece onaylı (APPROVED) görevler gözükmeli
        # HERKES tüm onaylı görevleri görebilir (komite filtresi yok)
        base_filters = Q(
            status='BEKLEMEDE',  # Sadece beklemede olan görevler görev havuzunda
            assigned_to__isnull=True,  # assigned_to null olmalı (henüz kimse üstlenmemiş)
            is_active=True,
            approval_status='APPROVED'  # Sadece onaylı görevler görev havuzunda gözükmeli
        )
        
        # Herkes tüm onaylı görevleri görebilir
        # Komite üyeleri sadece kendi komitesinin görevlerini üstlenebilir (claim() action'ında kontrol edilir)
        tasks = Task.objects.filter(base_filters).select_related(
            'created_by', 'assigned_to', 'committee', 'approved_by', 'cancelled_by'
        )
        
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Kullanıcının görevleri"""
        tasks = self.queryset.filter(assigned_to=request.user)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Görev oluşturulurken kontroller"""
        user = self.request.user
        committee = serializer.validated_data.get('committee')
        
        # Komite seçiliyse, kullanıcı o komitenin lideri/yardımcısı mı veya admin mi kontrol et
        if committee:
            if not user.is_admin and not committee.is_leader_or_vice(user):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Bu komite için görev oluşturamazsınız.")
        elif not user.can_manage_content:
            # Genel görev sadece adminler oluşturabilir
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Genel görev oluşturma yetkiniz yok.")
        
        # Yetki kontrolü: Başkan ve Başkan Yardımcısı direkt onaylı, komite liderleri onay bekler
        if user.role in ['BASKAN', 'BASKAN_YARDIMCISI']:
            approval_status = 'APPROVED'  # Başkan/Başkan Yardımcısı direkt onaylı
            is_active = True  # Direkt aktif
        elif user.role in ['KOMITE_LIDERI', 'KOMITE_YARDIMCISI']:
            approval_status = 'PENDING'  # Komite lideri/yardımcısı onay bekler
            is_active = False  # Onay beklerken pasif
        else:
            approval_status = 'APPROVED'  # Normal üyeler için (varsayılan)
            is_active = True  # Direkt aktif
        
        serializer.save(created_by=user, approval_status=approval_status, is_active=is_active)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Görevi onayla (Admin)"""
        task = self.get_object()
        
        if task.approval_status == 'APPROVED':
            return Response({'error': 'Bu görev zaten onaylanmış.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.utils import timezone
        task.approval_status = 'APPROVED'
        task.approved_by = request.user
        task.approved_at = timezone.now()
        # Onaylandıktan sonra görev havuzunda gözükmesi için assigned_to null yap ve status'ü BEKLEMEDE yap
        task.assigned_to = None
        task.assigned_at = None
        task.status = 'BEKLEMEDE'
        task.is_active = True  # Aktif olmalı
        # assigned_users ManyToManyField'i temizle (görev havuzunda gözükmesi için)
        task.assigned_users.clear()
        task.save()
        
        return Response({'message': 'Görev onaylandı.', 'task': TaskSerializer(task).data})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Görevi reddet (Admin)"""
        task = self.get_object()
        
        if task.approval_status == 'REJECTED':
            return Response({'error': 'Bu görev zaten reddedilmiş.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.utils import timezone
        task.approval_status = 'REJECTED'
        task.approved_by = request.user
        task.approved_at = timezone.now()
        task.rejection_reason = request.data.get('reason', '')
        task.save()
        
        return Response({'message': 'Görev reddedildi.', 'task': TaskSerializer(task).data})
    
    @action(detail=True, methods=['post'])
    def claim(self, request, pk=None):
        """Görevi üstlen"""
        task = self.get_object()
        user = request.user
        
        # assigned_to kontrolü - eğer atanmışsa üstlenilemez
        if task.assigned_to:
            return Response(
                {'error': 'Bu görev zaten atanmış.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if task.status != 'BEKLEMEDE':
            return Response(
                {'error': 'Bu görev artık müsait değil.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Komite kontrolü - Sadece kendi komitesinin görevini alabilir
        if task.committee and not user.is_admin:
            if not user.is_in_committee(task.committee):
                return Response(
                    {'error': 'Bu görev sadece {} komitesi üyeleri içindir.'.format(task.committee.name)},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        task.assign_to_user(user)
        serializer = self.get_serializer(task)
        return Response({
            'message': 'Görev başarıyla üstlenildi!',
            'task': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Görevi belirli kullanıcıya ata (Admin veya Komite Lideri)"""
        task = self.get_object()
        user = request.user
        
        # Yetki kontrolü
        if not user.is_admin and not (task.committee and task.committee.is_leader_or_vice(user)):
            return Response(
                {'error': 'Bu görevi atama yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TaskAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data.get('user_id')
        if user_id:
            target_user = get_object_or_404(User, id=user_id)
            
            # Komite kontrolü - Sadece kendi komitesinden birine atayabilir
            if task.committee and not user.is_admin:
                if not target_user.is_in_committee(task.committee):
                    return Response(
                        {'error': f'{target_user.full_name} bu komitenin üyesi değil.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            task.assign_to_user(target_user)
            message = f"Görev {target_user.full_name}'e atandı"
        else:
            # Atamayı kaldır
            task.assigned_to = None
            task.assigned_at = None
            task.status = 'BEKLEMEDE'
            task.save()
            message = "Görev atamadan kaldırıldı"
        
        return Response({
            'message': message,
            'task': TaskSerializer(task).data
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Görevi tamamla"""
        task = self.get_object()
        
        # Sadece atanan kişi veya admin tamamlayabilir
        if task.assigned_to != request.user and not request.user.is_admin:
            return Response(
                {'error': 'Bu görevi tamamlama yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TaskCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        completion_note = serializer.validated_data.get('completion_note', '')
        submission_url = serializer.validated_data.get('submission_url', '')
        
        if submission_url:
            task.submission_url = submission_url
            task.save()
        
        success = task.complete(completion_note)
        
        if success:
            return Response({
                'message': f'Görev tamamlandı! {task.points} puan kazandınız.',
                'task': TaskSerializer(task).data
            })
        else:
            return Response(
                {'error': 'Görev zaten tamamlanmış.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """Görevi başka birine devret (Kullanıcı kendi görevini devredebilir)"""
        task = self.get_object()
        user = request.user
        
        # Sadece atanan kişi veya admin devredebilir
        if task.assigned_to != user and not user.is_admin:
            return Response(
                {'error': 'Bu görevi devretme yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Görev tamamlanmış veya iptal edilmişse devredilemez
        if task.status in ['TAMAMLANDI', 'IPTAL']:
            return Response(
                {'error': 'Tamamlanmış veya iptal edilmiş görevler devredilemez.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TaskTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data.get('user_id')
        reason = serializer.validated_data.get('reason', '')
        target_user = get_object_or_404(User, id=user_id)
        
        # Komite kontrolü - Sadece aynı komiteden birine devredebilir
        if task.committee and not user.is_admin:
            if not target_user.is_in_committee(task.committee):
                return Response(
                    {'error': f'{target_user.full_name} bu komitenin üyesi değil.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Görevi yeni kullanıcıya devret
        old_user = task.assigned_to
        task.assign_to_user(target_user)
        
        # Bildirim gönder (gelecekte notification sistemi ile entegre edilebilir)
        # TODO: Notification gönder
        
        return Response({
            'message': f"Görev {target_user.full_name}'e devredildi.",
            'task': TaskSerializer(task).data,
            'transferred_from': old_user.full_name if old_user else None,
            'transferred_to': target_user.full_name,
            'reason': reason
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Görevi iptal et (Admin veya kendi görevini iptal edebilir)"""
        task = self.get_object()
        user = request.user
        
        # Admin veya görevin sahibi iptal edebilir
        if not user.is_admin and task.assigned_to != user:
            return Response(
                {'error': 'Bu görevi iptal etme yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Görev zaten tamamlanmışsa iptal edilemez
        if task.status == 'TAMAMLANDI':
            return Response(
                {'error': 'Tamamlanmış görevler iptal edilemez.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TaskCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reason = serializer.validated_data.get('reason', '')
        task.cancel(reason, cancelled_by=user)
        
        # Bildirim gönder (gelecekte notification sistemi ile entegre edilebilir)
        # TODO: Notification gönder - Admin'e bildirim gönder
        
        return Response({
            'message': 'Görev iptal edildi. Admin moderasyon panelinde görebilir.',
            'task': TaskSerializer(task).data,
            'reason': reason
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reactivate(self, request, pk=None):
        """Görevi tekrar aktif hale getir (Admin) - İptal edilen görevleri görev havuzuna geri ekle"""
        task = self.get_object()
        
        # Sadece iptal edilmiş görevler tekrar aktif hale getirilebilir
        if task.status != 'IPTAL':
            return Response(
                {'error': 'Sadece iptal edilmiş görevler tekrar aktif hale getirilebilir.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Görevi tekrar aktif hale getir
        task.status = 'BEKLEMEDE'
        task.assigned_to = None
        task.assigned_at = None
        task.assigned_users.clear()
        task.is_active = True
        task.approval_status = 'APPROVED'  # Onaylı olarak işaretle
        # İptal bilgilerini temizleme (geçmiş için saklanabilir)
        # task.cancellation_reason = ''  # İptal sebebini sakla, sadece durumu değiştir
        task.save()
        
        return Response({
            'message': 'Görev tekrar aktif hale getirildi ve görev havuzunda görünüyor.',
            'task': TaskSerializer(task).data
        })
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Görev paylaşımı - Görev linkini ve bilgilerini döndür"""
        task = self.get_object()
        
        # Görev linki oluştur (frontend URL'i)
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        task_url = f"{frontend_url}/tasks/{task.id}"
        
        # Paylaşım bilgileri
        share_data = {
            'task_id': task.id,
            'task_title': task.title,
            'task_url': task_url,
            'points': task.points,
            'difficulty': task.get_difficulty_display(),
            'category': task.get_category_display(),
            'status': task.get_status_display(),
            'committee': task.committee.name if task.committee else None,
            'deadline': task.deadline.isoformat() if task.deadline else None,
        }
        
        # Eğer belirli bir kullanıcıya paylaşım yapılıyorsa (user_id varsa)
        user_id = request.data.get('user_id')
        if user_id:
            target_user = get_object_or_404(User, id=user_id)
            # TODO: Notification gönder
            return Response({
                'message': f"Görev {target_user.full_name}'e paylaşıldı.",
                'share_data': share_data
            })
        
        return Response({
            'message': 'Görev paylaşım bilgileri',
            'share_data': share_data
        })
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Görev yorumları"""
        task = self.get_object()
        
        if request.method == 'GET':
            comments = task.comments.all()
            serializer = TaskCommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        else:  # POST
            serializer = TaskCommentSerializer(
                data=request.data,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save(task=task)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskCompletionViewSet(viewsets.ReadOnlyModelViewSet):
    """Görev tamamlama kayıtları - Admin için"""
    queryset = TaskCompletion.objects.all()
    serializer_class = TaskCompletionSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Tamamlamayı onayla"""
        completion = self.get_object()
        
        if completion.approved_by:
            return Response(
                {'error': 'Bu tamamlama zaten onaylanmış.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        completion.approved_by = request.user
        completion.approved_at = timezone.now()
        completion.save()
        
        return Response({
            'message': 'Tamamlama onaylandı.',
            'completion': TaskCompletionSerializer(completion).data
        })
