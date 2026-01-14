from rest_framework import permissions
from .models import Meeting


class CanCreateMeeting(permissions.BasePermission):
    """
    Toplantı oluşturma yetkisi:
    - Genel toplantı: Sadece admin (başkan/başkan yardımcısı)
    - Komite toplantısı: Admin veya komite lideri/yardımcısı
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin her zaman oluşturabilir
        if request.user.is_admin:
            return True
        
        # Komite lideri veya yardımcısı komite toplantısı oluşturabilir
        if request.user.role in ['KOMITE_LIDERI', 'KOMITE_YARDIMCISI']:
            return True
        
        return False


class CanEditMeetingNotes(permissions.BasePermission):
    """
    Toplantı notlarını düzenleme yetkisi: Sadece admin
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return obj.can_user_edit_notes(request.user)


class CanViewMeeting(permissions.BasePermission):
    """
    Toplantı görüntüleme yetkisi:
    - Genel toplantı: Herkes
    - Komite toplantısı: Komite üyeleri veya admin
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return obj.can_user_view(request.user)

