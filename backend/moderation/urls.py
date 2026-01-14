from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserReportViewSet

router = DefaultRouter()
router.register(r'reports', UserReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
