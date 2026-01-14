from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeetingViewSet, CalendarView

router = DefaultRouter()
router.register(r'meetings', MeetingViewSet, basename='meeting')

urlpatterns = [
    path('', include(router.urls)),
    path('calendar/', CalendarView.as_view(), name='calendar'),
]

