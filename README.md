# MilkMan (Django + React)

Monorepo layout:

- `DjangoProject/`: Django REST backend (SQL Server via ODBC)
- `frontend/`: React frontend (CRA)

## Backend (Windows, PowerShell)

```powershell
cd MilkMan\DjangoProject
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt

# Create a .env based on .env.example
copy .env.example .env

.\venv\Scripts\python manage.py migrate
.\venv\Scripts\python manage.py runserver 8001
```

## Frontend

```powershell
cd MilkMan\frontend
npm install

# Optional: configure API base URL
copy .env.example .env

npm start
```

Frontend defaults to calling `http://localhost:8001/api` unless `REACT_APP_API_BASE_URL` is set.

## Production notes

For hosted deployment, set these backend environment variables correctly:

- `DJANGO_ALLOWED_HOSTS`: your backend domain(s)
- `CORS_ALLOWED_ORIGINS`: your frontend domain(s)
- `CSRF_TRUSTED_ORIGINS`: your frontend domain(s)
- `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`
- `DEVELOPER_ALLOWED_IPS`: only the public IPs allowed to use the developer console
- `DEVELOPER_TRUST_X_FORWARDED_FOR=true` if your app runs behind a reverse proxy or platform load balancer

Important: admin applications are now approved/rejected only if the applicant email is sent successfully. If email sending fails, the status change is rolled back automatically.

## One-command dev start (Windows)

```powershell
# Starts backend + frontend (if not running) and opens the app
.\start-milkman.ps1

# Starts backend + frontend (if not running) and opens the Developer window
.\start-milkman.ps1 -Developer
```

## Bootstrap a developer super admin (first time)

If you don't have a `super_admin` yet, create one:

```powershell
cd DjangoProject
.\venv\Scripts\python manage.py bootstrap_super_admin --email you@example.com --phone 9876543210
```

Use the printed `Login ID (username)` + `Password` to login, then open the developer console.
