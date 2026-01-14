"""Tüm komitelerin lider ve yardımcılarını members listesine ekle"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from committees.models import Committee

def fix_committee_members():
    updated_count = 0
    
    for committee in Committee.objects.all():
        added_members = []
        
        # Lider ekle
        if committee.leader and committee.leader not in committee.members.all():
            committee.members.add(committee.leader)
            added_members.append(committee.leader.full_name)
        
        # Yardımcı ekle
        if committee.vice_leader and committee.vice_leader not in committee.members.all():
            committee.members.add(committee.vice_leader)
            added_members.append(committee.vice_leader.full_name)
        
        if added_members:
            print(f"✓ {committee.name}: {', '.join(added_members)} eklendi")
            updated_count += len(added_members)
    
    print(f"\n✅ Toplam {updated_count} kişi komite members listesine eklendi")
    
    # Özet
    print("\n📊 Komite özeti:")
    for committee in Committee.objects.all():
        print(f"  • {committee.name}: {committee.members.count()} üye")

if __name__ == '__main__':
    fix_committee_members()
