from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Project, ProjectTask, ProjectComment
from .serializers import (
    ProjectSerializer, ProjectDetailSerializer, ProjectTaskSerializer,
    ProjectCommentSerializer, TaskStatusChangeSerializer
)
from users.permissions import IsAdminUser
from users.models import User


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.filter(is_active=True).select_related(
        'owner', 'committee'
    ).prefetch_related(
        'team_members', 'team_members__skills'
    )
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer
    
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
        
        # Admin kullanıcılar için tüm projeleri göster (pasif dahil)
        if user.role in ['BASKAN', 'BASKAN_YARDIMCISI']:
            queryset = Project.objects.all().select_related(
                'owner', 'committee'
            ).prefetch_related(
                'team_members', 'team_members__skills'
            )
            # Approval status filtresi varsa uygula
            if approval_status_filter:
                queryset = queryset.filter(approval_status=approval_status_filter)
        else:
            queryset = super().get_queryset()
            # Diğerleri sadece onaylı projeleri görür
            queryset = queryset.filter(approval_status='APPROVED')
            
            # Komite lideri sadece kendi komitesinin projelerini yönetebilir
            # Normal üye sadece kendi komitesinin veya genel projeleri görebilir
            from django.db.models import Q
            user_committees = user.committees.all()
            queryset = queryset.filter(
                Q(committee__isnull=True) |  # Genel projeler
                Q(committee__in=user_committees) |  # Kendi komitesinin projeleri
                Q(team_members=user)  # Üye olduğu projeler
            ).distinct()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        # Kullanıcının projelerini göster
        my_projects = self.request.query_params.get('my_projects')
        if my_projects:
            queryset = queryset.filter(team_members=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Proje oluşturulurken kontroller"""
        user = self.request.user
        committee = serializer.validated_data.get('committee')
        
        # Komite seçiliyse, kullanıcı o komitenin lideri/yardımcısı mı veya admin mi kontrol et
        if committee:
            if not user.is_admin and not committee.is_leader_or_vice(user):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Bu komite için proje oluşturamazsınız.")
        elif not user.can_manage_content:
            # Genel proje sadece adminler oluşturabilir
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Genel proje oluşturma yetkiniz yok.")
        
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
        
        serializer.save(owner=user, approval_status=approval_status, is_active=is_active)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Projeyi onayla (Admin)"""
        project = self.get_object()
        
        if project.approval_status == 'APPROVED':
            return Response({'error': 'Bu proje zaten onaylanmış.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.utils import timezone
        project.approval_status = 'APPROVED'
        project.approved_by = request.user
        project.approved_at = timezone.now()
        project.is_active = True  # Onaylandığında aktif yap
        project.save()
        
        return Response({'message': 'Proje onaylandı.', 'project': ProjectSerializer(project).data})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Projeyi reddet (Admin)"""
        project = self.get_object()
        
        if project.approval_status == 'REJECTED':
            return Response({'error': 'Bu proje zaten reddedilmiş.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.utils import timezone
        project.approval_status = 'REJECTED'
        project.approved_by = request.user
        project.approved_at = timezone.now()
        project.rejection_reason = request.data.get('reason', '')
        project.save()
        
        return Response({'message': 'Proje reddedildi.', 'project': ProjectSerializer(project).data})
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """Kullanıcının projeleri (sahibi olduğu veya üyesi olduğu)"""
        from django.db.models import Q
        projects = self.get_queryset().filter(
            Q(owner=request.user) | Q(team_members=request.user)
        ).distinct()
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Projeye üye ekle (Komite lideri veya Admin)"""
        project = self.get_object()
        current_user = request.user
        
        # Yetki kontrolü: Admin veya proje komitesinin lideri/yardımcısı
        can_manage = current_user.is_admin
        if project.committee and not can_manage:
            can_manage = project.committee.is_leader_or_vice(current_user)
        
        if not can_manage:
            return Response(
                {'error': 'Yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id gerekli.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        target_user = get_object_or_404(User, id=user_id)
        
        # Komite kontrolü - Sadece kendi komitesinden üye ekleyebilir
        if project.committee and not current_user.is_admin:
            if not target_user.is_in_committee(project.committee):
                return Response(
                    {'error': f'{target_user.full_name} bu komitenin üyesi değil.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        project.add_team_member(target_user)
        
        return Response({
            'message': f'{target_user.full_name} projeye eklendi.',
            'project': ProjectSerializer(project).data
        })
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Projeden üye çıkar (Admin)"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id gerekli.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = get_object_or_404(User, id=user_id)
        project.remove_team_member(user)
        
        return Response({
            'message': f'{user.full_name} projeden çıkarıldı.',
            'project': ProjectSerializer(project).data
        })
    
    @action(detail=True, methods=['get'])
    def board(self, request, pk=None):
        """Kanban board verisi"""
        project = self.get_object()
        
        board_data = {
            'project': ProjectSerializer(project).data,
            'columns': {
                'YAPILACAK': [],
                'DEVAM_EDIYOR': [],
                'TAMAMLANDI': []
            }
        }
        
        for task in project.tasks.all():
            board_data['columns'][task.status].append(
                ProjectTaskSerializer(task).data
            )
        
        return Response(board_data)
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Proje yorumları"""
        project = self.get_object()
        
        if request.method == 'GET':
            comments = project.comments.all()
            serializer = ProjectCommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        else:  # POST
            serializer = ProjectCommentSerializer(
                data=request.data,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectTaskViewSet(viewsets.ModelViewSet):
    queryset = ProjectTask.objects.all().select_related(
        'project', 'project__owner', 'assigned_to'
    ).prefetch_related('project__team_members')
    serializer_class = ProjectTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Create: Proje sahibi veya admin
        # Update/Patch: Proje üyeleri (self-assign için) veya admin
        # Delete: Sadece admin
        if self.action in ['destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Görev oluşturulurken yetki kontrolü"""
        project = serializer.validated_data.get('project')
        user = self.request.user
        
        # Proje sahibi, takım üyesi veya admin olmalı
        is_owner = project.owner == user
        is_team_member = project.team_members.filter(id=user.id).exists()
        is_admin = user.role in ['BASKAN', 'BASKAN_YARDIMCISI']
        
        if not (is_owner or is_team_member or is_admin):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bu projede görev oluşturma yetkiniz yok.")
        
        serializer.save()
    
    def perform_update(self, serializer):
        """Görev güncellenirken kontroller"""
        task = self.get_object()
        user = self.request.user
        
        # Sadece assigned_to güncellenmesine izin ver (self-assign için)
        if 'assigned_to' in serializer.validated_data:
            new_assignee_id = serializer.validated_data.get('assigned_to')
            
            # Kullanıcı sadece kendine atayabilir ve proje üyesi olmalı
            if new_assignee_id and new_assignee_id.id != user.id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Görevi sadece kendinize atayabilirsiniz.")
            
            if not task.project.team_members.filter(id=user.id).exists() and not user.role in ['BASKAN', 'BASKAN_YARDIMCISI']:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Bu projenin üyesi değilsiniz.")
        
        serializer.save()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Proje bazlı filtreleme
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Durum filtreleme
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Atanan kişi filtreleme
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Görev durumunu değiştir (Kanban drag & drop)"""
        task = self.get_object()
        serializer = TaskStatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        new_order = serializer.validated_data.get('order')
        
        # Görev verisini yenile (assigned_to güncel olmalı)
        task.refresh_from_db()
        
        # Durumu değiştir (bu complete() metodunu çağırabilir)
        task.change_status(new_status)
        
        # Görev verisini tekrar yenile (complete() içinde değişiklikler olabilir)
        task.refresh_from_db()
        
        if new_order is not None:
            task.order = new_order
            task.save()
        
        # Proje verisini yenile (istatistikler güncellenmiş olabilir)
        task.project.refresh_from_db()
        
        return Response({
            'message': 'Görev durumu güncellendi.',
            'task': ProjectTaskSerializer(task).data,
            'project': ProjectSerializer(task.project).data
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
        
        success = task.complete()
        
        if success:
            return Response({
                'message': f'Görev tamamlandı! {task.points} puan kazandınız.',
                'task': ProjectTaskSerializer(task).data,
                'project': ProjectSerializer(task.project).data
            })
        else:
            return Response(
                {'error': 'Görev zaten tamamlanmış.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Kullanıcının proje görevleri"""
        tasks = self.queryset.filter(assigned_to=request.user).order_by('-created_at')
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
