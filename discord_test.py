#!/usr/bin/env python3

import requests
import sys
import json
import urllib3

# Suppress SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_discord_activity():
    """Test Discord activity tracking functionality"""
    base_url = "https://biker-dashboard.preview.emergentagent.com/api"
    
    print("🤖 Testing Discord Activity Tracking...")
    
    # Step 1: Login with testadmin credentials
    print("\n🔐 Step 1: Authenticating with testadmin...")
    
    login_data = {"username": "testadmin", "password": "testpass123"}
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data, verify=False)
        
        if response.status_code == 200:
            login_response = response.json()
            token = login_response.get('token')
            print(f"   ✅ Login successful")
            print(f"   Token: {token[:20]}...")
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Login error: {str(e)}")
        return False
    
    # Step 2: Test the Discord activity endpoint
    print("\n🔍 Step 2: Testing GET /api/discord/test-activity...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f"{base_url}/discord/test-activity", headers=headers, verify=False)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            activity_data = response.json()
            print(f"   ✅ Discord activity endpoint successful")
            
            # Display the response data
            print(f"\n📊 Discord Activity Status:")
            print(f"   Bot Status: {activity_data.get('bot_status', 'unknown')}")
            print(f"   Total Voice Records: {activity_data.get('total_voice_records', 0)}")
            print(f"   Total Text Records: {activity_data.get('total_text_records', 0)}")
            print(f"   Recent Voice Activity: {activity_data.get('recent_voice_activity', 0)}")
            print(f"   Recent Text Activity: {activity_data.get('recent_text_activity', 0)}")
            print(f"   Message: {activity_data.get('message', 'No message')}")
            
            # Analyze the results
            bot_status = activity_data.get('bot_status')
            if bot_status == 'running':
                print(f"\n✅ RESULT: Discord bot is running and ready to track activity")
            elif bot_status == 'not_running':
                print(f"\n⚠️  RESULT: Discord bot is not running - check bot configuration")
            else:
                print(f"\n❓ RESULT: Unknown bot status: {bot_status}")
            
            voice_count = activity_data.get('total_voice_records', 0)
            text_count = activity_data.get('total_text_records', 0)
            
            if voice_count > 0 or text_count > 0:
                print(f"✅ Activity records found: {voice_count} voice + {text_count} text")
            else:
                print(f"ℹ️  No activity records yet (expected if bot just started)")
            
            return True
            
        else:
            print(f"   ❌ Discord activity endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Discord activity test error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Discord Activity Tracking Test")
    print("=" * 50)
    
    success = test_discord_activity()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Discord activity tracking test completed successfully")
    else:
        print("❌ Discord activity tracking test failed")
    
    sys.exit(0 if success else 1)