from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ActivityLogViewSet, add_manual_points, my_stats,
    current_month_leaderboard, past_months_leaderboard, user_monthly_history, month_detail
)

router = DefaultRouter()
router.register(r'logs', ActivityLogViewSet, basename='activitylog')

urlpatterns = [
    path('', include(router.urls)),
    path('add-points/', add_manual_points, name='add-manual-points'),
    path('my-stats/', my_stats, name='my-stats'),
    path('current-month/', current_month_leaderboard, name='current-month-leaderboard'),
    path('past-months/', past_months_leaderboard, name='past-months-leaderboard'),
    path('monthly-history/<int:user_id>/', user_monthly_history, name='user-monthly-history'),
    path('monthly-history/', user_monthly_history, name='my-monthly-history'),
    path('month/<int:year>/<int:month>/', month_detail, name='month-detail'),
]
