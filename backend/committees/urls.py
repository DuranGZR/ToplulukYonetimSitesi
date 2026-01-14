from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommitteeViewSet

router = DefaultRouter()
router.register(r'', CommitteeViewSet, basename='committee')

urlpatterns = [
    path('', include(router.urls)),
]
