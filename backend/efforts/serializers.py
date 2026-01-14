from rest_framework import serializers
from .models import Effort, EffortLike, EffortComment
from users.serializers import UserSerializer


class EffortCommentSerializer(serializers.ModelSerializer):
    """Efor yorumu serializer"""
    user = UserSerializer(read_only=True)
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EffortComment
        fields = ['id', 'user', 'user_full_name', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_user_full_name(self, obj):
        return obj.user.full_name


class EffortLikeSerializer(serializers.ModelSerializer):
    """Efor beğenisi serializer"""
    user = UserSerializer(read_only=True)
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EffortLike
        fields = ['id', 'user', 'user_full_name', 'created_at']
        read_only_fields = ['user', 'created_at']
    
    def get_user_full_name(self, obj):
        return obj.user.full_name


class EffortSerializer(serializers.ModelSerializer):
    """Temel efor serializer"""
    user = UserSerializer(read_only=True)
    user_full_name = serializers.SerializerMethodField()
    project_title = serializers.SerializerMethodField()
    task_title = serializers.SerializerMethodField()
    committee_name = serializers.SerializerMethodField()
    work_type_display = serializers.CharField(source='get_work_type_display', read_only=True)
    duration_display = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Effort
        fields = [
            'id', 'user', 'user_full_name', 'work_type', 'work_type_display',
            'project', 'project_title', 'task', 'task_title',
            'duration_minutes', 'duration_hours', 'duration_display',
            'description', 'date', 'points_earned', 'committee', 'committee_name',
            'likes_count', 'comments_count', 'is_liked', 'can_edit',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'points_earned', 'committee', 'created_at', 'updated_at']
    
    def get_user_full_name(self, obj):
        return obj.user.full_name
    
    def get_project_title(self, obj):
        return obj.project.title if obj.project else None
    
    def get_task_title(self, obj):
        return obj.task.title if obj.task else None
    
    def get_committee_name(self, obj):
        return obj.committee.name if obj.committee else None
    
    def get_duration_display(self, obj):
        return obj.duration_display
    
    def get_duration_hours(self, obj):
        return obj.duration_hours
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return EffortLike.objects.filter(effort=obj, user=request.user).exists()
        return False
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user
        return False


class EffortDetailSerializer(EffortSerializer):
    """Detaylı efor serializer (yorumlar ve beğeniler dahil)"""
    likes = EffortLikeSerializer(many=True, read_only=True)
    comments = EffortCommentSerializer(many=True, read_only=True)
    
    class Meta(EffortSerializer.Meta):
        fields = EffortSerializer.Meta.fields + ['likes', 'comments']


class EffortCreateSerializer(serializers.ModelSerializer):
    """Efor oluşturma serializer"""
    
    class Meta:
        model = Effort
        fields = [
            'work_type', 'project', 'task', 'duration_minutes', 'description', 'date'
        ]
    
    def validate_date(self, value):
        """Sadece bugün kayıt edilebilir"""
        from django.utils import timezone
        today = timezone.now().date()
        if value != today:
            raise serializers.ValidationError("Sadece bugünün tarihini seçebilirsiniz.")
        return value
    
    def validate(self, data):
        """Validasyonlar"""
        work_type = data.get('work_type')
        project = data.get('project')
        task = data.get('task')
        
        # Eğer çalışma türü PROJE ise proje seçilmeli
        if work_type == 'PROJE' and not project:
            raise serializers.ValidationError({
                'project': 'Proje çalışması için proje seçimi zorunludur.'
            })
        
        # Eğer çalışma türü GOREV ise görev seçilmeli
        if work_type == 'GOREV' and not task:
            raise serializers.ValidationError({
                'task': 'Görev çalışması için görev seçimi zorunludur.'
            })
        
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        effort = super().create(validated_data)
        
        # Puan ekleme
        if effort.points_earned > 0:
            level_change = user.add_points(
                points=effort.points_earned,
                source='EFFORT',
                source_id=effort.id,
                description=f"{effort.get_work_type_display()} çalışması ({effort.duration_display})"
            )
        
        return effort


class EffortUpdateSerializer(serializers.ModelSerializer):
    """Efor güncelleme serializer"""
    
    class Meta:
        model = Effort
        fields = [
            'work_type', 'project', 'task', 'duration_minutes', 'description'
        ]
    
    def validate(self, data):
        """Validasyonlar"""
        work_type = data.get('work_type', self.instance.work_type if self.instance else None)
        project = data.get('project', self.instance.project if self.instance else None)
        task = data.get('task', self.instance.task if self.instance else None)
        
        # Eğer çalışma türü PROJE ise proje seçilmeli
        if work_type == 'PROJE' and not project:
            raise serializers.ValidationError({
                'project': 'Proje çalışması için proje seçimi zorunludur.'
            })
        
        # Eğer çalışma türü GOREV ise görev seçilmeli
        if work_type == 'GOREV' and not task:
            raise serializers.ValidationError({
                'task': 'Görev çalışması için görev seçimi zorunludur.'
            })
        
        return data
    
    def update(self, instance, validated_data):
        old_points = instance.points_earned
        effort = super().update(instance, validated_data)
        
        # Eğer puan değiştiyse güncelle
        if effort.points_earned != old_points:
            points_diff = effort.points_earned - old_points
            if points_diff != 0:
                # Puan farkını ekle/çıkar
                # Not: ActivityLog'da manuel düzenleme olarak işaretlenmeli
                effort.user.add_points(
                    points=points_diff,
                    source='EFFORT_UPDATE',
                    source_id=effort.id,
                    description=f"Efor güncellendi: {effort.duration_display}"
                )
        
        return effort

