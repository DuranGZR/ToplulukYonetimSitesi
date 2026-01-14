# Generated migration to remove BIRIM_BASKANI role

from django.db import migrations, models


def convert_birim_baskani_to_komite_lideri(apps, schema_editor):
    """Mevcut BIRIM_BASKANI kullanıcılarını KOMITE_LIDERI'ne dönüştür"""
    User = apps.get_model('users', 'User')
    User.objects.filter(role='BIRIM_BASKANI').update(role='KOMITE_LIDERI')


def reverse_convert(apps, schema_editor):
    """Geri alma fonksiyonu (opsiyonel)"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_skill_proficiency'),
    ]

    operations = [
        # Önce mevcut verileri dönüştür
        migrations.RunPython(convert_birim_baskani_to_komite_lideri, reverse_convert),
        
        # Sonra model seçeneklerini güncelle
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('BASKAN', 'Başkan'),
                    ('BASKAN_YARDIMCISI', 'Başkan Yardımcısı'),
                    ('KOMITE_LIDERI', 'Komite Lideri'),
                    ('KOMITE_YARDIMCISI', 'Komite Başkan Yardımcısı'),
                    ('UYE', 'Üye'),
                ],
                default='UYE',
                max_length=20
            ),
        ),
    ]
