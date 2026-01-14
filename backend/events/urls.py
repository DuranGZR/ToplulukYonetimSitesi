from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventAttendanceViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'attendances', EventAttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]
