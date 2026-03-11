# MilkMan 

#Overview : 
-It includes three frontends 
 1) User
 2) Admin - working for list the items , sale the product to customer 
 3) Super Admin - for admin authentication

I know the UI is not that attractive , I'm working on it . Primerily I have worked with functionlaties and woriking modules . 
- Subscription Model
- Admin Authentication only By superAdmin that is developer for user it is normal usual login signup model .
- All the data is stored in supabase .
- API's are working
- Delevery options like schedule , user can see item updates .


<img width="1884" height="785" alt="image" src="https://github.com/user-attachments/assets/8d68a171-5c68-4368-b967-15dde9fd216f" />


#Below is the configuration details , and how you can run this project on your machines . 
MilkMan is a Django + React monorepo with:

- `backend/`: Django REST API
- `frontend/`: React frontend



The project now supports both:

- local development with your current SQL Server setup
- hosted deployment with `Vercel + Render + Supabase Postgres`

## Local development

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.\venv\Scripts\python manage.py migrate
.\venv\Scripts\python manage.py runserver 8001
```

Local behavior:

- if `DATABASE_URL` is empty, Django uses the SQL Server settings from `.env`
- if `DATABASE_URL` is set, Django uses Postgres instead

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm start
```

Ports:

- normal site: `http://localhost:3000`
- developer window: `http://localhost:3001`
- backend API: `http://localhost:8001`

### One-command local start

```powershell
.\start-milkman.ps1
.\start-milkman.ps1 -Developer
```

## Hosting target

Recommended stack:

- frontend: `Vercel`
- backend: `Render`
- database: `Supabase Postgres`
- email: `Brevo SMTP`

## Supabase setup

1. Create a Supabase project.
2. Open `Project Settings -> Database`.
3. Copy the Postgres connection string.
4. Put it into Render as `DATABASE_URL`.

Use the pooled connection string first for easier hosting.

## Render backend deployment

This repo includes [render.yaml](/e:/Bizmetric/Trae/MilkMan/render.yaml).

Render notes:

- root directory: `backend`
- dependency file for Render: `requirements.render.txt`
- start command uses `gunicorn`
- static files use `WhiteNoise`

Required Render environment variables:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=false`
- `DJANGO_ALLOWED_HOSTS`
- `DATABASE_URL`
- `DATABASE_SSL_REQUIRE=true`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `DEFAULT_FROM_EMAIL`
- `EMAIL_BACKEND`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USE_TLS`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEVELOPER_ALLOWED_IPS`
- `DEVELOPER_TRUST_X_FORWARDED_FOR=true`
- `DEVELOPER_EMAILS`

Important cookie/session values for split frontend/backend hosting:

- `SESSION_COOKIE_SECURE=true`
- `CSRF_COOKIE_SECURE=true`
- `SESSION_COOKIE_SAMESITE=None`
- `CSRF_COOKIE_SAMESITE=None`

Minimum Render host fix for this deployment:

- `DJANGO_ALLOWED_HOSTS=milkman-02fj.onrender.com`
- `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`
- `CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app`

## Vercel frontend deployment

This repo includes [frontend/vercel.json](/e:/Bizmetric/Trae/MilkMan/frontend/vercel.json) for SPA routing.

Deploy with:

- framework: Create React App
- root directory: `frontend`
- build command: `npm run build`
- output directory: `build`

Required Vercel environment variable:

- `REACT_APP_API_BASE_URL=https://your-render-service.onrender.com/api`

For the current Render service, use:

- `REACT_APP_API_BASE_URL=https://milkman-02fj.onrender.com/api`

## Migration path from current local setup

### Fastest safe path

1. Keep local SQL Server for now.
2. Deploy a fresh Supabase Postgres database for hosting.
3. Run Django migrations on Supabase from Render.
4. Test hosted flows.
5. If needed later, migrate old SQL Server data into Supabase.

If your current local data is not important, starting fresh on Supabase is the least risky option.

## First-time super admin

```powershell
cd backend
.\venv\Scripts\python manage.py bootstrap_super_admin --email you@example.com --phone 9876543210
```

## Important production behavior already implemented

- developer window auth is isolated from the normal site
- admin approval/rejection emails rollback if applicant email fails
- approved admins must change their temporary password on first login
- developer console access is controlled by IP/token rules

## Deployment checklist

1. Create Supabase project.
2. Deploy backend on Render.
3. Add all backend env vars on Render.
4. Deploy frontend on Vercel.
5. Set `REACT_APP_API_BASE_URL` on Vercel.
6. Add your Vercel domain to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`.
7. Configure Brevo SMTP on Render.
8. Test:
   - user login
   - admin login
   - developer login
   - admin approval email
   - admin rejection email
   - forced password change
   - admin edit/update
