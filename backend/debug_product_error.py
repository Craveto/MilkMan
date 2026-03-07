#!/usr/bin/env python
"""Debug Product API error"""
import requests
import json

API_URL = "http://localhost:8000/api/products/"

print("\n" + "="*70)
print("DEBUGGING PRODUCT API ERROR")
print("="*70)

# Test with minimal data
test_data = {
    "name": "Test Product",
    "sku": "TEST-001",
    "price": "300",
    "cost": "1",
    "category": 1,
    "quantity_in_stock": 20,
    "rating": 4.5,
    "status": "active",
    "is_featured": False,
    "description": "Test Description",
    "tags": []
}

print("\n📤 Sending data:")
print(json.dumps(test_data, indent=2))

try:
    response = requests.post(API_URL, json=test_data)
    print(f"\n📥 Response Status: {response.status_code}")
    print(f"📥 Response Headers: {dict(response.headers)}")
    
    try:
        print(f"📥 Response Body: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"📥 Response Text: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*70)
