from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Skill, SocialLink


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'proficiency', 'is_learning', 'created_at']
        read_only_fields = ['id', 'created_at']


class SocialLinkSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = SocialLink
        fields = ['id', 'platform', 'platform_display', 'title', 'url', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    social_links = SocialLinkSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'department', 'grade', 'phone', 'bio', 'profile_image',
            'star_count', 'skills', 'social_links', 'is_admin',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'star_count', 'created_at', 'updated_at']
    
    def get_profile_image(self, obj):
        if obj.profile_image:
            return obj.profile_image.url
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'department', 'grade', 'phone'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'department', 'grade',
            'phone', 'bio', 'profile_image'
        ]
        # Role dahil edilmediği için güncelleme sırasında korunur
        # Eğer role güncellenmeye çalışılırsa görmezden gelinir


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Kullanıcı adı veya şifre hatalı.')
            if not user.is_active:
                raise serializers.ValidationError('Bu hesap devre dışı bırakılmış.')
            data['user'] = user
        else:
            raise serializers.ValidationError('Kullanıcı adı ve şifre gerekli.')
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mevcut şifre hatalı.')
        return value
