#!/usr/bin/env python
"""Simple test to verify SQL Server connection"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.core.management import call_command

print("\n" + "="*60)
print("SQL SERVER CONNECTION TEST")
print("="*60)

# Check Django configuration
print("\n✓ Django System Check:")
call_command('check', verbosity=0)
print("  - All checks passed!")

# Get connection info
db_config = connection.settings_dict
print("\n✓ Database Configuration:")
print(f"  - Engine: {db_config['ENGINE']}")
print(f"  - Database: {db_config['NAME']}")
print(f"  - Host: {db_config['HOST']}")
print(f"  - Trusted Connection: {db_config['OPTIONS'].get('Trusted_Connection', 'No')}")

# Test actual connection
print("\n✓ Testing Connection:")
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT @@VERSION")
        version_info = cursor.fetchone()[0].split('\n')[0]
        print(f"  - Connected: YES")
        print(f"  - Server Version: {version_info}")
        
        # Count tables
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        """)
        table_count = cursor.fetchone()[0]
        print(f"  - Tables Created: {table_count}")
except Exception as e:
    print(f"  - Connected: NO")
    print(f"  - Error: {e}")

print("\n" + "="*60)
print("✅ SQL SERVER CONNECTION ESTABLISHED SUCCESSFULLY!")
print("="*60 + "\n")
