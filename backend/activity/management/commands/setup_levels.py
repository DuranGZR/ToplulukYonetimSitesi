"""
Initial data setup - Level Thresholds
"""
from django.core.management.base import BaseCommand
from activity.models import LevelThreshold


class Command(BaseCommand):
    help = 'Seviye eşiklerini oluşturur'

    def handle(self, *args, **options):
        thresholds = [
            {'level': 1, 'min_points': 0},
            {'level': 2, 'min_points': 100},
            {'level': 3, 'min_points': 250},
            {'level': 4, 'min_points': 500},
            {'level': 5, 'min_points': 1000},
            {'level': 6, 'min_points': 2000},
            {'level': 7, 'min_points': 3500},
            {'level': 8, 'min_points': 5000},
            {'level': 9, 'min_points': 7500},
            {'level': 10, 'min_points': 10000},
        ]
        
        created_count = 0
        for threshold_data in thresholds:
            threshold, created = LevelThreshold.objects.get_or_create(
                level=threshold_data['level'],
                defaults={'min_points': threshold_data['min_points']}
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Level {threshold.level}: {threshold.min_points}+ puan')
                )
        
        if created_count == 0:
            self.stdout.write(self.style.WARNING('Seviye eşikleri zaten mevcut.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\n{created_count} seviye eşiği oluşturuldu!'))
