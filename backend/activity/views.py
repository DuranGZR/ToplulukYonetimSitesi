from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from datetime import datetime
from .models import ActivityLog, MonthlyLeaderboard, UserMonthlyStats
from .serializers import (
    ActivityLogSerializer,
    MonthlyLeaderboardSerializer, UserMonthlyStatsSerializer
)
from users.permissions import IsAdminUser


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Aktiflik logları - sadece okuma"""
    queryset = ActivityLog.objects.all().select_related('user').order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        source = self.request.query_params.get('source')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if source:
            queryset = queryset.filter(source=source)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_logs(self, request):
        """Kullanıcının kendi logları"""
        logs = self.queryset.filter(user=request.user)
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Lider tablosu - bu ay en yüksek puanlı kullanıcılar"""
        from users.models import User
        from users.serializers import UserSerializer
        from django.db.models import Sum
        from datetime import datetime, timedelta
        
        # Son 30 günün puanlarını hesapla
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        users_with_points = []
        for user in User.objects.filter(is_active=True):
            monthly_points = ActivityLog.objects.filter(
                user=user,
                created_at__gte=thirty_days_ago
            ).aggregate(total=Sum('points'))['total'] or 0
            
            if monthly_points > 0:  # Sadece puanı olanları ekle
                users_with_points.append({
                    'user': user,
                    'monthly_points': monthly_points
                })
        
        # Puana göre sırala
        users_with_points.sort(key=lambda x: x['monthly_points'], reverse=True)
        
        # Top 20 + monthly_points ekle
        top_users_data = []
        for item in users_with_points[:20]:
            user_data = UserSerializer(item['user']).data
            user_data['monthly_points'] = item['monthly_points']
            top_users_data.append(user_data)
        
        return Response(top_users_data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_manual_points(request):
    """Admin tarafından manuel puan ekleme"""
    from users.models import User
    
    user_id = request.data.get('user_id')
    points = request.data.get('points')
    description = request.data.get('description', 'Manuel puan ekleme')
    
    if not user_id or points is None:
        return Response(
            {'error': 'user_id ve points gerekli.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
        
        # Sadece activity log oluştur
        ActivityLog.objects.create(
            user=user,
            points=int(points),
            source='MANUAL',
            description=description
        )
        
        message = f"{user.username} kullanıcısına {points} puan eklendi."
        return Response({'message': message})
    except User.DoesNotExist:
        return Response({'error': 'Kullanıcı bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_stats(request):
    """Kullanıcının istatistikleri"""
    user = request.user
    
    # Son 30 günlük puan geçmişi
    from django.utils import timezone
    from datetime import timedelta
    
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_logs = ActivityLog.objects.filter(
        user=user,
        created_at__gte=thirty_days_ago
    )
    
    # Kaynaklara göre toplam puanlar
    points_by_source = recent_logs.values('source').annotate(
        total=Sum('points')
    )
    
    return Response({
        'star_count': user.star_count,
        'recent_activities': ActivityLogSerializer(recent_logs[:10], many=True).data,
        'points_by_source': list(points_by_source),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_month_leaderboard(request):
    """Bu ayın lider tablosu (canlı - son 30 gün)"""
    from users.models import User
    from users.serializers import UserSerializer
    from django.utils import timezone
    from datetime import timedelta
    
    # Son 30 günlük puanları hesapla
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    users_with_points = []
    for user in User.objects.filter(is_active=True):
        monthly_points = ActivityLog.objects.filter(
            user=user,
            created_at__gte=thirty_days_ago
        ).aggregate(total=Sum('points'))['total'] or 0
        
        if monthly_points > 0:  # Sadece puanı olanları ekle
            users_with_points.append({
                'user': user,
                'monthly_points': monthly_points
            })
    
    # Puana göre sırala
    users_with_points.sort(key=lambda x: x['monthly_points'], reverse=True)
    
    # En yüksek puana sahip kullanıcıları bul (yıldız adayları)
    current_stars = []
    if users_with_points:
        max_points = users_with_points[0]['monthly_points']
        current_stars = [item['user'] for item in users_with_points if item['monthly_points'] == max_points]
    
    # Top 50 kullanıcı
    top_users_data = []
    for item in users_with_points[:50]:
        user_data = UserSerializer(item['user']).data
        user_data['monthly_points'] = item['monthly_points']
        top_users_data.append(user_data)
    
    now = timezone.now()
    
    return Response({
        'year': now.year,
        'month': now.month,
        'leaderboard': top_users_data,
        'current_stars': UserSerializer(current_stars, many=True).data,
        'winning_points': users_with_points[0]['monthly_points'] if users_with_points else 0
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def past_months_leaderboard(request):
    """Geçmiş ayların lider tabloları"""
    past_boards = MonthlyLeaderboard.objects.filter(is_finalized=True).order_by('-year', '-month')[:12]
    serializer = MonthlyLeaderboardSerializer(past_boards, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_monthly_history(request, user_id=None):
    """Kullanıcının aylık geçmişi"""
    if user_id is None:
        user_id = request.user.id
    
    stats = UserMonthlyStats.objects.filter(user_id=user_id).order_by('-year', '-month')[:12]
    serializer = UserMonthlyStatsSerializer(stats, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def month_detail(request, year, month):
    """Belirli bir ayın detayları"""
    try:
        board = MonthlyLeaderboard.objects.get(year=year, month=month)
        serializer = MonthlyLeaderboardSerializer(board)
        return Response(serializer.data)
    except MonthlyLeaderboard.DoesNotExist:
        return Response(
            {'error': 'Bu ay için kayıt bulunamadı.'},
            status=status.HTTP_404_NOT_FOUND
        )
