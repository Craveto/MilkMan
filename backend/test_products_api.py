#!/usr/bin/env python
"""Test Products API endpoints"""
import requests
import json

API_URL = "http://localhost:8000/api"
CATEGORIES_URL = f"{API_URL}/categories/"
PRODUCTS_URL = f"{API_URL}/products/"

print("\n" + "="*70)
print("PRODUCTS API TESTING")
print("="*70)

# Step 1: Check if categories exist
print("\n✓ STEP 1: GET/CREATE CATEGORY")
print("-" * 70)
try:
    response = requests.get(CATEGORIES_URL)
    if response.status_code == 200:
        categories = response.json()
        category_list = categories if isinstance(categories, list) else categories.get('results', [])
        
        if category_list:
            category_id = category_list[0].get('category_id')
            print(f"  ✅ Found {len(category_list)} categories")
            print(f"  Using category: {category_list[0].get('name')} (ID: {category_id})")
        else:
            # Create a category
            print("  ℹ️  No categories found, creating one...")
            category_data = {
                "name": "Electronics",
                "description": "Electronic products and devices",
                "is_active": True
            }
            response = requests.post(CATEGORIES_URL, json=category_data)
            if response.status_code in [200, 201]:
                category = response.json()
                category_id = category.get('category_id')
                print(f"  ✅ Category created: {category['name']} (ID: {category_id})")
            else:
                print(f"  ❌ Failed to create category: {response.text}")
                category_id = None
    else:
        print(f"  ❌ Failed to get categories: {response.status_code}")
        category_id = None
except Exception as e:
    print(f"  ❌ Error: {e}")
    category_id = None

# Step 2: Create Product
if category_id:
    print("\n✓ STEP 2: CREATE PRODUCT")
    print("-" * 70)
    product_data = {
        "name": "Wireless Headphones",
        "description": "Premium wireless noise-canceling headphones",
        "category": category_id,
        "price": "149.99",
        "cost": "80.00",
        "quantity_in_stock": 50,
        "sku": "WHD-001",
        "rating": 4.5,
        "status": "active",
        "is_featured": True,
        "tags": ["audio", "wireless", "premium"]
    }
    
    try:
        response = requests.post(PRODUCTS_URL, json=product_data)
        if response.status_code in [200, 201]:
            product = response.json()
            product_id = product.get('product_id')
            print(f"  ✅ Product Created Successfully!")
            print(f"  ID: {product_id}")
            print(f"  Name: {product['name']}")
            print(f"  Price: ${product['price']}")
            print(f"  Stock: {product['quantity_in_stock']}")
        else:
            print(f"  ❌ Failed: {response.status_code}")
            print(f"  Response: {response.text}")
            product_id = None
    except Exception as e:
        print(f"  ❌ Error: {e}")
        product_id = None

    # Step 3: Get All Products
    print("\n✓ STEP 3: GET ALL PRODUCTS")
    print("-" * 70)
    try:
        response = requests.get(PRODUCTS_URL)
        if response.status_code == 200:
            products = response.json()
            product_list = products if isinstance(products, list) else products.get('results', [])
            print(f"  ✅ Retrieved {len(product_list)} products")
            for i, prod in enumerate(product_list[:5], 1):
                print(f"    {i}. {prod.get('name')} - ${prod.get('price')}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Step 4: Get Single Product
    if product_id:
        print(f"\n✓ STEP 4: GET PRODUCT BY ID ({product_id})")
        print("-" * 70)
        try:
            response = requests.get(f"{PRODUCTS_URL}{product_id}/")
            if response.status_code == 200:
                product = response.json()
                print(f"  ✅ Product Retrieved Successfully!")
                print(f"  Name: {product['name']}")
                print(f"  Category: {product['category_name']}")
                print(f"  Price: ${product['price']}")
                print(f"  Rating: {product.get('rating', 'N/A')} ⭐")
                print(f"  Featured: {'Yes' if product['is_featured'] else 'No'}")
        except Exception as e:
            print(f"  ❌ Error: {e}")

        # Step 5: Update Product
        print(f"\n✓ STEP 5: UPDATE PRODUCT ({product_id})")
        print("-" * 70)
        update_data = {
            "quantity_in_stock": 45,
            "price": "139.99",
            "rating": 4.8
        }
        try:
            response = requests.patch(f"{PRODUCTS_URL}{product_id}/", json=update_data)
            if response.status_code == 200:
                product = response.json()
                print(f"  ✅ Product Updated Successfully!")
                print(f"  New Price: ${product['price']}")
                print(f"  New Stock: {product['quantity_in_stock']}")
                print(f"  New Rating: {product.get('rating', 'N/A')} ⭐")
        except Exception as e:
            print(f"  ❌ Error: {e}")

        # Step 6: Delete Product
        print(f"\n✓ STEP 6: DELETE PRODUCT ({product_id})")
        print("-" * 70)
        try:
            response = requests.delete(f"{PRODUCTS_URL}{product_id}/")
            if response.status_code in [200, 204]:
                print(f"  ✅ Product Deleted Successfully!")
        except Exception as e:
            print(f"  ❌ Error: {e}")

print("\n" + "="*70)
print("✅ PRODUCTS API TEST COMPLETED!")
print("="*70 + "\n")
