from django.core.management.base import BaseCommand
from notifications.models import Notification
from users.models import User

class Command(BaseCommand):
    help = 'Create sample notifications for testing'

    def handle(self, *args, **kwargs):
        # Get first user (admin)
        try:
            user = User.objects.first()
            if not user:
                self.stdout.write(self.style.ERROR('No users found'))
                return

            # Create sample notifications
            notifications = [
                {
                    'recipient': user,
                    'notification_type': 'TASK_ASSIGNED',
                    'title': 'Yeni Görev Atandı',
                    'message': 'Size "Backend API Geliştirme" görevi atandı.',
                    'link': '/tasks'
                },
                {
                    'recipient': user,
                    'notification_type': 'EVENT_REMINDER',
                    'title': 'Etkinlik Hatırlatması',
                    'message': 'Yarın saat 14:00\'te "Genel Toplantı" etkinliği başlayacak.',
                    'link': '/events'
                },
                {
                    'recipient': user,
                    'notification_type': 'LEVEL_UP',
                    'title': 'Seviye Atladınız! 🎉',
                    'message': f'Tebrikler! Artık Level {user.level} seviyesindesiniz.',
                    'link': '/profile'
                },
                {
                    'recipient': user,
                    'notification_type': 'EVENT_CREATED',
                    'title': 'Yeni Etkinlik',
                    'message': 'Topluluk "Yazılım Sohbetleri" etkinliğini oluşturdu.',
                    'link': '/events'
                },
                {
                    'recipient': user,
                    'notification_type': 'ACHIEVEMENT',
                    'title': 'Yeni Başarı Kazanıldı',
                    'message': '10 görev tamamlama başarısını kazandınız!',
                    'link': '/profile'
                },
            ]

            created_count = 0
            for notif_data in notifications:
                Notification.objects.create(**notif_data)
                created_count += 1

            self.stdout.write(
                self.style.SUCCESS(f'{created_count} sample notification created for {user.username}')
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
