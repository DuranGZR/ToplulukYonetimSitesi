from users.models import User
from events.models import Event
from tasks.models import Task
from projects.models import Project, ProjectTask
from django.utils import timezone
from datetime import timedelta

# Admin kullanıcısını bul
admin = User.objects.get(username='admin')
testuser = User.objects.get(username='testuser')

print("📅 Etkinlikler oluşturuluyor...")
# Etkinlikler oluştur
events_data = [
    {
        'title': 'Python İleri Seviye Workshop',
        'description': 'Django ve FastAPI ile web geliştirme',
        'event_type': 'TEKNIK',
        'date_time': timezone.now() + timedelta(days=3),
        'location': 'Yazılım Laboratuvarı',
        'attendance_points': 50
    },
    {
        'title': 'HSD Tanışma Günü',
        'description': 'Yeni üyelerle tanışma etkinliği',
        'event_type': 'SOSYAL',
        'date_time': timezone.now() + timedelta(days=7),
        'location': 'Kafeterya',
        'attendance_points': 25
    },
    {
        'title': 'Hackathon 2024',
        'description': '24 saatlik kodlama maratonu',
        'event_type': 'PROJE',
        'date_time': timezone.now() + timedelta(days=14),
        'location': 'Ana Konferans Salonu',
        'attendance_points': 100
    },
    {
        'title': 'Git & GitHub Eğitimi',
        'description': 'Version control temel eğitimi',
        'event_type': 'EGITIM',
        'date_time': timezone.now() + timedelta(days=2),
        'location': 'Online - Zoom',
        'attendance_points': 30
    }
]

for event_data in events_data:
    event = Event.objects.create(
        created_by=admin,
        **event_data
    )
    print(f"  ✅ {event.title}")

print("\n📋 Görevler oluşturuluyor...")
# Görevler oluştur
tasks_data = [
    {
        'title': 'Discord Botunu Geliştir',
        'description': 'Topluluk Discord sunucusu için yönetim botu',
        'difficulty': 'ZOR',
        'category': 'GELISTIRME',
        'points': 80,
        'deadline': timezone.now() + timedelta(days=30)
    },
    {
        'title': 'Instagram İçerik Hazırla',
        'description': 'Haftalık sosyal medya gönderileri',
        'difficulty': 'KOLAY',
        'category': 'ICERIK',
        'points': 20,
        'deadline': timezone.now() + timedelta(days=7)
    },
    {
        'title': 'Web Sitesi Tasarımı',
        'description': 'Topluluk web sitesi UI/UX tasarımı',
        'difficulty': 'ORTA',
        'category': 'TASARIM',
        'points': 50,
        'deadline': timezone.now() + timedelta(days=21)
    },
    {
        'title': 'Etkinlik Fotoğrafları Düzenle',
        'description': 'Son etkinlik fotoğraflarının montajı',
        'difficulty': 'KOLAY',
        'category': 'ICERIK',
        'points': 15,
        'deadline': timezone.now() + timedelta(days=5)
    },
    {
        'title': 'Backend API Dokümantasyonu',
        'description': 'API endpoints için Swagger dökümanı',
        'difficulty': 'ORTA',
        'category': 'ARASTIRMA',
        'points': 40,
        'deadline': timezone.now() + timedelta(days=14)
    }
]

for task_data in tasks_data:
    task = Task.objects.create(
        created_by=admin,
        **task_data
    )
    print(f"  ✅ {task.title} - {task.points} puan")

print("\n🚀 Projeler oluşturuluyor...")
# Projeler oluştur
projects_data = [
    {
        'title': 'Mobil Uygulama Geliştirme',
        'description': 'React Native ile cross-platform mobil uygulama',
        'status': 'AKTIF',
        'deadline': timezone.now() + timedelta(days=60)
    },
    {
        'title': 'AI Chatbot Projesi',
        'description': 'NLP tabanlı öğrenci asistanı chatbot',
        'status': 'PLANLAMA',
        'deadline': timezone.now() + timedelta(days=90)
    },
    {
        'title': 'IoT Akıllı Kampüs',
        'description': 'Arduino ve sensörlerle akıllı kampüs çözümleri',
        'status': 'AKTIF',
        'deadline': timezone.now() + timedelta(days=45)
    }
]

for project_data in projects_data:
    project = Project.objects.create(
        owner=admin,
        **project_data
    )
    project.team_members.add(admin, testuser)
    
    # Her projeye örnek tasklar ekle
    if project.title == 'Mobil Uygulama Geliştirme':
        ProjectTask.objects.create(
            project=project,
            title='UI/UX Tasarımı Tamamla',
            description='Figma üzerinde uygulama tasarımı',
            assigned_to=admin,
            status='TAMAMLANDI',
            priority='YUKSEK',
            points=30,
            order=1
        )
        ProjectTask.objects.create(
            project=project,
            title='Authentication Sistemi',
            description='Login/Register ekranları ve API entegrasyonu',
            assigned_to=testuser,
            status='DEVAM_EDIYOR',
            priority='YUKSEK',
            points=50,
            order=2
        )
        ProjectTask.objects.create(
            project=project,
            title='Ana Sayfa Geliştirme',
            description='Dashboard ve ana menü tasarımı',
            status='YAPILACAK',
            priority='ORTA',
            points=40,
            order=3
        )
    
    print(f"  ✅ {project.title}")

print("\n✅ Test verileri başarıyla oluşturuldu!")
print(f"\n📊 Özet:")
print(f"  - {Event.objects.count()} etkinlik")
print(f"  - {Task.objects.count()} görev")
print(f"  - {Project.objects.count()} proje")
print(f"  - {ProjectTask.objects.count()} proje görevi")
