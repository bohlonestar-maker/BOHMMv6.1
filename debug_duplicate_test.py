import requests
import json
import urllib3

# Suppress SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://member-hub-29.preview.emergentagent.com/api"

def login():
    """Login and get token"""
    login_data = {"username": "testadmin", "password": "testpass123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data, verify=False)
    if response.status_code == 200:
        return response.json()['token']
    return None

def test_duplicate_email_debug():
    """Debug duplicate email prevention"""
    token = login()
    if not token:
        print("❌ Login failed")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Create first member
    first_member = {
        "chapter": "National",
        "title": "Prez",
        "handle": "DebugTest1",
        "name": "Debug First Member",
        "email": "debug@test.com",
        "phone": "555-0001",
        "address": "123 Debug Street"
    }
    
    print("Creating first member...")
    response = requests.post(f"{BASE_URL}/members", json=first_member, headers=headers, verify=False)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        first_member_data = response.json()
        first_member_id = first_member_data['id']
        print(f"✅ First member created with ID: {first_member_id}")
        print(f"Email in response: {first_member_data.get('email')}")
    else:
        print(f"❌ Failed to create first member: {response.text}")
        return
    
    # Try to create second member with same email
    second_member = {
        "chapter": "AD",
        "title": "VP",
        "handle": "DebugTest2",
        "name": "Debug Second Member",
        "email": "debug@test.com",  # Same email
        "phone": "555-0002",
        "address": "456 Debug Street"
    }
    
    print("\nTrying to create second member with same email...")
    response = requests.post(f"{BASE_URL}/members", json=second_member, headers=headers, verify=False)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("❌ PROBLEM: Second member was created despite duplicate email!")
        second_member_data = response.json()
        second_member_id = second_member_data['id']
        print(f"Second member ID: {second_member_id}")
        print(f"Email in response: {second_member_data.get('email')}")
        
        # Clean up second member
        requests.delete(f"{BASE_URL}/members/{second_member_id}", headers=headers, verify=False)
    elif response.status_code == 400:
        print("✅ Correctly prevented duplicate email")
    else:
        print(f"❌ Unexpected status code: {response.status_code}")
    
    # Check what's in the database
    print("\nChecking all members in database...")
    response = requests.get(f"{BASE_URL}/members", headers=headers, verify=False)
    if response.status_code == 200:
        members = response.json()
        print(f"Found {len(members)} members:")
        for member in members:
            if member.get('handle', '').startswith('DebugTest'):
                print(f"  - Handle: {member.get('handle')}, Email: {member.get('email')}, ID: {member.get('id')}")
    
    # Clean up first member
    print(f"\nCleaning up first member...")
    response = requests.delete(f"{BASE_URL}/members/{first_member_id}", headers=headers, verify=False)
    print(f"Delete status: {response.status_code}")

if __name__ == "__main__":
    test_duplicate_email_debug()