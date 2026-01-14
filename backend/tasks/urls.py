from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskCompletionViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'completions', TaskCompletionViewSet, basename='completion')

urlpatterns = [
    path('', include(router.urls)),
]
