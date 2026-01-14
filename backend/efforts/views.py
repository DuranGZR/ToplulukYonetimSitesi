from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Sum, Count, Avg
from django.db.models.functions import TruncDate
from .models import Effort, EffortLike, EffortComment
from .serializers import (
    EffortSerializer, EffortDetailSerializer, EffortCreateSerializer,
    EffortUpdateSerializer, EffortLikeSerializer, EffortCommentSerializer
)
from notifications.models import Notification


class EffortViewSet(viewsets.ModelViewSet):
    """Efor yönetimi ViewSet"""
    queryset = Effort.objects.all().select_related(
        'user', 'project', 'task', 'committee'
    ).prefetch_related('likes', 'likes__user', 'comments', 'comments__user')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EffortCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return EffortUpdateSerializer
        elif self.action == 'retrieve':
            return EffortDetailSerializer
        return EffortSerializer
    
    def get_queryset(self):
        """Filtreleme ve sorgulama"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Kullanıcı filtresi
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Tarih filtresi
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        # Bugünkü eforlar
        today_only = self.request.query_params.get('today_only')
        if today_only == 'true':
            queryset = queryset.filter(date=timezone.now().date())
        
        # Komite filtresi
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        # Çalışma türü filtresi
        work_type = self.request.query_params.get('work_type')
        if work_type:
            queryset = queryset.filter(work_type=work_type)
        
        # Proje filtresi
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Görev filtresi
        task_id = self.request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        
        # Arama (kullanıcı adı)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__username__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-date', '-created_at')
    
    def perform_create(self, serializer):
        """Efor oluşturma - sadece bugün için"""
        today = timezone.now().date()
        serializer.save(user=self.request.user, date=today)
    
    def update(self, request, *args, **kwargs):
        """Efor güncelleme - sadece kendi eforunu güncelleyebilir"""
        instance = self.get_object()
        
        if instance.user != request.user:
            return Response(
                {'error': 'Sadece kendi eforlarınızı düzenleyebilirsiniz.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Efor silme - sadece kendi eforunu silebilir"""
        instance = self.get_object()
        
        if instance.user != request.user:
            return Response(
                {'error': 'Sadece kendi eforlarınızı silebilirsiniz.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Puanları geri al (basit bir yaklaşım - daha sonra iyileştirilebilir)
        # if instance.points_earned > 0:
        #     # ActivityLog'da silme kaydı oluşturulabilir
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post', 'delete'])
    def like(self, request, pk=None):
        """Eforu beğen/beğenmekten vazgeç"""
        effort = self.get_object()
        user = request.user
        
        if request.method == 'POST':
            # Beğen
            like, created = EffortLike.objects.get_or_create(
                effort=effort,
                user=user
            )
            
            if created:
                # Bildirim oluştur
                if effort.user != user:  # Kendi eforunu beğenirse bildirim gönderme
                    Notification.objects.create(
                        recipient=effort.user,
                        notification_type='COMMENT',
                        title='Eforunuz Beğenildi',
                        message=f"{user.full_name} eforunuzu beğendi.",
                        link=f'/efforts/{effort.id}',
                        content_type_id=None,
                        object_id=effort.id
                    )
                
                return Response({
                    'message': 'Beğenildi',
                    'liked': True,
                    'likes_count': effort.likes.count()
                })
            else:
                return Response({
                    'message': 'Zaten beğenmişsiniz',
                    'liked': True,
                    'likes_count': effort.likes.count()
                })
        
        elif request.method == 'DELETE':
            # Beğenmekten vazgeç
            EffortLike.objects.filter(effort=effort, user=user).delete()
            
            return Response({
                'message': 'Beğeni kaldırıldı',
                'liked': False,
                'likes_count': effort.likes.count()
            })
    
    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        """Efora yorum yap"""
        effort = self.get_object()
        user = request.user
        comment_text = request.data.get('comment', '').strip()
        
        if not comment_text:
            return Response(
                {'error': 'Yorum boş olamaz.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = EffortComment.objects.create(
            effort=effort,
            user=user,
            comment=comment_text
        )
        
        # Bildirim oluştur
        if effort.user != user:  # Kendi eforuna yorum yaparsa bildirim gönderme
            Notification.objects.create(
                recipient=effort.user,
                notification_type='COMMENT',
                title='Eforunuza Yorum Yapıldı',
                message=f"{user.full_name}: {comment_text[:50]}...",
                link=f'/efforts/{effort.id}',
                content_type_id=None,
                object_id=effort.id
            )
        
        serializer = EffortCommentSerializer(comment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_efforts(self, request):
        """Kullanıcının kendi eforları"""
        user = request.user
        queryset = self.get_queryset().filter(user=user)
        
        # Sayfalama için basit bir yaklaşım
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        efforts = queryset[start:end]
        serializer = self.get_serializer(efforts, many=True, context={'request': request})
        
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Bugünkü eforlar"""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Efor istatistikleri"""
        user_id = request.query_params.get('user')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = self.get_queryset()
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Toplam istatistikler
        total_efforts = queryset.count()
        total_minutes = queryset.aggregate(Sum('duration_minutes'))['duration_minutes__sum'] or 0
        total_points = queryset.aggregate(Sum('points_earned'))['points_earned__sum'] or 0
        
        # Çalışma türüne göre istatistikler
        work_type_stats = queryset.values('work_type').annotate(
            count=Count('id'),
            total_minutes=Sum('duration_minutes'),
            total_points=Sum('points_earned')
        ).order_by('-count')
        
        # Günlük istatistikler
        daily_stats = queryset.annotate(
            date_only=TruncDate('date')
        ).values('date_only').annotate(
            count=Count('id'),
            total_minutes=Sum('duration_minutes'),
            total_points=Sum('points_earned')
        ).order_by('-date_only')[:30]  # Son 30 gün
        
        # Kullanıcı bazlı liderlik tablosu
        # Kullanıcı bazlı liderlik tablosu - Top 20 ile sınırlı (performans için)
        leaderboard_limit = min(int(request.query_params.get('leaderboard_limit', 20)), 50)  # En fazla 50
        leaderboard = queryset.values('user__id', 'user__first_name', 'user__last_name', 'user__username').annotate(
            total_efforts=Count('id'),
            total_minutes=Sum('duration_minutes'),
            total_points=Sum('points_earned'),
            avg_minutes=Avg('duration_minutes')
        ).order_by('-total_points')[:leaderboard_limit]
        
        return Response({
            'total_efforts': total_efforts,
            'total_minutes': total_minutes,
            'total_hours': round(total_minutes / 60, 2),
            'total_points': total_points,
            'work_type_stats': list(work_type_stats),
            'daily_stats': list(daily_stats),
            'leaderboard': list(leaderboard)
        })
