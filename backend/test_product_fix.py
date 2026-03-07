#!/usr/bin/env python
"""Test product creation with unique SKU"""
import requests
import json
import time

API_URL = "http://localhost:8000/api/products/"

# Create unique SKU
unique_sku = f"MILK-BOTTLE-{int(time.time())}"

test_data = {
    "name": "Premium Milk Bottle",
    "sku": unique_sku,
    "price": "5.99",
    "cost": "2.00",
    "category": 1,
    "quantity_in_stock": 100,
    "rating": 4.8,
    "status": "active",
    "is_featured": True,
    "description": "Fresh premium milk in bottle",
    "tags": ["organic", "fresh", "dairy"]
}

print("\n" + "="*70)
print("TESTING PRODUCT CREATION WITH FIXED CODE")
print("="*70)
print(f"\n📤 Creating product with SKU: {unique_sku}")

try:
    response = requests.post(API_URL, json=test_data)
    print(f"📥 Response Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        product = response.json()
        print(f"\n✅ PRODUCT CREATED SUCCESSFULLY!")
        print(f"  Product ID: {product['product_id']}")
        print(f"  Name: {product['name']}")
        print(f"  SKU: {product['sku']}")
        print(f"  Price: ${product['price']}")
        print(f"  Category: {product['category_name']}")
        print(f"  Tags: {product['tags']}")
        print(f"  Featured: {'Yes' if product['is_featured'] else 'No'}")
        print(f"  Created By: {product['created_by_name']}")
    else:
        print(f"\n❌ ERROR:")
        print(json.dumps(response.json(), indent=2))
        
except Exception as e:
    print(f"\n❌ Exception: {e}")

print("\n" + "="*70)
