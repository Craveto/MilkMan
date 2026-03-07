# Monkey patch to fix SQL Server 2025 version detection issue
import sys

def patch_sql_server_version():
    """Patch mssql backend to handle SQL Server 2025 version detection"""
    
    # Try patching mssql-django backend
    try:
        from mssql.base import DatabaseWrapper
        
        # Store original property if it exists
        original_sql_server_version = None
        if hasattr(DatabaseWrapper, 'sql_server_version'):
            try:
                original_sql_server_version = DatabaseWrapper.sql_server_version
            except:
                pass
        
        def get_sql_server_version_fixed(self):
            """Fixed version retrieval that handles SQL Server 2025"""
            # Try to get from instance cache first
            cache_attr = '_sql_server_version_cache'
            if hasattr(self, cache_attr):
                return getattr(self, cache_attr)
            
            try:
                # Get version from server
                with self.temporary_connection() as cursor:
                    cursor.execute("SELECT SERVERPROPERTY('ProductVersion')")
                    val = cursor.fetchone()[0]
                    ver = int(val.split('.')[0])
                    
                    # Map internal version numbers to product versions
                    version_map = {
                        17: 2025,  # SQL Server 2025
                        16: 2022,  # SQL Server 2022
                        15: 2019,  # SQL Server 2019
                        14: 2017,  # SQL Server 2017
                        13: 2016,  # SQL Server 2016
                        12: 2014,  # SQL Server 2014
                        11: 2012,  # SQL Server 2012
                        10: 2008,  # SQL Server 2008 R2
                    }
                    
                    # Get mapped version or use original
                    ver = version_map.get(ver, ver)
                    
                    if ver < 2008:
                        from django.db.utils import NotSupportedError
                        raise NotSupportedError('SQL Server v%d is not supported.' % ver)
                    
                    # Cache the result
                    setattr(self, cache_attr, ver)
                    return ver
            except Exception as e:
                # If patching fails, return a safe default
                print(f"Warning: Could not retrieve SQL Server version: {e}", file=sys.stderr)
                return 2019  # Default to 2019
        
        # Override the method/property safely
        try:
            if hasattr(DatabaseWrapper, 'sql_server_version'):
                delattr(DatabaseWrapper, 'sql_server_version')
        except:
            pass
        
        DatabaseWrapper.sql_server_version = property(get_sql_server_version_fixed)
        print(f"✓ Successfully patched mssql backend for SQL Server 2025", file=sys.stderr)
        
    except Exception as e:
        print(f"Info: Could not patch mssql backend: {e}", file=sys.stderr)
