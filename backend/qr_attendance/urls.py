from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QRCodeViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'qr-codes', QRCodeViewSet, basename='qr-codes')
router.register(r'attendances', AttendanceViewSet, basename='attendances')

urlpatterns = [
    path('', include(router.urls)),
]
