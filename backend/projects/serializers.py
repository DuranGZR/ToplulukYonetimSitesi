from rest_framework import serializers
from .models import Project, ProjectTask, ProjectComment
from users.serializers import UserSerializer


class ProjectTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    deadline = serializers.DateField(required=False, allow_null=True)
    
    class Meta:
        model = ProjectTask
        fields = [
            'id', 'project', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'assigned_to', 'assigned_to_name',
            'points', 'created_at', 'updated_at', 'completed_at', 'deadline',
            'order', 'is_overdue'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']
    
    def validate_deadline(self, value):
        """Boş string'i null'a çevir"""
        if value == '':
            return None
        return value


class ProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    completed_task_count = serializers.IntegerField(read_only=True)
    team_member_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'owner', 'owner_name',
            'committee', 'committee_name',
            'team_members', 'team_member_names', 'start_date', 'end_date', 'deadline',
            'created_at', 'updated_at', 'total_points', 'completion_percentage',
            'tags', 'repository_url', 'documentation_url', 'is_active',
            'approval_status', 'approved_by', 'approved_at', 'rejection_reason',
            'is_overdue', 'task_count', 'completed_task_count'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at', 'total_points', 'completion_percentage', 'approved_by', 'approved_at']
    
    def get_team_member_names(self, obj):
        return [member.full_name for member in obj.team_members.all()]
    
    def create(self, validated_data):
        team_members = validated_data.pop('team_members', [])
        validated_data['owner'] = self.context['request'].user
        project = Project.objects.create(**validated_data)
        project.team_members.set(team_members)
        
        # Takım üyelerine bildirim gönder
        from notifications.models import Notification
        for member in team_members:
            Notification.objects.create(
                recipient=member,
                notification_type='PROJECT_ASSIGNED',
                title='Yeni Projeye Atandınız',
                message=f'{validated_data["owner"].full_name} sizi "{project.title}" projesine ekledi.',
                link=f'/projects/{project.id}'
            )
        
        return project


class ProjectDetailSerializer(ProjectSerializer):
    """Görevleri ve yorumları da içeren detaylı serializer"""
    tasks = ProjectTaskSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['tasks', 'comments']
    
    def get_comments(self, obj):
        comments = obj.comments.all()[:10]  # Son 10 yorum
        return ProjectCommentSerializer(comments, many=True).data


class ProjectCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_level = serializers.IntegerField(source='user.level', read_only=True)
    
    class Meta:
        model = ProjectComment
        fields = [
            'id', 'project', 'user', 'user_name', 'user_level',
            'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskStatusChangeSerializer(serializers.Serializer):
    """Görev durumu değiştirme için serializer"""
    status = serializers.ChoiceField(choices=ProjectTask.STATUS_CHOICES)
    order = serializers.IntegerField(required=False)
