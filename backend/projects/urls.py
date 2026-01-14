from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectTaskViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-tasks', ProjectTaskViewSet, basename='project-task')

urlpatterns = [
    path('', include(router.urls)),
]
