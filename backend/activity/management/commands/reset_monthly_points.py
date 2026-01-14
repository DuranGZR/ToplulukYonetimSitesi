"""
Aylık puan sıfırlama ve yıldız seçimi komutu
Kullanım: python manage.py reset_monthly_points
Otomatik çalıştırma için cron job veya scheduler kullanılabilir
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from activity.models import ActivityLog, MonthlyLeaderboard, UserMonthlyStats
from users.models import User


class Command(BaseCommand):
    help = 'Aylık puanları sıfırlar ve Ayın Parlayan Yıldızını seçer'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Sadece simülasyon yapar, veritabanını değiştirmez',
        )
        parser.add_argument(
            '--month',
            type=int,
            help='Belirli bir ay için çalıştır (1-12)',
        )
        parser.add_argument(
            '--year',
            type=int,
            help='Belirli bir yıl için çalıştır',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        specific_month = options.get('month')
        specific_year = options.get('year')
        
        # Hangi ay için işlem yapılacak?
        if specific_month and specific_year:
            target_year = specific_year
            target_month = specific_month
            self.stdout.write(f"\n🎯 Belirtilen ay için işlem yapılıyor: {target_year}/{target_month:02d}")
        else:
            # Geçen ayı al
            now = timezone.now()
            first_day_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month = first_day_this_month - timedelta(days=1)
            target_year = last_month.year
            target_month = last_month.month
            self.stdout.write(f"\n📅 Geçen ay için işlem yapılıyor: {target_year}/{target_month:02d}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("\n⚠️  DRY RUN MODE - Veritabanı değişikliği yapılmayacak\n"))
        
        # 1. O ayın istatistiklerini topla
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.HTTP_INFO("📊 1. AŞAMA: Aylık İstatistikleri Toplama"))
        self.stdout.write("="*60)
        
        active_users = User.objects.filter(is_active=True).order_by('-total_points')
        
        for user in active_users:
            # Kullanıcının o ayki aktivitelerini say
            monthly_logs = ActivityLog.objects.filter(user=user)
            
            # Eğer belirli ay verilmişse, o aya filtrele
            if specific_month and specific_year:
                start_date = datetime(target_year, target_month, 1)
                if target_month == 12:
                    end_date = datetime(target_year + 1, 1, 1)
                else:
                    end_date = datetime(target_year, target_month + 1, 1)
                monthly_logs = monthly_logs.filter(
                    created_at__gte=start_date,
                    created_at__lt=end_date
                )
            
            events_count = monthly_logs.filter(source='EVENT').count()
            tasks_count = monthly_logs.filter(source='TASK').count()
            projects_count = monthly_logs.filter(source='PROJECT').count()
            meetings_count = monthly_logs.filter(source='MEETING').count()
            
            # UserMonthlyStats oluştur veya güncelle
            if not dry_run:
                stats, created = UserMonthlyStats.objects.update_or_create(
                    user=user,
                    year=target_year,
                    month=target_month,
                    defaults={
                        'points_earned': user.total_points,
                        'events_attended': events_count,
                        'tasks_completed': tasks_count,
                        'projects_contributed': projects_count,
                        'meetings_attended': meetings_count,
                    }
                )
            
            if user.total_points > 0:
                self.stdout.write(
                    f"  ✓ {user.full_name}: {user.total_points} puan "
                    f"(E:{events_count} G:{tasks_count} P:{projects_count} T:{meetings_count})"
                )
        
        # 2. Ayın yıldızını/yıldızlarını belirle
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.HTTP_INFO("⭐ 2. AŞAMA: Ayın Parlayan Yıldızını Belirleme"))
        self.stdout.write("="*60)
        
        if not active_users.exists():
            self.stdout.write(self.style.WARNING("  ⚠️  Aktif kullanıcı bulunamadı!"))
            return
        
        # En yüksek puanı bul
        max_points = active_users[0].total_points
        
        if max_points == 0:
            self.stdout.write(self.style.WARNING("  ℹ️  Hiç puan kazanan olmamış. Yıldız seçilmedi."))
            winners = []
        else:
            # Aynı puana sahip tüm kullanıcıları al (eşitlik durumu)
            winners = active_users.filter(total_points=max_points)
            
            self.stdout.write(self.style.SUCCESS(f"\n  🎉 Kazanan Puan: {max_points}"))
            self.stdout.write(self.style.SUCCESS(f"  🌟 Kazanan Sayısı: {winners.count()}"))
            
            for idx, winner in enumerate(winners, 1):
                self.stdout.write(
                    self.style.SUCCESS(f"     {idx}. {winner.full_name} (@{winner.username})")
                )
        
        # 3. MonthlyLeaderboard oluştur
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.HTTP_INFO("💾 3. AŞAMA: Lider Tablosunu Kaydetme"))
        self.stdout.write("="*60)
        
        # Top 10 snapshot oluştur
        leaderboard_snapshot = []
        for rank, user in enumerate(active_users[:10], 1):
            leaderboard_snapshot.append({
                'rank': rank,
                'user_id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'points': user.total_points,
                'level': user.level,
            })
        
        if not dry_run:
            monthly_board, created = MonthlyLeaderboard.objects.get_or_create(
                year=target_year,
                month=target_month,
                defaults={
                    'winning_points': max_points if winners else 0,
                    'leaderboard_snapshot': leaderboard_snapshot,
                    'is_finalized': True,
                    'finalized_at': timezone.now(),
                }
            )
            
            # Kazananları ekle
            if winners:
                monthly_board.winners.set(winners)
                monthly_board.save()
                
                # UserMonthlyStats'ı güncelle (is_winner = True ve rank)
                for rank, user in enumerate(active_users, 1):
                    UserMonthlyStats.objects.filter(
                        user=user,
                        year=target_year,
                        month=target_month
                    ).update(
                        rank=rank,
                        is_winner=(user in winners)
                    )
                
                # Kazananların star_count'ını artır
                for winner in winners:
                    winner.star_count += 1
                    winner.save(update_fields=['star_count'])
                
                self.stdout.write(self.style.SUCCESS(f"\n  ✓ Lider tablosu kaydedildi"))
                self.stdout.write(self.style.SUCCESS(f"  ✓ {winners.count()} kişinin star_count'ı artırıldı"))
        else:
            self.stdout.write(self.style.WARNING("  [DRY RUN] Lider tablosu kaydedilecekti"))
        
        # 4. Puanları sıfırla
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.HTTP_INFO("🔄 4. AŞAMA: Puanları Sıfırlama"))
        self.stdout.write("="*60)
        
        if not dry_run:
            # Tüm kullanıcıların puanlarını sıfırla
            reset_count = User.objects.filter(is_active=True).update(
                total_points=0,
                level=1
            )
            self.stdout.write(self.style.SUCCESS(f"\n  ✓ {reset_count} kullanıcının puanı sıfırlandı"))
        else:
            self.stdout.write(self.style.WARNING(f"  [DRY RUN] {active_users.count()} kullanıcının puanı sıfırlanacaktı"))
        
        # Özet
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("✅ İŞLEM TAMAMLANDI"))
        self.stdout.write("="*60)
        
        month_names = {
            1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
            5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
            9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
        }
        
        self.stdout.write(f"\n📅 Ay: {month_names[target_month]} {target_year}")
        self.stdout.write(f"👥 Toplam Kullanıcı: {active_users.count()}")
        self.stdout.write(f"🏆 Kazanan Sayısı: {winners.count() if winners else 0}")
        self.stdout.write(f"⭐ Kazanan Puan: {max_points}")
        
        if not dry_run:
            self.stdout.write(self.style.SUCCESS("\n💾 Tüm değişiklikler kaydedildi!"))
        else:
            self.stdout.write(self.style.WARNING("\n⚠️  DRY RUN - Hiçbir değişiklik yapılmadı!"))
            self.stdout.write(self.style.WARNING("Gerçek çalıştırma için --dry-run parametresini kaldırın."))
        
        self.stdout.write("\n")
