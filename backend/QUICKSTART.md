# BizMetric API - Quick Start Guide

## 📋 Summary
A complete Django REST API with SQL Server support for managing:
- **Admin**: User management with role-based access
- **Categories**: Product categorization system
- **Subscriptions**: Flexible subscription plans
- **Customers**: Customer profiles with subscription tracking
- **Products**: Inventory management with ratings and stock tracking

---

## 🗄️ Database Schema Overview

### Table Structure:
```
┌─────────────┐      ┌──────────────┐
│   ADMIN     │      │  CATEGORY    │
├─────────────┤      ├──────────────┤
│ admin_id(PK)│      │ category_id(PK)│
│ first_name  │      │ name(UNIQUE) │
│ last_name   │      │ description  │
│ email(UQ)   │      │ is_active    │
│ phone       │      │ created_at   │
│ username(UQ)│      │ updated_at   │
│ password    │      └──────────────┘
│ role(CHK)   │
│ is_active   │      ┌──────────────────┐
│ created_at  │      │  SUBSCRIPTION    │
│ updated_at  │      ├──────────────────┤
└─────────────┘      │ subscription_id(PK)
       ▲             │ name(UNIQUE)     │
       │             │ price(CHK>=0)    │
       │             │ billing_cycle    │
       │             │ duration_days    │
       │             │ max_products     │
       │             │ features(JSON)   │
    created_by       │ is_active        │
       │             │ created_at       │
       │             │ updated_at       │
       │             └──────────────────┘
       │                     ▲
    PRODUCT                  │
       │            subscription
       │             (nullable FK)
       └─────────────────────┘
              │
              └──► CUSTOMER ─────┐
                   customer_id(PK)
                   first_name
                   last_name
                   email(UNIQUE)
                   phone
                   address
                   city, state
                   postal_code
                   country
                   subscription_start_date
                   subscription_end_date
                   status(CHK)
                   is_verified
                   created_at
                   updated_at
                   
              ▲
              │
           category
         (NOT NULL FK)
         PROTECT delete
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd DjangoProject
pip install -r requirements.txt
```

### 2. Configure Database
Update `config/settings.py` with your SQL Server details:
```python
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': 'BizmetricDB',
        'USER': '',  # Leave empty for Windows Auth
        'HOST': 'YOUR_SERVER_NAME',
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
            'Trusted_Connection': 'yes',
        },
    }
}
```

### 3. Create Database Tables
```bash
# Option 1: Using Django commands
python manage.py makemigrations
python manage.py migrate

# Option 2: Using database manager
python db_manager.py
# Select option 1
```

### 4. Seed Sample Data (Optional)
```bash
python db_manager.py
# Select option 2
```

### 5. Run Server
```bash
python manage.py runserver
```

API URL: `http://localhost:8000/api/`

---

## 📊 Database Constraints

### ADMIN Table Constraints:
- ✅ PRIMARY KEY: `admin_id`
- ✅ UNIQUE: `email`, `username`
- ✅ CHECK: `role` in ['super_admin', 'admin', 'manager']
- ✅ REGEX: Phone format validation
- ✅ NOT NULL: first_name, last_name, email, phone, username, password

### CATEGORY Table Constraints:
- ✅ PRIMARY KEY: `category_id`
- ✅ UNIQUE: `name`
- ✅ NOT NULL: `name`

### SUBSCRIPTION Table Constraints:
- ✅ PRIMARY KEY: `subscription_id`
- ✅ UNIQUE: `name`
- ✅ CHECK: `price >= 0`, `duration_days >= 1 AND duration_days <= 365`, `max_products >= 1`
- ✅ CHECK: `billing_cycle` in ['monthly', 'quarterly', 'yearly']

### CUSTOMER Table Constraints:
- ✅ PRIMARY KEY: `customer_id`
- ✅ UNIQUE: `email`
- ✅ CHECK: `status` in ['active', 'inactive', 'suspended']
- ✅ REGEX: Phone format validation
- ✅ FOREIGN KEY: `subscription_id` (nullable, ON DELETE SET NULL)
- ✅ INDEXES: email, status

### PRODUCT Table Constraints:
- ✅ PRIMARY KEY: `product_id`
- ✅ UNIQUE: `sku`
- ✅ CHECK: `price >= 0`, `quantity_in_stock >= 0`, `rating >= 0 AND rating <= 5`
- ✅ CHECK: `status` in ['active', 'inactive', 'discontinued']
- ✅ FOREIGN KEY: `category_id` (NOT NULL, ON DELETE PROTECT)
- ✅ FOREIGN KEY: `created_by_id` (nullable, ON DELETE SET_NULL)
- ✅ INDEXES: (category, status), sku

---

## 🔌 API Endpoints

### CRUD Operations:
```
GET     /api/admins/                    - List all admins
POST    /api/admins/                    - Create admin
GET     /api/admins/{id}/               - Get admin details
PUT     /api/admins/{id}/               - Update admin
PATCH   /api/admins/{id}/               - Partial update
DELETE  /api/admins/{id}/               - Delete admin

GET     /api/categories/                - List categories
POST    /api/categories/                - Create category
GET     /api/categories/{id}/           - Get category
PUT     /api/categories/{id}/           - Update category
DELETE  /api/categories/{id}/           - Delete category

GET     /api/subscriptions/             - List subscriptions
POST    /api/subscriptions/             - Create subscription
GET     /api/subscriptions/{id}/        - Get subscription
PUT     /api/subscriptions/{id}/        - Update subscription
DELETE  /api/subscriptions/{id}/        - Delete subscription

GET     /api/customers/                 - List customers
POST    /api/customers/                 - Create customer
GET     /api/customers/{id}/            - Get customer
PUT     /api/customers/{id}/            - Update customer
DELETE  /api/customers/{id}/            - Delete customer

GET     /api/products/                  - List products
POST    /api/products/                  - Create product
GET     /api/products/{id}/             - Get product
PUT     /api/products/{id}/             - Update product
DELETE  /api/products/{id}/             - Delete product
```

### Custom Endpoints:
```
GET     /api/admins/active_admins/      - Get active admins only
POST    /api/admins/{id}/deactivate/    - Deactivate admin

GET     /api/categories/active_categories/ - Active categories
GET     /api/categories/{id}/products_count/ - Category product count

GET     /api/subscriptions/active_subscriptions/ - Active subscriptions
GET     /api/subscriptions/by_price_range/ - Filter by price

GET     /api/customers/active_customers/ - Active customers
GET     /api/customers/verified_customers/ - Verified customers
POST    /api/customers/{id}/verify/     - Verify customer
POST    /api/customers/{id}/suspend/    - Suspend customer
POST    /api/customers/{id}/reactivate/ - Reactivate customer

GET     /api/products/active_products/  - Active products
GET     /api/products/featured_products/ - Featured products
GET     /api/products/low_stock/        - Low stock products
GET     /api/products/by_price_range/   - Filter by price
GET     /api/products/by_category/      - Filter by category
POST    /api/products/{id}/update_stock/ - Update stock quantity
POST    /api/products/{id}/update_rating/ - Update rating
```

---

## 🧪 Testing the API

### Using Python Requests:
```python
import requests

# Get all products
response = requests.get('http://localhost:8000/api/products/')
products = response.json()

# Create a new product
data = {
    "name": "New Product",
    "price": 99.99,
    "category": 1,
    "sku": "NP-001",
    "quantity_in_stock": 100
}
response = requests.post('http://localhost:8000/api/products/', json=data)
```

### Using cURL:
```bash
# List all products
curl -X GET http://localhost:8000/api/products/

# Create a product
curl -X POST http://localhost:8000/api/products/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Product","price":99.99,"category":1,"sku":"P001","quantity_in_stock":100}'

# Update product stock
curl -X POST http://localhost:8000/api/products/1/update_stock/ \
  -H "Content-Type: application/json" \
  -d '{"quantity":50}'
```

### Using Postman:
1. Import `postman_collection.json`
2. Set base URL to `http://localhost:8000`
3. Run requests from the collection

---

## 📁 Project Files

- `models.py` - Database models with all constraints
- `serializers.py` - API serializers for data validation
- `views.py` - ViewSets for CRUD operations
- `urls.py` - API URL routing
- `db_manager.py` - Database management utility
- `API_DOCUMENTATION.md` - Complete API documentation
- `requirements.txt` - Python dependencies
- `postman_collection.json` - Postman API collection

---

## 💡 Key Features

✅ **Complete CRUD Operations** - Create, Read, Update, Delete for all models
✅ **Advanced Filtering** - Search, filter, and sort capabilities
✅ **Relationships** - Foreign keys with proper cascade handling
✅ **Validation** - Business logic constraints enforced
✅ **Pagination** - Default 20 items per page
✅ **Custom Actions** - Project-specific operations
✅ **Error Handling** - Comprehensive error responses
✅ **API Documentation** - Complete endpoint documentation

---

## 🔐 SQL Server Requirements

- SQL Server 2016+
- ODBC Driver 17 for SQL Server
- Windows Authentication enabled

---

## 📞 Support

For detailed API documentation, see: `API_DOCUMENTATION.md`

For database operations, run: `python db_manager.py`
