from rest_framework import serializers
from .models import Committee


class CommitteeSerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source='leader.get_full_name', read_only=True)
    vice_leader_name = serializers.CharField(source='vice_leader.get_full_name', read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Committee
        fields = ['id', 'name', 'description', 'leader', 'leader_name', 
                  'vice_leader', 'vice_leader_name', 'members', 'member_count',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()


class CommitteeDetailSerializer(serializers.ModelSerializer):
    """Detaylı komite bilgisi - üyelerle birlikte"""
    from users.serializers import UserSerializer
    
    leader_detail = UserSerializer(source='leader', read_only=True)
    vice_leader_detail = UserSerializer(source='vice_leader', read_only=True)
    members_detail = UserSerializer(source='members', many=True, read_only=True)
    # members alanını açıkça ID listesi olarak dahil et
    members = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Committee
        fields = ['id', 'name', 'description', 
                  'leader', 'leader_detail',
                  'vice_leader', 'vice_leader_detail',
                  'members', 'members_detail',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
