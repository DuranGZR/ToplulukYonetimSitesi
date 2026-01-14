"""
HSD İnönü topluluğu üyelerini ve komitelerini sisteme ekleyen script
"""
from django.core.management.base import BaseCommand
from users.models import User
from committees.models import Committee


class Command(BaseCommand):
    help = 'HSD üyelerini ve komitelerini sisteme ekler'
    
    def handle(self, *args, **kwargs):
        self.stdout.write('Üyeler oluşturuluyor...')
        
        # Başkan ve yardımcıları
        utku, _ = User.objects.get_or_create(
            username='utku.ozkan',
            defaults={
                'first_name': 'Utku Bera',
                'last_name': 'Özkan',
                'email': 'utku@hsd.com',
                'role': 'BASKAN'
            }
        )
        utku.set_password('hsd2024')
        utku.save()
        
        mustafa, _ = User.objects.get_or_create(
            username='mustafa.ozdemir',
            defaults={
                'first_name': 'Mustafa',
                'last_name': 'Özdemir',
                'email': 'mustafa@hsd.com',
                'role': 'BASKAN_YARDIMCISI'
            }
        )
        mustafa.set_password('hsd2024')
        mustafa.save()
        
        efekan, _ = User.objects.get_or_create(
            username='efekan.adali',
            defaults={
                'first_name': 'Efekan',
                'last_name': 'Adalı',
                'email': 'efekan@hsd.com',
                'role': 'BASKAN_YARDIMCISI'
            }
        )
        efekan.set_password('hsd2024')
        efekan.save()
        
        # Organizasyon ve sponsorluk ekibi lideri
        oguzhan, _ = User.objects.get_or_create(
            username='oguzhan.dilmac',
            defaults={
                'first_name': 'Oğuzhan',
                'last_name': 'Dilmaç',
                'email': 'oguzhan@hsd.com',
                'role': 'BIRIM_BASKANI'
            }
        )
        oguzhan.set_password('hsd2024')
        oguzhan.save()
        
        # Etkinlik Komitesi
        abdulkadir, _ = User.objects.get_or_create(
            username='abdulkadir.orak',
            defaults={
                'first_name': 'Abdulkadir',
                'last_name': 'Orak',
                'email': 'abdulkadir@hsd.com',
                'role': 'KOMITE_LIDERI'
            }
        )
        abdulkadir.set_password('hsd2024')
        abdulkadir.save()
        
        yusuf_yeter, _ = User.objects.get_or_create(
            username='yusuf.yeter',
            defaults={
                'first_name': 'Yusuf',
                'last_name': 'Yeter',
                'email': 'yusuf.yeter@hsd.com',
                'role': 'UYE'
            }
        )
        yusuf_yeter.set_password('hsd2024')
        yusuf_yeter.save()
        
        enes, _ = User.objects.get_or_create(
            username='enes.uysal',
            defaults={
                'first_name': 'Enes',
                'last_name': 'Uysal',
                'email': 'enes@hsd.com',
                'role': 'UYE'
            }
        )
        enes.set_password('hsd2024')
        enes.save()
        
        yusuf_bozdal, _ = User.objects.get_or_create(
            username='yusuf.bozdal',
            defaults={
                'first_name': 'Yusuf',
                'last_name': 'Bozdal',
                'email': 'yusuf.bozdal@hsd.com',
                'role': 'UYE'
            }
        )
        yusuf_bozdal.set_password('hsd2024')
        yusuf_bozdal.save()
        
        mert_gunes, _ = User.objects.get_or_create(
            username='mert.gunes',
            defaults={
                'first_name': 'Mert',
                'last_name': 'Güneş',
                'email': 'mert@hsd.com',
                'role': 'UYE'
            }
        )
        mert_gunes.set_password('hsd2024')
        mert_gunes.save()
        
        # Sosyal Etkinlik Komitesi
        rumeysa, _ = User.objects.get_or_create(
            username='rumeysa.dincel',
            defaults={
                'first_name': 'Rümeysa',
                'last_name': 'Dinçel',
                'email': 'rumeysa@hsd.com',
                'role': 'KOMITE_LIDERI'
            }
        )
        rumeysa.set_password('hsd2024')
        rumeysa.save()
        
        sude_ortakaya, _ = User.objects.get_or_create(
            username='sude.ortakaya',
            defaults={
                'first_name': 'Sude',
                'last_name': 'Ortakaya',
                'email': 'sude.ortakaya@hsd.com',
                'role': 'UYE'
            }
        )
        sude_ortakaya.set_password('hsd2024')
        sude_ortakaya.save()
        
        maral, _ = User.objects.get_or_create(
            username='maral.kiyici',
            defaults={
                'first_name': 'Maral',
                'last_name': 'Kıyıcı',
                'email': 'maral@hsd.com',
                'role': 'UYE'
            }
        )
        maral.set_password('hsd2024')
        maral.save()
        
        irem_savran, _ = User.objects.get_or_create(
            username='irem.savran',
            defaults={
                'first_name': 'İrem',
                'last_name': 'Savran',
                'email': 'irem.savran@hsd.com',
                'role': 'UYE'
            }
        )
        irem_savran.set_password('hsd2024')
        irem_savran.save()
        
        # Sponsorluk Komitesi
        melike, _ = User.objects.get_or_create(
            username='melike.hastaoglu',
            defaults={
                'first_name': 'Melike',
                'last_name': 'Hastaoğlu',
                'email': 'melike@hsd.com',
                'role': 'KOMITE_LIDERI'
            }
        )
        melike.set_password('hsd2024')
        melike.save()
        
        nida, _ = User.objects.get_or_create(
            username='nida.ozbey',
            defaults={
                'first_name': 'Nida',
                'last_name': 'Özbey',
                'email': 'nida@hsd.com',
                'role': 'UYE'
            }
        )
        nida.set_password('hsd2024')
        nida.save()
        
        hamza, _ = User.objects.get_or_create(
            username='hamza.aslanbaba',
            defaults={
                'first_name': 'Hamza',
                'last_name': 'Aslanbaba',
                'email': 'hamza@hsd.com',
                'role': 'UYE'
            }
        )
        hamza.set_password('hsd2024')
        hamza.save()
        
        selin, _ = User.objects.get_or_create(
            username='selin.yilmaz',
            defaults={
                'first_name': 'Selin',
                'last_name': 'Yılmaz',
                'email': 'selin@hsd.com',
                'role': 'UYE'
            }
        )
        selin.set_password('hsd2024')
        selin.save()
        
        tahir, _ = User.objects.get_or_create(
            username='tahir.kilic',
            defaults={
                'first_name': 'Tahir',
                'last_name': 'Kılıç',
                'email': 'tahir@hsd.com',
                'role': 'UYE'
            }
        )
        tahir.set_password('hsd2024')
        tahir.save()
        
        # Sosyal Medya ve Tasarım Ekibi
        sude_naz, _ = User.objects.get_or_create(
            username='sude.naz.aydin',
            defaults={
                'first_name': 'Sude Naz',
                'last_name': 'Aydın',
                'email': 'sude.naz@hsd.com',
                'role': 'KOMITE_LIDERI'
            }
        )
        sude_naz.set_password('hsd2024')
        sude_naz.save()
        
        abdulkadir_isik, _ = User.objects.get_or_create(
            username='abdulkadir.isik',
            defaults={
                'first_name': 'Abdulkadir',
                'last_name': 'Işık',
                'email': 'abdulkadir.isik@hsd.com',
                'role': 'KOMITE_YARDIMCISI'
            }
        )
        abdulkadir_isik.set_password('hsd2024')
        abdulkadir_isik.save()
        
        hivda, _ = User.objects.get_or_create(
            username='hivda.gozel',
            defaults={
                'first_name': 'Hivda',
                'last_name': 'Gözel',
                'email': 'hivda@hsd.com',
                'role': 'UYE'
            }
        )
        hivda.set_password('hsd2024')
        hivda.save()
        
        dilara, _ = User.objects.get_or_create(
            username='dilara.buyukyildirim',
            defaults={
                'first_name': 'Dilara',
                'last_name': 'Büyükyıldırım',
                'email': 'dilara@hsd.com',
                'role': 'UYE'
            }
        )
        dilara.set_password('hsd2024')
        dilara.save()
        
        dilanur, _ = User.objects.get_or_create(
            username='dilanur.eyidemir',
            defaults={
                'first_name': 'Dilanur',
                'last_name': 'Eyidemir',
                'email': 'dilanur@hsd.com',
                'role': 'UYE'
            }
        )
        dilanur.set_password('hsd2024')
        dilanur.save()
        
        merve_asagli, _ = User.objects.get_or_create(
            username='merve.asagli',
            defaults={
                'first_name': 'Merve',
                'last_name': 'Asağlı',
                'email': 'merve.asagli@hsd.com',
                'role': 'UYE'
            }
        )
        merve_asagli.set_password('hsd2024')
        merve_asagli.save()
        
        # İçerik Ekibi
        eren, _ = User.objects.get_or_create(
            username='eren.aksu',
            defaults={
                'first_name': 'Eren',
                'last_name': 'Aksu',
                'email': 'eren@hsd.com',
                'role': 'KOMITE_LIDERI'
            }
        )
        eren.set_password('hsd2024')
        eren.save()
        
        elif_akyol, _ = User.objects.get_or_create(
            username='elif.akyol',
            defaults={
                'first_name': 'Elif',
                'last_name': 'Akyol',
                'email': 'elif.akyol@hsd.com',
                'role': 'KOMITE_YARDIMCISI'
            }
        )
        elif_akyol.set_password('hsd2024')
        elif_akyol.save()
        
        merve_kaya, _ = User.objects.get_or_create(
            username='merve.kaya',
            defaults={
                'first_name': 'Merve',
                'last_name': 'Kaya',
                'email': 'merve.kaya@hsd.com',
                'role': 'UYE'
            }
        )
        merve_kaya.set_password('hsd2024')
        merve_kaya.save()
        
        busra, _ = User.objects.get_or_create(
            username='busra.yasar',
            defaults={
                'first_name': 'Büşra',
                'last_name': 'Yaşar',
                'email': 'busra@hsd.com',
                'role': 'UYE'
            }
        )
        busra.set_password('hsd2024')
        busra.save()
        
        elif_irem, _ = User.objects.get_or_create(
            username='elif.irem.kaya',
            defaults={
                'first_name': 'Elif İrem',
                'last_name': 'Kaya',
                'email': 'elif.irem@hsd.com',
                'role': 'UYE'
            }
        )
        elif_irem.set_password('hsd2024')
        elif_irem.save()
        
        ipek, _ = User.objects.get_or_create(
            username='ipek.yurttas',
            defaults={
                'first_name': 'İpek Nur',
                'last_name': 'Yurttaş',
                'email': 'ipek@hsd.com',
                'role': 'UYE'
            }
        )
        ipek.set_password('hsd2024')
        ipek.save()
        
        seyit, _ = User.objects.get_or_create(
            username='seyit.karahan',
            defaults={
                'first_name': 'Seyit',
                'last_name': 'Karahan',
                'email': 'seyit@hsd.com',
                'role': 'UYE'
            }
        )
        seyit.set_password('hsd2024')
        seyit.save()
        
        huseyin, _ = User.objects.get_or_create(
            username='huseyin.coban',
            defaults={
                'first_name': 'Hüseyin',
                'last_name': 'Çoban',
                'email': 'huseyin@hsd.com',
                'role': 'UYE'
            }
        )
        huseyin.set_password('hsd2024')
        huseyin.save()
        
        # DevOps Ekibi
        ahmet, _ = User.objects.get_or_create(
            username='ahmet.aydogan',
            defaults={
                'first_name': 'Ahmet',
                'last_name': 'Aydoğan',
                'email': 'ahmet@hsd.com',
                'role': 'KOMITE_LIDERI'
            }
        )
        ahmet.set_password('hsd2024')
        ahmet.save()
        
        duran, _ = User.objects.get_or_create(
            username='duran.gezer',
            defaults={
                'first_name': 'Duran',
                'last_name': 'Gezer',
                'email': 'duran@hsd.com',
                'role': 'KOMITE_YARDIMCISI'
            }
        )
        duran.set_password('hsd2024')
        duran.save()
        
        baran, _ = User.objects.get_or_create(
            username='baran.berber',
            defaults={
                'first_name': 'Baran Mert',
                'last_name': 'Berber',
                'email': 'baran@hsd.com',
                'role': 'UYE'
            }
        )
        baran.set_password('hsd2024')
        baran.save()
        
        samet, _ = User.objects.get_or_create(
            username='samet.erkalp',
            defaults={
                'first_name': 'Samet',
                'last_name': 'Erkalp',
                'email': 'samet@hsd.com',
                'role': 'UYE'
            }
        )
        samet.set_password('hsd2024')
        samet.save()
        
        emre, _ = User.objects.get_or_create(
            username='emre.akdag',
            defaults={
                'first_name': 'Emre',
                'last_name': 'Akdağ',
                'email': 'emre@hsd.com',
                'role': 'UYE'
            }
        )
        emre.set_password('hsd2024')
        emre.save()
        
        ceyhun, _ = User.objects.get_or_create(
            username='ceyhun.tufan',
            defaults={
                'first_name': 'Ceyhun',
                'last_name': 'Tufan',
                'email': 'ceyhun@hsd.com',
                'role': 'UYE'
            }
        )
        ceyhun.set_password('hsd2024')
        ceyhun.save()
        
        self.stdout.write(self.style.SUCCESS('✓ Tüm kullanıcılar oluşturuldu'))
        
        # Komiteleri oluştur
        self.stdout.write('Komiteler oluşturuluyor...')
        
        etkinlik, _ = Committee.objects.get_or_create(
            name='Etkinlik Komitesi',
            defaults={
                'description': 'Teknik etkinlikler, workshoplar ve seminerler',
                'leader': abdulkadir
            }
        )
        etkinlik.members.add(yusuf_yeter, enes, yusuf_bozdal, mert_gunes)
        
        sosyal, _ = Committee.objects.get_or_create(
            name='Sosyal Etkinlik Komitesi',
            defaults={
                'description': 'Sosyal aktiviteler ve toplu etkinlikler',
                'leader': rumeysa
            }
        )
        sosyal.members.add(sude_ortakaya, maral, irem_savran)
        
        sponsorluk, _ = Committee.objects.get_or_create(
            name='Sponsorluk Komitesi',
            defaults={
                'description': 'Sponsorluk anlaşmaları ve iş birlikleri',
                'leader': melike
            }
        )
        sponsorluk.members.add(nida, hamza, selin, tahir)
        
        tasarim, _ = Committee.objects.get_or_create(
            name='Sosyal Medya ve Tasarım Ekibi',
            defaults={
                'description': 'Görsel tasarım ve sosyal medya yönetimi',
                'leader': sude_naz,
                'vice_leader': abdulkadir_isik
            }
        )
        tasarim.members.add(hivda, dilara, dilanur, merve_asagli)
        
        icerik, _ = Committee.objects.get_or_create(
            name='İçerik Ekibi',
            defaults={
                'description': 'İçerik üretimi ve editörlük',
                'leader': eren,
                'vice_leader': elif_akyol
            }
        )
        icerik.members.add(merve_kaya, busra, elif_irem, ipek, seyit, huseyin)
        
        devops, _ = Committee.objects.get_or_create(
            name='DevOps Ekibi',
            defaults={
                'description': 'Yazılım geliştirme ve sistem yönetimi',
                'leader': ahmet,
                'vice_leader': duran
            }
        )
        devops.members.add(baran, samet, emre, ceyhun)
        
        self.stdout.write(self.style.SUCCESS('✓ Tüm komiteler oluşturuldu'))
        self.stdout.write(self.style.SUCCESS('✨ İşlem tamamlandı! Tüm üyeler şifre: hsd2024'))
