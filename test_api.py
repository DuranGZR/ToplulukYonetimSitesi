import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_login():
    """Login testi"""
    print("\n🔐 Testing Login...")
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login başarılı!")
        print(f"   Response keys: {list(data.keys())}")
        if 'user' in data:
            print(f"   User: {data['user']['username']}")
            print(f"   Level: {data['user']['level']}")
            print(f"   Points: {data['user']['total_points']}")
        return data.get('access') or data.get('access_token') or data.get('token') or data.get('tokens', {}).get('access')
    else:
        print(f"❌ Login başarısız: {response.text}")
        return None

def test_leaderboard(token):
    """Leaderboard testi"""
    print("\n🏆 Testing Leaderboard...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/activity/logs/leaderboard/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Leaderboard başarılı - {len(data)} kullanıcı")
        for i, user in enumerate(data[:3], 1):
            print(f"   {i}. {user['username']}: Level {user['level']}, {user['total_points']} puan")
    else:
        print(f"❌ Leaderboard başarısız: {response.text}")

def test_my_stats(token):
    """Kullanıcı istatistikleri testi"""
    print("\n📊 Testing My Stats...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/activity/my-stats/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Stats başarılı!")
        print(f"   Level: {data['current_level']}")
        print(f"   Total Points: {data['total_points']}")
        if data['points_to_next_level']:
            print(f"   Next Level: {data['next_level']} ({data['points_to_next_level']} puan gerekli)")
        else:
            print(f"   Max level reached!")
    else:
        print(f"❌ Stats başarısız: {response.text}")

def test_events(token):
    """Events testi"""
    print("\n📅 Testing Events...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/events/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        events = data if isinstance(data, list) else data.get('results', [])
        print(f"✅ Events başarılı - {len(events)} etkinlik")
        for event in events[:3]:
            print(f"   - {event['title']}: {event['attendance_points']} puan")
    else:
        print(f"❌ Events başarısız: {response.text}")

def test_tasks(token):
    """Tasks testi"""
    print("\n📋 Testing Tasks...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/tasks/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        tasks = data if isinstance(data, list) else data.get('results', [])
        print(f"✅ Tasks başarılı - {len(tasks)} görev")
        for task in tasks[:3]:
            print(f"   - {task['title']}: {task['points']} puan ({task['difficulty_display']})")
    else:
        print(f"❌ Tasks başarısız: {response.text}")

def test_projects(token):
    """Projects testi"""
    print("\n🚀 Testing Projects...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/projects/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        projects = data if isinstance(data, list) else data.get('results', [])
        print(f"✅ Projects başarılı - {len(projects)} proje")
        for project in projects[:3]:
            print(f"   - {project['title']}: {project['status_display']}, {project['completion_percentage']}% tamamlandı")
    else:
        print(f"❌ Projects başarısız: {response.text}")

def test_users(token):
    """Users API testi"""
    print("\n👥 Testing Users...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        users = data if isinstance(data, list) else data.get('results', [])
        print(f"✅ Users başarılı - {len(users)} kullanıcı")
        for user in users[:5]:
            print(f"   - {user['username']}: {user['role']} (Level {user['level']})")
    else:
        print(f"❌ Users başarısız: {response.text}")

def test_committees(token):
    """Committees API testi"""
    print("\n🏛️ Testing Committees...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/committees/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        committees = data if isinstance(data, list) else data.get('results', [])
        print(f"✅ Committees başarılı - {len(committees)} komite")
        for committee in committees:
            print(f"   - {committee['name']}: {len(committee.get('members', []))} üye")
            print(f"     Leader ID: {committee.get('leader')}")
            print(f"     Members: {committee.get('members', [])}")
    else:
        print(f"❌ Committees başarısız: {response.text}")

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 HSD Platform API Test Suite")
    print("=" * 60)
    
    token = test_login()
    if token:
        test_leaderboard(token)
        test_my_stats(token)
        test_users(token)
        test_committees(token)
        test_events(token)
        test_tasks(token)
        test_projects(token)
        
        print("\n" + "=" * 60)
        print("✅ Test Suite Tamamlandı!")
        print("=" * 60)
    else:
        print("\n❌ Login başarısız olduğu için testler durdu.")
