#!/usr/bin/env python
"""Test Admin API endpoints"""
import requests
import json

API_URL = "http://localhost:8000/api/admins/"

print("\n" + "="*70)
print("ADMIN API TESTING - CREATE, READ, UPDATE, DELETE")
print("="*70)

# Test 1: Create Admin
print("\n✓ TEST 1: CREATE ADMIN")
print("-" * 70)
admin_data = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+12345678901",
    "username": "johndoe",
    "password": "SecurePass123!",
    "role": "admin",
    "is_active": True
}

try:
    response = requests.post(API_URL, json=admin_data)
    if response.status_code in [200, 201]:
        admin = response.json()
        admin_id = admin.get('admin_id')
        print(f"  ✅ Admin Created Successfully!")
        print(f"  ID: {admin_id}")
        print(f"  Username: {admin['username']}")
        print(f"  Email: {admin['email']}")
        print(f"  Role: {admin['role']}")
    else:
        print(f"  ❌ Failed: {response.status_code}")
        print(f"  Response: {response.text}")
        admin_id = None
except Exception as e:
    print(f"  ❌ Error: {e}")
    admin_id = None

# Test 2: Get All Admins
print("\n✓ TEST 2: GET ALL ADMINS")
print("-" * 70)
try:
    response = requests.get(API_URL)
    if response.status_code == 200:
        admins = response.json()
        print(f"  ✅ Retrieved Admins Successfully!")
        print(f"  Total Admins: {len(admins) if isinstance(admins, list) else admins.get('count', 0)}")
except Exception as e:
    print(f"  ❌ Error: {e}")

# Test 3: Get Single Admin
if admin_id:
    print(f"\n✓ TEST 3: GET ADMIN BY ID ({admin_id})")
    print("-" * 70)
    try:
        response = requests.get(f"{API_URL}{admin_id}/")
        if response.status_code == 200:
            admin = response.json()
            print(f"  ✅ Admin Retrieved Successfully!")
            print(f"  Name: {admin['first_name']} {admin['last_name']}")
            print(f"  Email: {admin['email']}")
            print(f"  Status: {'Active' if admin['is_active'] else 'Inactive'}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Test 4: Update Admin
    print(f"\n✓ TEST 4: UPDATE ADMIN ({admin_id})")
    print("-" * 70)
    update_data = {
        "first_name": "Jane",
        "role": "super_admin"
    }
    try:
        response = requests.patch(f"{API_URL}{admin_id}/", json=update_data)
        if response.status_code == 200:
            admin = response.json()
            print(f"  ✅ Admin Updated Successfully!")
            print(f"  New Name: {admin['first_name']}")
            print(f"  New Role: {admin['role']}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Test 5: Delete Admin
    print(f"\n✓ TEST 5: DELETE ADMIN ({admin_id})")
    print("-" * 70)
    try:
        response = requests.delete(f"{API_URL}{admin_id}/")
        if response.status_code in [200, 204]:
            print(f"  ✅ Admin Deleted Successfully!")
    except Exception as e:
        print(f"  ❌ Error: {e}")

print("\n" + "="*70)
print("✅ ADMIN API TEST COMPLETED!")
print("="*70 + "\n")
