from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Başkan veya Başkan Yardımcısı kontrolü
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsModeratorUser(permissions.BasePermission):
    """
    Birim Başkanı veya üstü kontrolü
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_moderator


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Kendi kaydı veya admin kontrolü
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return obj == request.user


class IsCommitteeLeaderOrAdmin(permissions.BasePermission):
    """
    Komite lideri, yardımcısı veya admin kontrolü
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin her zaman erişebilir
        if request.user.is_admin:
            return True
        
        # Komite lideri veya yardımcısı mı?
        return request.user.role in ['KOMITE_LIDERI', 'KOMITE_YARDIMCISI']
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin her zaman erişebilir
        if request.user.is_admin:
            return True
        
        # Objenin committee'si varsa, kullanıcı o komitenin lideri/yardımcısı mı?
        if hasattr(obj, 'committee') and obj.committee:
            return obj.committee.is_leader_or_vice(request.user)
        
        # Obje kullanıcının kendisiyse (created_by veya owner)
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return False


class CanAccessCommitteeContent(permissions.BasePermission):
    """
    Komite içeriğine erişim kontrolü - Sadece o komitenin üyeleri
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin her zaman erişebilir
        if request.user.is_admin:
            return True
        
        # Objenin committee'si yoksa herkes erişebilir
        if not hasattr(obj, 'committee') or not obj.committee:
            return True
        
        # Kullanıcı bu komitenin üyesi mi?
        committee = obj.committee
        return (
            request.user in committee.members.all() or
            request.user == committee.leader or
            request.user == committee.vice_leader
        )
