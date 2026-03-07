# Database Management Script
# This script handles database initialization and CRUD operations

import os
import django
from django.db import connection
from django.core.management import execute_from_command_line

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Admin, Category, Subscription, Customer, Product


class DatabaseManager:
    """Helper class for database operations"""
    
    @staticmethod
    def create_database():
        """Create database tables"""
        print("Creating database tables...")
        execute_from_command_line(['manage.py', 'makemigrations'])
        execute_from_command_line(['manage.py', 'migrate'])
        print("✓ Database tables created successfully!")
    
    @staticmethod
    def seed_sample_data():
        """Seed database with sample data"""
        print("\nSeeding sample data...")
        
        # Create sample admin
        admin = Admin.objects.create(
            first_name='John',
            last_name='Doe',
            email='admin@bizmetric.com',
            phone='+12025551234',
            username='admin',
            password='admin123',
            role='super_admin',
            is_active=True
        )
        print(f"✓ Created admin: {admin}")
        
        # Create sample categories
        categories = [
            Category.objects.create(name='Electronics', description='Electronic products'),
            Category.objects.create(name='Clothing', description='Clothing items'),
            Category.objects.create(name='Books', description='Books and publications'),
        ]
        print(f"✓ Created {len(categories)} categories")
        
        # Create sample subscriptions
        subscriptions = [
            Subscription.objects.create(
                name='Basic Plan',
                description='Basic subscription plan',
                price=9.99,
                billing_cycle='monthly',
                duration_days=30,
                max_products=50,
                features=['Basic features', 'Limited support']
            ),
            Subscription.objects.create(
                name='Pro Plan',
                description='Professional subscription plan',
                price=29.99,
                billing_cycle='monthly',
                duration_days=30,
                max_products=500,
                features=['All features', 'Priority support', 'API access']
            ),
        ]
        print(f"✓ Created {len(subscriptions)} subscriptions")
        
        # Create sample customers
        customers = [
            Customer.objects.create(
                first_name='Alice',
                last_name='Smith',
                email='alice@example.com',
                phone='+12025551111',
                address='123 Main St',
                city='New York',
                state='NY',
                postal_code='10001',
                country='USA',
                subscription=subscriptions[0],
                status='active',
                is_verified=True
            ),
            Customer.objects.create(
                first_name='Bob',
                last_name='Johnson',
                email='bob@example.com',
                phone='+12025552222',
                address='456 Oak Ave',
                city='Los Angeles',
                state='CA',
                postal_code='90001',
                country='USA',
                subscription=subscriptions[1],
                status='active',
                is_verified=True
            ),
        ]
        print(f"✓ Created {len(customers)} customers")
        
        # Create sample products
        products = [
            Product.objects.create(
                name='Laptop',
                description='High-performance laptop',
                category=categories[0],
                price=999.99,
                cost=800.00,
                quantity_in_stock=50,
                sku='LAP-001',
                status='active',
                is_featured=True,
                rating=4.5,
                created_by=admin
            ),
            Product.objects.create(
                name='T-Shirt',
                description='Comfortable cotton t-shirt',
                category=categories[1],
                price=29.99,
                cost=15.00,
                quantity_in_stock=200,
                sku='TSH-001',
                status='active',
                is_featured=False,
                rating=4.0,
                created_by=admin
            ),
            Product.objects.create(
                name='Python Guide',
                description='Complete guide to Python programming',
                category=categories[2],
                price=39.99,
                cost=20.00,
                quantity_in_stock=100,
                sku='BK-001',
                status='active',
                is_featured=True,
                rating=4.8,
                created_by=admin
            ),
        ]
        print(f"✓ Created {len(products)} products")
        print("\n✓ Sample data seeded successfully!")
    
    @staticmethod
    def drop_tables():
        """Drop all tables (WARNING: This will delete all data)"""
        response = input("WARNING: This will delete all data. Are you sure? (yes/no): ")
        if response.lower() == 'yes':
            execute_from_command_line(['manage.py', 'migrate', 'api', 'zero'])
            print("✓ Tables dropped successfully!")
        else:
            print("Operation cancelled.")


def main():
    """Main menu for database operations"""
    print("\n" + "="*50)
    print("   DATABASE MANAGEMENT TOOL")
    print("="*50)
    print("\nOptions:")
    print("1. Create database tables")
    print("2. Seed sample data")
    print("3. Drop all tables (WARNING)")
    print("4. Show statistics")
    print("5. Exit")
    print("\n" + "-"*50)
    
    choice = input("Enter your choice (1-5): ").strip()
    
    if choice == '1':
        DatabaseManager.create_database()
    elif choice == '2':
        DatabaseManager.seed_sample_data()
    elif choice == '3':
        DatabaseManager.drop_tables()
    elif choice == '4':
        print("\nDatabase Statistics:")
        print(f"Admins: {Admin.objects.count()}")
        print(f"Categories: {Category.objects.count()}")
        print(f"Subscriptions: {Subscription.objects.count()}")
        print(f"Customers: {Customer.objects.count()}")
        print(f"Products: {Product.objects.count()}")
    elif choice == '5':
        print("Exiting...")
        return
    else:
        print("Invalid choice!")
    
    # Ask if user wants to continue
    again = input("\nDo you want to perform another operation? (yes/no): ").strip()
    if again.lower() == 'yes':
        main()


if __name__ == '__main__':
    main()
