# MilkMan API Documentation

## Overview
Complete REST API for managing Admin, Categories, Subscriptions, Customers, and Products with comprehensive CRUD operations.

---

## Database Schema

### 1. ADMIN Table
**Purpose**: Manage admin users with different roles

**Columns with Constraints**:
- `admin_id` (PK, Auto-increment)
- `first_name` (VARCHAR 100, NOT NULL)
- `last_name` (VARCHAR 100, NOT NULL)
- `email` (VARCHAR 255, UNIQUE, NOT NULL)
- `phone` (VARCHAR 15, REGEX validation, NOT NULL)
- `username` (VARCHAR 50, UNIQUE, NOT NULL)
- `password` (VARCHAR 255, NOT NULL)
- `role` (VARCHAR 20, CHECK constraint: 'super_admin', 'admin', 'manager', DEFAULT: 'admin')
- `is_active` (BOOLEAN, DEFAULT: true)
- `created_at` (DATETIME, auto-generated)
- `updated_at` (DATETIME, auto-updated)

**Constraints**:
- PRIMARY KEY: `admin_id`
- UNIQUE: `email`, `username`
- CHECK: `role` must be one of the allowed values
- REGEX: Phone format validation

---

### 2. CATEGORY Table
**Purpose**: Product categories for organization

**Columns with Constraints**:
- `category_id` (PK, Auto-increment)
- `name` (VARCHAR 100, UNIQUE, NOT NULL)
- `description` (TEXT, nullable)
- `is_active` (BOOLEAN, DEFAULT: true)
- `created_at` (DATETIME, auto-generated)
- `updated_at` (DATETIME, auto-updated)

**Constraints**:
- PRIMARY KEY: `category_id`
- UNIQUE: `name`

---

### 3. SUBSCRIPTION Table
**Purpose**: Manage subscription plans

**Columns with Constraints**:
- `subscription_id` (PK, Auto-increment)
- `name` (VARCHAR 100, UNIQUE, NOT NULL)
- `description` (TEXT, nullable)
- `price` (DECIMAL 10,2, CHECK >= 0, NOT NULL)
- `billing_cycle` (VARCHAR 20, CHECK: 'monthly', 'quarterly', 'yearly', DEFAULT: 'monthly')
- `duration_days` (INT, CHECK: 1-365, NOT NULL)
- `max_products` (INT, CHECK: >= 1, NOT NULL)
- `features` (JSON, DEFAULT: [])
- `is_active` (BOOLEAN, DEFAULT: true)
- `created_at` (DATETIME, auto-generated)
- `updated_at` (DATETIME, auto-updated)

**Constraints**:
- PRIMARY KEY: `subscription_id`
- UNIQUE: `name`
- CHECK: `price >= 0`, `duration_days >= 1 AND duration_days <= 365`, `max_products >= 1`

---

### 4. CUSTOMER Table
**Purpose**: Manage customers with subscription tracking

**Columns with Constraints**:
- `customer_id` (PK, Auto-increment)
- `first_name` (VARCHAR 100, NOT NULL)
- `last_name` (VARCHAR 100, NOT NULL)
- `email` (VARCHAR 255, UNIQUE, NOT NULL)
- `phone` (VARCHAR 15, REGEX validation, NOT NULL)
- `address` (TEXT, nullable)
- `city` (VARCHAR 100, nullable)
- `state` (VARCHAR 50, nullable)
- `postal_code` (VARCHAR 20, nullable)
- `country` (VARCHAR 100, nullable)
- `subscription_id` (FK → Subscription, nullable, ON DELETE SET NULL)
- `subscription_start_date` (DATETIME, nullable)
- `subscription_end_date` (DATETIME, nullable)
- `status` (VARCHAR 20, CHECK: 'active', 'inactive', 'suspended', DEFAULT: 'active')
- `is_verified` (BOOLEAN, DEFAULT: false)
- `created_at` (DATETIME, auto-generated)
- `updated_at` (DATETIME, auto-updated)

**Constraints**:
- PRIMARY KEY: `customer_id`
- UNIQUE: `email`
- FOREIGN KEY: `subscription_id` → Subscription
- CHECK: `status` must be one of the allowed values
- REGEX: Phone format validation
- INDEX: `email`, `status`

---

### 5. PRODUCT Table
**Purpose**: Manage products with category and inventory

**Columns with Constraints**:
- `product_id` (PK, Auto-increment)
- `name` (VARCHAR 200, NOT NULL)
- `description` (TEXT, nullable)
- `category_id` (FK → Category, NOT NULL, ON DELETE PROTECT)
- `price` (DECIMAL 10,2, CHECK >= 0, NOT NULL)
- `cost` (DECIMAL 10,2, CHECK >= 0, nullable)
- `quantity_in_stock` (INT, CHECK >= 0, DEFAULT: 0, NOT NULL)
- `sku` (VARCHAR 50, UNIQUE, NOT NULL)
- `status` (VARCHAR 20, CHECK: 'active', 'inactive', 'discontinued', DEFAULT: 'active')
- `is_featured` (BOOLEAN, DEFAULT: false)
- `rating` (FLOAT, CHECK: 0-5, nullable)
- `tags` (JSON, DEFAULT: [])
- `created_by_id` (FK → Admin, nullable, ON DELETE SET_NULL)
- `created_at` (DATETIME, auto-generated)
- `updated_at` (DATETIME, auto-updated)

**Constraints**:
- PRIMARY KEY: `product_id`
- UNIQUE: `sku`
- FOREIGN KEY: `category_id` → Category (PROTECT deletion)
- FOREIGN KEY: `created_by_id` → Admin
- CHECK: `price >= 0`, `quantity_in_stock >= 0`, `rating >= 0 AND rating <= 5`, `status` valid values
- INDEX: (`category_id`, `status`), `sku`

---

## API Endpoints

### 1. ADMIN ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admins/` | List all admins (with pagination) |
| GET | `/api/admins/?search=name` | Search admins by name/email |
| GET | `/api/admins/?role=admin` | Filter admins by role |
| GET | `/api/admins/?is_active=true` | Filter by active status |
| GET | `/api/admins/{id}/` | Get admin details |
| POST | `/api/admins/` | Create new admin |
| PUT | `/api/admins/{id}/` | Update admin (full) |
| PATCH | `/api/admins/{id}/` | Update admin (partial) |
| DELETE | `/api/admins/{id}/` | Delete admin |
| GET | `/api/admins/active_admins/` | Get all active admins |
| POST | `/api/admins/{id}/deactivate/` | Deactivate admin |

**Create Admin Example**:
```json
POST /api/admins/
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+12025551234",
  "username": "johndoe",
  "password": "securepass123",
  "role": "admin",
  "is_active": true
}
```

---

### 2. CATEGORY ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/` | List all categories |
| GET | `/api/categories/?search=name` | Search categories |
| GET | `/api/categories/{id}/` | Get category details |
| POST | `/api/categories/` | Create new category |
| PUT | `/api/categories/{id}/` | Update category |
| PATCH | `/api/categories/{id}/` | Update category (partial) |
| DELETE | `/api/categories/{id}/` | Delete category |
| GET | `/api/categories/active_categories/` | Get active categories |
| GET | `/api/categories/{id}/products_count/` | Get product count |

**Create Category Example**:
```json
POST /api/categories/
{
  "name": "Electronics",
  "description": "Electronic products",
  "is_active": true
}
```

---

### 3. SUBSCRIPTION ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/` | List all subscriptions |
| GET | `/api/subscriptions/?search=name` | Search subscriptions |
| GET | `/api/subscriptions/?billing_cycle=monthly` | Filter by billing cycle |
| GET | `/api/subscriptions/{id}/` | Get subscription details |
| POST | `/api/subscriptions/` | Create new subscription |
| PUT | `/api/subscriptions/{id}/` | Update subscription |
| PATCH | `/api/subscriptions/{id}/` | Update subscription (partial) |
| DELETE | `/api/subscriptions/{id}/` | Delete subscription |
| GET | `/api/subscriptions/active_subscriptions/` | Get active subscriptions |
| GET | `/api/subscriptions/by_price_range/?min_price=10&max_price=50` | Filter by price |

**Create Subscription Example**:
```json
POST /api/subscriptions/
{
  "name": "Pro Plan",
  "description": "Professional plan",
  "price": 29.99,
  "billing_cycle": "monthly",
  "duration_days": 30,
  "max_products": 500,
  "features": ["Feature 1", "Feature 2"],
  "is_active": true
}
```

---

### 4. CUSTOMER ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/` | List all customers |
| GET | `/api/customers/?search=name` | Search customers |
| GET | `/api/customers/?status=active` | Filter by status |
| GET | `/api/customers/?is_verified=true` | Filter verified customers |
| GET | `/api/customers/{id}/` | Get customer details |
| POST | `/api/customers/` | Create new customer |
| PUT | `/api/customers/{id}/` | Update customer |
| PATCH | `/api/customers/{id}/` | Update customer (partial) |
| DELETE | `/api/customers/{id}/` | Delete customer |
| GET | `/api/customers/active_customers/` | Get active customers |
| GET | `/api/customers/verified_customers/` | Get verified customers |
| POST | `/api/customers/{id}/verify/` | Verify customer |
| POST | `/api/customers/{id}/suspend/` | Suspend customer |
| POST | `/api/customers/{id}/reactivate/` | Reactivate customer |

**Create Customer Example**:
```json
POST /api/customers/
{
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice@example.com",
  "phone": "+12025551111",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "USA",
  "subscription": 1,
  "status": "active",
  "is_verified": true
}
```

---

### 5. PRODUCT ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List all products |
| GET | `/api/products/?search=name` | Search products |
| GET | `/api/products/?category=1` | Filter by category |
| GET | `/api/products/?status=active` | Filter by status |
| GET | `/api/products/?is_featured=true` | Filter featured products |
| GET | `/api/products/{id}/` | Get product details |
| POST | `/api/products/` | Create new product |
| PUT | `/api/products/{id}/` | Update product |
| PATCH | `/api/products/{id}/` | Update product (partial) |
| DELETE | `/api/products/{id}/` | Delete product |
| GET | `/api/products/active_products/` | Get active products |
| GET | `/api/products/featured_products/` | Get featured products |
| GET | `/api/products/low_stock/?threshold=10` | Get low stock products |
| GET | `/api/products/by_price_range/?min_price=10&max_price=100` | Filter by price |
| GET | `/api/products/by_category/?category_id=1` | Get products by category |
| POST | `/api/products/{id}/update_stock/` | Update stock quantity |
| POST | `/api/products/{id}/update_rating/` | Update product rating |

**Create Product Example**:
```json
POST /api/products/
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "category": 1,
  "price": 999.99,
  "cost": 800.00,
  "quantity_in_stock": 50,
  "sku": "LAP-001",
  "status": "active",
  "is_featured": true,
  "rating": 4.5,
  "tags": ["electronics", "computers"],
  "created_by": 1
}
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd DjangoProject
pip install -r requirements.txt
```

### 2. Create Database Tables
```bash
python manage.py makemigrations
python manage.py migrate
```

or use the database manager:
```bash
python db_manager.py
# Select option 1: Create database tables
```

### 3. Seed Sample Data
```bash
python db_manager.py
# Select option 2: Seed sample data
```

### 4. Run Development Server
```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000/api/`

### 5. Access Django Admin
```
http://localhost:8000/admin/
```

---

## Query Parameters

All list endpoints support:
- **Search**: `?search=term` - Search in specified fields
- **Filter**: `?field=value` - Filter by field
- **Ordering**: `?ordering=field` - Order results (prefix with `-` for descending)
- **Pagination**: `?page=1` - Pagination (default 20 items per page)

### Example Queries:
```
# Search for products
GET /api/products/?search=laptop

# Filter active products
GET /api/products/?status=active

# Sort by price
GET /api/products/?ordering=price

# Descending order
GET /api/products/?ordering=-created_at

# Paginate results
GET /api/products/?page=2

# Combine multiple filters
GET /api/products/?status=active&is_featured=true&ordering=-rating
```

---

## Response Format

### Successful Response (200/201)
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  ...
}
```

### List Response with Pagination
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [
    {...},
    {...}
  ]
}
```

### Error Response (400/404)
```json
{
  "error": "Description of error"
}
```

---

## Relationships

- **Customers** → **Subscriptions** (Many-to-One, nullable)
- **Products** → **Categories** (Many-to-One, required)
- **Products** → **Admin** (created_by, Many-to-One, nullable)

---

## Notes

- All timestamps are in UTC
- Passwords are hashed when stored
- Foreign key references are protected when necessary
- All monetary values use DECIMAL(10,2) format
- Rating values are between 0 and 5
- Use Windows Authentication for SQL Server (Trusted_Connection=yes)

---

## Testing

You can test the API using:
- **Postman**: Import the collection or use manual requests
- **cURL**: Command-line testing
- **Python Requests**: Programmatic testing
- **Django REST Framework Web Interface**: http://localhost:8000/api/

---

**Created**: 2026-02-23
**Version**: 1.0
