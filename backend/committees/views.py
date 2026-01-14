from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Committee
from .serializers import CommitteeSerializer, CommitteeDetailSerializer
from users.permissions import IsAdminUser


class CommitteeViewSet(viewsets.ModelViewSet):
    """Komite CRUD ve üye yönetimi"""
    queryset = Committee.objects.all().select_related(
        'leader', 'vice_leader'
    ).prefetch_related('members')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'list']:
            return CommitteeDetailSerializer
        return CommitteeSerializer
    
    def get_permissions(self):
        """Liste ve detay için giriş yeterli, diğerleri admin gerektirir"""
        if self.action in ['list', 'retrieve', 'my_committees', 'members']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['get'])
    def my_committees(self, request):
        """Kullanıcının üye olduğu komiteler"""
        committees = request.user.committees.all()
        serializer = self.get_serializer(committees, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def members(self, request, pk=None):
        """Komite üyelerinin listesi (Lider, yardımcı ve üyeler dahil)"""
        committee = self.get_object()
        from users.serializers import UserSerializer
        
        # Tüm üyeleri al (lider, yardımcı ve normal üyeler)
        all_members = committee.get_all_members()
        serializer = UserSerializer(all_members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Komiteye üye ekle"""
        committee = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id gerekli'}, status=status.HTTP_400_BAD_REQUEST)
        
        from users.models import User
        try:
            user = User.objects.get(id=user_id)
            committee.members.add(user)
            return Response({'message': f'{user.get_full_name()} komiteye eklendi'})
        except User.DoesNotExist:
            return Response({'error': 'Kullanıcı bulunamadı'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Komiteden üye çıkar"""
        committee = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id gerekli'}, status=status.HTTP_400_BAD_REQUEST)
        
        from users.models import User
        try:
            user = User.objects.get(id=user_id)
            committee.members.remove(user)
            return Response({'message': f'{user.get_full_name()} komiteden çıkarıldı'})
        except User.DoesNotExist:
            return Response({'error': 'Kullanıcı bulunamadı'}, status=status.HTTP_404_NOT_FOUND)
