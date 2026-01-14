"""
Django function handlers - Gemini Live API için
Bu fonksiyonlar Gemini'nin function calling özelliği ile çağrılacak
"""

from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from events.models import Event
from tasks.models import Task
from projects.models import Project
from committees.models import Committee
from users.models import User
from activity.models import ActivityLog, LevelThreshold


def get_events(query: str, user=None) -> dict:
    """
    Etkinlikleri sorgula
    
    Args:
        query: Kullanıcı sorgusu (örn: "ilk etkinlik", "yaklaşan etkinlikler")
        user: Kullanıcı objesi (opsiyonel, filtreleme için)
        
    Returns:
        dict: Etkinlik bilgileri
    """
    now = timezone.now()
    
    # Sadece onaylanmış ve aktif etkinlikler
    events = Event.objects.filter(
        is_active=True,
        approval_status='APPROVED'
    )
    
    query_lower = query.lower()
    
    # "İlk etkinlik" veya "en erken etkinlik"
    if 'ilk' in query_lower or 'en erken' in query_lower or 'birinci' in query_lower:
        event = events.filter(date_time__gte=now).order_by('date_time').first()
        if event:
            return {
                'success': True,
                'data': {
                    'title': event.title,
                    'date_time': event.date_time.strftime('%d %B %Y, %H:%M'),
                    'location': event.location,
                    'description': event.description[:200] + '...' if len(event.description) > 200 else event.description,
                    'event_type': event.get_event_type_display(),
                    'points': event.attendance_points
                },
                'message': f"İlk etkinlik: {event.title}, {event.date_time.strftime('%d %B %Y saat %H:%M')} tarihinde {event.location} konumunda gerçekleşecek."
            }
        else:
            return {
                'success': False,
                'message': 'Yaklaşan etkinlik bulunamadı.'
            }
    
    # "Yaklaşan etkinlikler"
    if 'yaklaşan' in query_lower or 'gelecek' in query_lower:
        upcoming = events.filter(date_time__gte=now).order_by('date_time')[:5]
        if upcoming.exists():
            event_list = []
            for event in upcoming:
                event_list.append({
                    'title': event.title,
                    'date_time': event.date_time.strftime('%d %B %Y, %H:%M'),
                    'location': event.location
                })
            
            message = "Yaklaşan etkinlikler: "
            for i, event in enumerate(upcoming, 1):
                message += f"{i}. {event.title}, {event.date_time.strftime('%d %B %Y saat %H:%M')} tarihinde {event.location} konumunda. "
            
            return {
                'success': True,
                'data': event_list,
                'message': message
            }
        else:
            return {
                'success': False,
                'message': 'Yaklaşan etkinlik bulunamadı.'
            }
    
    # "Bugün etkinlik var mı?"
    if 'bugün' in query_lower:
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        today_events = events.filter(date_time__gte=today_start, date_time__lt=today_end)
        
        if today_events.exists():
            event = today_events.first()
            return {
                'success': True,
                'data': {
                    'title': event.title,
                    'date_time': event.date_time.strftime('%H:%M'),
                    'location': event.location
                },
                'message': f"Evet, bugün {event.title} etkinliği var. Saat {event.date_time.strftime('%H:%M')} tarihinde {event.location} konumunda."
            }
        else:
            return {
                'success': False,
                'message': 'Bugün etkinlik bulunmuyor.'
            }
    
    # Genel sorgu - son 5 etkinlik
    recent_events = events.order_by('-date_time')[:5]
    if recent_events.exists():
        event_list = []
        for event in recent_events:
            event_list.append({
                'title': event.title,
                'date_time': event.date_time.strftime('%d %B %Y, %H:%M'),
                'location': event.location,
                'is_past': event.is_past
            })
        
        return {
            'success': True,
            'data': event_list,
            'message': f"Son etkinlikler: {', '.join([e.title for e in recent_events[:3]])}"
        }
    
    return {
        'success': False,
        'message': 'Etkinlik bulunamadı.'
    }


def get_tasks(query: str, user=None) -> dict:
    """
    Görevleri sorgula
    
    Args:
        query: Kullanıcı sorgusu
        user: Kullanıcı objesi (opsiyonel)
        
    Returns:
        dict: Görev bilgileri
    """
    query_lower = query.lower()
    
    # "Benim görevlerim" veya "görevlerim"
    if user and ('benim' in query_lower or 'görevlerim' in query_lower):
        tasks = Task.objects.filter(
            assigned_to=user,
            is_active=True,
            approval_status='APPROVED',
            status__in=['BEKLEMEDE', 'DEVAM_EDIYOR']
        ).order_by('-created_at')[:10]
        
        if tasks.exists():
            task_list = []
            for task in tasks:
                task_list.append({
                    'title': task.title,
                    'status': task.get_status_display(),
                    'points': task.points,
                    'deadline': task.deadline.strftime('%d %B %Y') if task.deadline else None
                })
            
            message = f"Sizin {tasks.count()} göreviniz var: "
            for task in tasks[:3]:
                message += f"{task.title} ({task.get_status_display()}), "
            
            return {
                'success': True,
                'data': task_list,
                'message': message
            }
        else:
            return {
                'success': False,
                'message': 'Size atanmış görev bulunmuyor.'
            }
    
    # "Bekleyen görevler"
    if 'bekleyen' in query_lower or 'yapılacak' in query_lower:
        tasks = Task.objects.filter(
            status='BEKLEMEDE',
            is_active=True,
            approval_status='APPROVED',
            assigned_to__isnull=True
        ).order_by('-points')[:10]
        
        if tasks.exists():
            message = f"{tasks.count()} bekleyen görev var: "
            for task in tasks[:3]:
                message += f"{task.title} ({task.points} puan), "
            
            return {
                'success': True,
                'data': [{'title': t.title, 'points': t.points} for t in tasks],
                'message': message
            }
    
    return {
        'success': False,
        'message': 'Görev bulunamadı.'
    }


def get_projects(query: str, user=None) -> dict:
    """
    Projeleri sorgula
    
    Args:
        query: Kullanıcı sorgusu
        user: Kullanıcı objesi (opsiyonel)
        
    Returns:
        dict: Proje bilgileri
    """
    query_lower = query.lower()
    
    # "Benim projelerim"
    if user and ('benim' in query_lower or 'projelerim' in query_lower):
        projects = Project.objects.filter(
            Q(owner=user) | Q(team_members=user),
            is_active=True,
            approval_status='APPROVED'
        ).distinct().order_by('-created_at')[:10]
        
        if projects.exists():
            message = f"Sizin {projects.count()} projeniz var: "
            for project in projects[:3]:
                message += f"{project.title} ({project.get_status_display()}), "
            
            return {
                'success': True,
                'data': [{'title': p.title, 'status': p.get_status_display()} for p in projects],
                'message': message
            }
    
    # Aktif projeler
    projects = Project.objects.filter(
        is_active=True,
        approval_status='APPROVED',
        status='AKTIF'
    ).order_by('-created_at')[:10]
    
    if projects.exists():
        message = f"{projects.count()} aktif proje var: "
        for project in projects[:3]:
            message += f"{project.title}, "
        
        return {
            'success': True,
            'data': [{'title': p.title, 'status': p.get_status_display()} for p in projects],
            'message': message
        }
    
    return {
        'success': False,
        'message': 'Proje bulunamadı.'
    }


def get_committees(query: str) -> dict:
    """
    Komiteleri sorgula
    
    Args:
        query: Kullanıcı sorgusu
        
    Returns:
        dict: Komite bilgileri
    """
    committees = Committee.objects.all().order_by('name')
    
    if committees.exists():
        committee_list = []
        for committee in committees:
            members_count = committee.members.count()
            leader_name = committee.leader.full_name if committee.leader else "Belirlenmedi"
            
            committee_list.append({
                'name': committee.name,
                'leader': leader_name,
                'members_count': members_count
            })
        
        message = f"Toplulukta {committees.count()} komite var: "
        for committee in committees:
            message += f"{committee.name}, "
        
        return {
            'success': True,
            'data': committee_list,
            'message': message
        }
    
    return {
        'success': False,
        'message': 'Komite bulunamadı.'
    }


def get_user_info(username: str) -> dict:
    """
    Üye bilgilerini sorgula
    
    Args:
        username: Kullanıcı adı veya isim
        
    Returns:
        dict: Üye bilgileri
    """
    try:
        # Önce username ile dene
        user = User.objects.get(username__iexact=username)
    except User.DoesNotExist:
        # Sonra isim ile dene
        try:
            user = User.objects.filter(
                first_name__icontains=username
            ).first()
            if not user:
                user = User.objects.filter(
                    last_name__icontains=username
                ).first()
        except:
            user = None
    
    if not user:
        return {
            'success': False,
            'message': f'{username} adında bir üye bulunamadı.'
        }
    
    return {
        'success': True,
        'data': {
            'username': user.username,
            'full_name': user.full_name,
            'role': user.get_role_display(),
            'level': user.level,
            'total_points': user.total_points,
            'department': user.department or 'Belirtilmemiş',
            'grade': user.grade or 'Belirtilmemiş'
        },
        'message': f"{user.full_name} ({user.get_role_display()}), Level {user.level}, {user.total_points} puan."
    }


def get_leaderboard(limit: int = 10) -> dict:
    """
    Puan tablosunu sorgula
    
    Args:
        limit: Kaç kişi gösterilecek
        
    Returns:
        dict: Leaderboard bilgileri
    """
    users = User.objects.filter(
        is_active=True
    ).order_by('-total_points', '-level')[:limit]
    
    if users.exists():
        leaderboard = []
        for i, user in enumerate(users, 1):
            leaderboard.append({
                'rank': i,
                'username': user.username,
                'full_name': user.full_name,
                'level': user.level,
                'total_points': user.total_points
            })
        
        message = f"Puan tablosu: "
        for i, user in enumerate(users[:3], 1):
            message += f"{i}. {user.full_name} - {user.total_points} puan (Level {user.level}), "
        
        return {
            'success': True,
            'data': leaderboard,
            'message': message
        }
    
    return {
        'success': False,
        'message': 'Puan tablosu bulunamadı.'
    }

