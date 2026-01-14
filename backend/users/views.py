from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import logout
from .models import User, Skill, SocialLink
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    LoginSerializer, ChangePasswordSerializer, SkillSerializer, SocialLinkSerializer
)
from .permissions import IsAdminUser, IsOwnerOrAdmin


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().prefetch_related('skills', 'committees')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAdminUser()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]
    
    def update(self, request, *args, **kwargs):
        """Kullanıcı güncelleme - role ve kritik alanları koru"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Sadece admin role değiştirebilir
        if 'role' in request.data and not request.user.is_admin:
            request.data.pop('role')
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(UserSerializer(instance).data)
    
    def partial_update(self, request, *args, **kwargs):
        """Kısmi güncelleme"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Kullanıcı silme - admin kendini silemez"""
        instance = self.get_object()
        
        # Admin kendini silemez
        if request.user.id == instance.id and request.user.is_admin:
            return Response(
                {'error': 'Adminler kendi hesaplarını silemez.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Mevcut kullanıcının bilgilerini döndür"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Kullanıcı arama - tüm kullanıcıları veya filtreli sonuçları döndür"""
        query = request.query_params.get('q', '').strip()
        
        # Kendi kullanıcıyı hariç tut
        users = User.objects.exclude(id=request.user.id)
        
        # Arama sorgusu varsa filtrele
        if query:
            from django.db.models import Q
            users = users.filter(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query)
            )
        
        # En fazla 50 kullanıcı döndür
        users = users[:50]
        
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Kullanıcı şifre değiştirme"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Şifre başarıyla değiştirildi.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Kullanıcı profil detayı"""
        user = self.get_object()
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_skill(self, request, pk=None):
        """Kullanıcıya yetenek ekle"""
        user = self.get_object()
        
        # Sadece kendi profiline veya admin ekleyebilir
        if request.user != user and not request.user.is_admin:
            return Response(
                {'error': 'Bu işlem için yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SkillSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'], url_path='update_skill/(?P<skill_id>[^/.]+)')
    def update_skill(self, request, pk=None, skill_id=None):
        """Kullanıcının yeteneğini güncelle"""
        user = self.get_object()
        
        # Sadece kendi profiline veya admin güncelleyebilir
        if request.user != user and not request.user.is_admin:
            return Response(
                {'error': 'Bu işlem için yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from .models import Skill
            skill = Skill.objects.get(id=skill_id, user=user)
            serializer = SkillSerializer(skill, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Skill.DoesNotExist:
            return Response(
                {'error': 'Yetenek bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['delete'], url_path='delete_skill/(?P<skill_id>[^/.]+)')
    def delete_skill(self, request, pk=None, skill_id=None):
        """Kullanıcıdan yetenek sil"""
        user = self.get_object()
        
        # Sadece kendi profiline veya admin silebilir
        if request.user != user and not request.user.is_admin:
            return Response(
                {'error': 'Bu işlem için yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from .models import Skill
            skill = Skill.objects.get(id=skill_id, user=user)
            skill.delete()
            return Response({'message': 'Yetenek silindi.'}, status=status.HTTP_200_OK)
        except Skill.DoesNotExist:
            return Response(
                {'error': 'Yetenek bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def upload_avatar(self, request):
        """Kullanıcı profil fotoğrafı yükleme"""
        user = request.user
        
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Fotoğraf dosyası gerekli.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Eski fotoğrafı sil
        if user.profile_image:
            user.profile_image.delete(save=False)
        
        user.profile_image = request.FILES['avatar']
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def delete_avatar(self, request):
        """Kullanıcı profil fotoğrafını sil"""
        user = request.user
        
        if user.profile_image:
            user.profile_image.delete(save=True)
            return Response({'message': 'Profil fotoğrafı silindi.'})
        
        return Response(
            {'error': 'Profil fotoğrafı bulunamadı.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=True, methods=['post'])
    def add_social_link(self, request, pk=None):
        """Kullanıcıya sosyal link ekle"""
        user = self.get_object()
        
        # Sadece kendi profiline veya admin ekleyebilir
        if request.user != user and not request.user.is_admin:
            return Response(
                {'error': 'Bu işlem için yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SocialLinkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'], url_path='update_social_link/(?P<link_id>[^/.]+)')
    def update_social_link(self, request, pk=None, link_id=None):
        """Kullanıcının sosyal linkini güncelle"""
        user = self.get_object()
        
        # Sadece kendi profiline veya admin güncelleyebilir
        if request.user != user and not request.user.is_admin:
            return Response(
                {'error': 'Bu işlem için yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            link = SocialLink.objects.get(id=link_id, user=user)
            serializer = SocialLinkSerializer(link, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except SocialLink.DoesNotExist:
            return Response(
                {'error': 'Link bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['delete'], url_path='delete_social_link/(?P<link_id>[^/.]+)')
    def delete_social_link(self, request, pk=None, link_id=None):
        """Kullanıcıdan sosyal link sil"""
        user = self.get_object()
        
        # Sadece kendi profiline veya admin silebilir
        if request.user != user and not request.user.is_admin:
            return Response(
                {'error': 'Bu işlem için yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            link = SocialLink.objects.get(id=link_id, user=user)
            link.delete()
            return Response({'message': 'Link silindi.'}, status=status.HTTP_200_OK)
        except SocialLink.DoesNotExist:
            return Response(
                {'error': 'Link bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Kullanıcı giriş endpoint'i"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Kullanıcı çıkış endpoint'i"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        logout(request)
        return Response({'message': 'Başarıyla çıkış yapıldı.'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_token_view(request):
    """Token yenileme endpoint'i"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token gerekli.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = RefreshToken(refresh_token)
        return Response({
            'access': str(token.access_token)
        })
    except Exception as e:
        return Response({'error': 'Geçersiz token.'}, status=status.HTTP_401_UNAUTHORIZED)
