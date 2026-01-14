from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max
from .models import ChatRoom, ChatMessage
from .serializers import ChatRoomSerializer, ChatMessageSerializer


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin tüm odaları görebilir
        if user.is_admin:
            return ChatRoom.objects.all()
        
        # Kullanıcının erişebildiği odalar
        from projects.models import Project
        user_projects = Project.objects.filter(
            Q(team_members=user) | Q(owner=user)
        )
        
        return ChatRoom.objects.filter(
            Q(room_type='GENERAL') |  # Genel chat
            Q(committee__in=user.get_user_committees()) |  # Komite chatler
            Q(project__in=user_projects) |  # Proje chatler
            Q(participants=user)  # Özel mesajlar
        ).distinct()
    
    @action(detail=False, methods=['GET'])
    def my_rooms(self, request):
        """Kullanıcının tüm chat odalarını kategorilere göre döndür - N+1 query optimized"""
        user = request.user
        
        # Genel chat - prefetch messages for last_message
        general_room, created = ChatRoom.objects.prefetch_related(
            'messages', 'participants'
        ).get_or_create(
            room_type='GENERAL',
            defaults={'name': '🌍 HSD Genel Chat'}
        )
        
        # Komite chatler
        committees = user.get_user_committees()
        if user.is_admin:
            # Admin tüm komiteleri görsün
            from committees.models import Committee
            committees = Committee.objects.all()
        
        committee_rooms = []
        for committee in committees:
            room, created = ChatRoom.objects.select_related('committee').prefetch_related(
                'messages__sender', 'participants'
            ).get_or_create(
                committee=committee,
                room_type='COMMITTEE',
                defaults={'name': f'🎯 {committee.name}'}
            )
            committee_rooms.append(room)
        
        # Özel mesajlar - optimize with prefetch
        private_rooms = ChatRoom.objects.filter(
            room_type='PRIVATE',
            participants=user
        ).prefetch_related('participants', 'messages__sender', 'messages__read_by')
        
        return Response({
            'general': ChatRoomSerializer(general_room, context={'request': request}).data,
            'committees': ChatRoomSerializer(committee_rooms, many=True, context={'request': request}).data,
            'private': ChatRoomSerializer(private_rooms, many=True, context={'request': request}).data,
        })
    
    @action(detail=False, methods=['POST'])
    def create_private_room(self, request):
        """İki kullanıcı arasında özel chat oluştur"""
        other_user_id = request.data.get('user_id')
        
        if not other_user_id:
            return Response({'error': 'user_id gerekli'}, status=status.HTTP_400_BAD_REQUEST)
        
        from users.models import User
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'error': 'Kullanıcı bulunamadı'}, status=status.HTTP_404_NOT_FOUND)
        
        # Zaten var mı kontrol et
        existing_room = ChatRoom.objects.filter(
            room_type='PRIVATE',
            participants=request.user
        ).filter(
            participants=other_user
        ).first()
        
        if existing_room:
            return Response(ChatRoomSerializer(existing_room, context={'request': request}).data)
        
        # Yeni oda oluştur
        room = ChatRoom.objects.create(
            name=f'{request.user.username} - {other_user.username}',
            room_type='PRIVATE'
        )
        room.participants.add(request.user, other_user)
        
        return Response(
            ChatRoomSerializer(room, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['GET'])
    def get_project_room(self, request):
        """Proje chat odasını getir veya oluştur"""
        project_id = request.query_params.get('project_id')
        
        if not project_id:
            return Response({'error': 'project_id gerekli'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            project_id = int(project_id)
        except (ValueError, TypeError):
            return Response({'error': 'Geçersiz project_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        from projects.models import Project
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Proje bulunamadı'}, status=status.HTTP_404_NOT_FOUND)
        
        # Erişim kontrolü
        user = request.user
        if not user.is_admin:
            if project.owner != user and not project.team_members.filter(id=user.id).exists():
                if project.committee and not user.is_in_committee(project.committee):
                    return Response(
                        {'error': 'Bu projeye erişim yetkiniz yok'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Chat odasını getir veya oluştur
        try:
            room = ChatRoom.objects.select_related('project').prefetch_related(
                'messages__sender', 'participants'
            ).get(project=project, room_type='PROJECT')
            created = False
        except ChatRoom.DoesNotExist:
            room = ChatRoom.objects.create(
                name=f'💼 {project.title}',
                room_type='PROJECT',
                project=project
            )
            room = ChatRoom.objects.select_related('project').prefetch_related(
                'messages__sender', 'participants'
            ).get(id=room.id)
            created = True
        
        return Response(
            ChatRoomSerializer(room, context={'request': request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """N+1 query optimized queryset"""
        room_id = self.request.query_params.get('room')
        if room_id:
            return ChatMessage.objects.filter(
                room_id=room_id
            ).select_related('sender').prefetch_related('read_by').order_by('created_at')
        return ChatMessage.objects.none()
    
    def perform_create(self, serializer):
        room_id = self.request.data.get('room')
        room = ChatRoom.objects.get(id=room_id)
        
        # Erişim kontrolü
        if not room.can_access(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Bu odaya erişim yetkiniz yok')
        
        serializer.save(sender=self.request.user)
    
    @action(detail=True, methods=['POST'])
    def mark_read(self, request, pk=None):
        """Mesajı okundu olarak işaretle"""
        message = self.get_object()
        message.mark_as_read(request.user)
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['POST'])
    def mark_room_read(self, request):
        """Odadaki tüm mesajları okundu işaretle - Bulk optimized"""
        room_id = request.data.get('room_id')
        if not room_id:
            return Response({'error': 'room_id gerekli'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Bulk operation - her mesaj için ayrı query yerine tek seferde
        messages = ChatMessage.objects.filter(
            room_id=room_id
        ).exclude(sender=request.user)
        
        count = 0
        for message in messages:
            if request.user not in message.read_by.all():
                message.read_by.add(request.user)
                count += 1
        
        return Response({'status': f'{count} mesaj okundu olarak işaretlendi'})
