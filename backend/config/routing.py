"""
WebSocket URL routing configuration for HSD Platform
"""

from django.urls import path
from notifications.consumers import NotificationConsumer
from projects.consumers import ProjectBoardConsumer
from committees.consumers import CommitteeChatConsumer
from chats.consumers import ChatConsumer

websocket_urlpatterns = [
    path('ws/notifications/', NotificationConsumer.as_asgi()),
    path('ws/project/<int:project_id>/', ProjectBoardConsumer.as_asgi()),
    path('ws/committee/<int:committee_id>/', CommitteeChatConsumer.as_asgi()),
    path('ws/chat/<int:room_id>/', ChatConsumer.as_asgi()),
]
