from rest_framework import serializers
from django.utils import timezone
from .models import Task, TaskCompletion, TaskComment
from users.serializers import UserSerializer


class TaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, allow_null=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)
    assigned_users_detail = UserSerializer(source='assigned_users', many=True, read_only=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True, allow_null=True)
    cancelled_by_name = serializers.SerializerMethodField()
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    time_remaining = serializers.CharField(read_only=True)
    
    def get_cancelled_by_name(self, obj):
        """İptal eden kullanıcının adını döndür, null ise None"""
        return obj.cancelled_by.full_name if obj.cancelled_by else None
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # assigned_users field'ını dinamik olarak ekle
        from users.models import User
        self.fields['assigned_users'] = serializers.PrimaryKeyRelatedField(
            many=True,
            queryset=User.objects.all(),
            required=False,
            allow_empty=True,
            write_only=True
        )
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category', 'category_display',
            'difficulty', 'difficulty_display', 'points', 'status', 'status_display',
            'created_by', 'created_by_name', 'assigned_to', 'assigned_to_name',
            'assigned_users', 'assigned_users_detail',
            'committee', 'committee_name',
            'created_at', 'updated_at', 'assigned_at', 'completed_at', 'deadline',
            'tags', 'requirements', 'submission_url', 'is_active',
            'approval_status', 'approved_by', 'approved_at', 'rejection_reason',
            'cancellation_reason', 'cancelled_by', 'cancelled_by_name', 'cancelled_at',
            'is_overdue', 'time_remaining'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'assigned_at', 'completed_at', 'approved_by', 'approved_at']
    
    def create(self, validated_data):
        # assigned_users artık kullanılmıyor - kaldır
        validated_data.pop('assigned_users', None)
        
        validated_data['created_by'] = self.context['request'].user
        task = super().create(validated_data)
        
        # Görev oluşturulurken kimse atanmamış - assigned_to null, status BEKLEMEDE
        # Üyeler claim() action'ı ile görevi üstlenecek
        task.assigned_to = None
        task.assigned_at = None
        task.status = 'BEKLEMEDE'
        task.assigned_users.clear()  # Emin olmak için temizle
        task.save()
        
        return task


class TaskDetailSerializer(TaskSerializer):
    """Yorumları da içeren detaylı serializer"""
    comments = serializers.SerializerMethodField()
    completions = serializers.SerializerMethodField()
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['comments', 'completions']
    
    def get_comments(self, obj):
        comments = obj.comments.all()
        return TaskCommentSerializer(comments, many=True).data
    
    def get_completions(self, obj):
        completions = obj.completions.all()
        return TaskCompletionSerializer(completions, many=True).data


class TaskCompletionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    
    class Meta:
        model = TaskCompletion
        fields = [
            'id', 'task', 'task_title', 'user', 'user_name',
            'points_earned', 'completed_at', 'completion_note',
            'approved_by', 'approved_by_name', 'approved_at'
        ]
        read_only_fields = ['id', 'completed_at', 'approved_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_level = serializers.IntegerField(source='user.level', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = [
            'id', 'task', 'user', 'user_name', 'user_level',
            'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskAssignSerializer(serializers.Serializer):
    """Görev atama için serializer"""
    user_id = serializers.IntegerField(required=False)


class TaskCompleteSerializer(serializers.Serializer):
    """Görev tamamlama için serializer"""
    completion_note = serializers.CharField(required=False, allow_blank=True)
    submission_url = serializers.URLField(required=False, allow_blank=True)


class TaskTransferSerializer(serializers.Serializer):
    """Görev devretme için serializer"""
    user_id = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True, help_text='Devretme sebebi')


class TaskCancelSerializer(serializers.Serializer):
    """Görev iptal etme için serializer"""
    reason = serializers.CharField(required=True, help_text='İptal sebebi')