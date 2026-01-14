from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from users.models import User
from events.models import Event
from tasks.models import Task
from projects.models import Project
from users.serializers import UserSerializer
from events.serializers import EventSerializer
from tasks.serializers import TaskSerializer
from projects.serializers import ProjectSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    """Global search across users, events, tasks, and projects"""
    query = request.GET.get('q', '').strip()
    
    if not query or len(query) < 2:
        return Response({
            'users': [],
            'events': [],
            'tasks': [],
            'projects': [],
            'total': 0
        })
    
    # Search Users
    users = User.objects.filter(
        Q(username__icontains=query) |
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(email__icontains=query)
    )[:5]
    
    # Search Events
    events = Event.objects.filter(
        Q(title__icontains=query) |
        Q(description__icontains=query)
    )[:5]
    
    # Search Tasks
    tasks = Task.objects.filter(
        Q(title__icontains=query) |
        Q(description__icontains=query)
    )[:5]
    
    # Search Projects
    projects = Project.objects.filter(
        Q(title__icontains=query) |
        Q(description__icontains=query)
    )[:5]
    
    results = {
        'users': UserSerializer(users, many=True).data,
        'events': EventSerializer(events, many=True).data,
        'tasks': TaskSerializer(tasks, many=True).data,
        'projects': ProjectSerializer(projects, many=True).data,
        'total': len(users) + len(events) + len(tasks) + len(projects)
    }
    
    return Response(results)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search users for chat - returns detailed user info with committees"""
    query = request.GET.get('q', '').strip()
    
    if not query or len(query) < 2:
        return Response([])
    
    # Exclude current user from results
    users = User.objects.filter(
        Q(username__icontains=query) |
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(email__icontains=query)
    ).exclude(id=request.user.id)[:10]
    
    # Serialize with committee info
    serialized_users = []
    for user in users:
        user_data = UserSerializer(user).data
        # Add committees
        committees = []
        if hasattr(user, 'president_of'):
            committees.extend([{'id': c.id, 'name': c.name} for c in user.president_of.all()])
        if hasattr(user, 'vicepresident_of'):
            committees.extend([{'id': c.id, 'name': c.name} for c in user.vicepresident_of.all()])
        if hasattr(user, 'member_of'):
            committees.extend([{'id': c.id, 'name': c.name} for c in user.member_of.all()])
        
        # Remove duplicates
        unique_committees = {c['id']: c for c in committees}.values()
        user_data['committees'] = list(unique_committees)
        serialized_users.append(user_data)
    
    return Response(serialized_users)
