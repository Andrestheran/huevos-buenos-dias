# ⚡ Quick Start Guide

Get Buenos Días Huevos running in **under 10 minutes**.

---

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Supabase account ([Sign up free](https://supabase.com))
- [ ] Git installed

---

## Step 1: Clone & Install (2 min)

```bash
# Clone repository
git clone <repository-url>
cd buenos-dias-huevos

# Install dependencies
npm install
```

---

## Step 2: Create Supabase Project (3 min)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `buenos-dias-huevos`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Click **"Create new project"**
5. Wait ~2 minutes for setup to complete

---

## Step 3: Setup Database (2 min)

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open `supabase/migrations/001_initial_schema.sql` from this project
4. Copy entire contents
5. Paste into SQL Editor
6. Click **"Run"**
7. ✅ Should see: "Success. No rows returned"

> **Note**: If you previously got an "IMMUTABLE function" error, it's already fixed in the migration file. The fix creates a custom immutable function for the date index. See [DATABASE_FIX.md](DATABASE_FIX.md) for details.

---

## Step 4: Get API Credentials (1 min)

1. In Supabase Dashboard, go to **Settings** > **API**
2. Copy two values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API keys")

---

## Step 5: Configure Environment (1 min)

```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local with your credentials
# (Use nano, vim, or your code editor)
nano .env.local
```

Paste your credentials:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_VERSION=1.0.0
```

Save and close (`Ctrl+X`, then `Y`, then `Enter` in nano)

---

## Step 6: Create Test Users (2 min)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** > **Users**
2. Click **"Add user"** dropdown > **"Create new user"**
3. Create admin:
   - Email: `admin@test.com`
   - Password: `admin123`
   - **Confirm password**
4. Repeat for worker:
   - Email: `worker@test.com`
   - Password: `worker123`

5. Update profiles in **SQL Editor**:
```sql
-- Set admin role
UPDATE public.profiles
SET role = 'admin', full_name = 'Admin User'te
WHERE email = 'admin@test.com';

-- Set worker role
UPDATE public.profiles
SET role = 'worker', full_name = 'Worker User'
WHERE email = 'worker@test.com';
```

### Option B: Via SQL (Faster)

Run this in SQL Editor:
```sql
-- Create admin
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'admin@test.com',
  crypt('admin123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}'
);

-- Create admin profile
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'::user_role
FROM auth.users WHERE email = 'admin@test.com';

-- Repeat for worker
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'worker@test.com',
  crypt('worker123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Worker User"}'
);

INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Worker User', 'worker'::user_role
FROM auth.users WHERE email = 'worker@test.com';
```

---

## Step 7: Run Development Server (1 min)

```bash
npm run dev
```

Output should show:
```
  VITE v5.1.3  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

---

## Step 8: Test the App (5 min)

### Test Worker Flow

1. Open browser to `http://localhost:5173`
2. Login with:
   - Email: `worker@test.com`
   - Password: `worker123`
3. You should see the production form
4. Fill it out:
   - Select barn: **A**
   - Enter egg counts:
     - A: 100
     - AA: 150
     - B: 80
     - EXTRA: 50
     - JUMBO: 20
   - See total: **400**
5. Click **"Registrar Producción"**
6. ✅ Should see: "Producción registrada exitosamente ✓"

### Test Admin Dashboard

1. Logout (top right)
2. Login with:
   - Email: `admin@test.com`
   - Password: `admin123`
3. You should see the admin dashboard
4. Verify:
   - ✅ Stats cards show totals
   - ✅ Chart displays production
   - ✅ Table shows your submitted record
   - ✅ Can filter by date/barn
   - ✅ Can export to CSV

### Test Offline Mode

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Change throttling dropdown to **"Offline"**
4. Try submitting another production record
5. ✅ Should see: "Guardado offline. Se sincronizará automáticamente"
6. Check footer: Shows "Sin conexión" + "1 pendiente"
7. Change throttling back to **"No throttling"**
8. ✅ Record should auto-sync (footer updates)

---

## 🎉 Success!

You now have a fully functional egg production system running locally!

---

## What's Next?

### Continue Development
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Deploy to Production
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide.

**Quick deploy**:
```bash
npm install -g vercel
vercel --prod
```

### Read Documentation
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Design decisions
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - What was built

---

## Troubleshooting

### "Invalid API key" error
- Double-check `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Make sure you copied the **anon public** key, not service_role

### Can't login
- Verify users were created in Supabase Dashboard > Authentication > Users
- Check profiles table has correct roles:
  ```sql
  SELECT * FROM public.profiles;
  ```

### "No PostgreSQL clusters available"
- Supabase project still initializing
- Wait 1-2 more minutes and refresh

### Port 5173 already in use
```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

---

## Need Help?

1. Check console for errors (`F12` in browser)
2. Check terminal for server errors
3. Review [DEPLOYMENT.md - Troubleshooting](DEPLOYMENT.md#-troubleshooting)
4. Open GitHub Issue

---

**Estimated Total Time**: 8-10 minutes ⏱️

*Last updated: February 2026*
