import pyodbc
conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=CRAVETO;Trusted_Connection=yes;')
cursor = conn.cursor()
cursor.execute("SELECT SERVERPROPERTY('ProductVersion')")
print('Product Version:', cursor.fetchone()[0])
cursor.execute("SELECT SERVERPROPERTY('ProductMajorVersion')")
print('Major Version:', cursor.fetchone()[0])
cursor.execute("SELECT SERVERPROPERTY('SqlServerMajorVersion')")
print('SQL Server Major Version:', cursor.fetchone()[0])
