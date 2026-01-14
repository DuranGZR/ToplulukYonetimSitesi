from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EffortViewSet

router = DefaultRouter()
router.register(r'efforts', EffortViewSet, basename='effort')

urlpatterns = [
    path('', include(router.urls)),
]

