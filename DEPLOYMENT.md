# 🚀 Deployment Guide - Buenos Días Huevos

Complete guide to deploy the egg production tracking system to production.

---

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Supabase account ([supabase.com](https://supabase.com))
- Vercel account ([vercel.com](https://vercel.com))
- Git installed

---

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Enter project details:
   - **Name**: buenos-dias-huevos
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for project creation (~2 minutes)

### 1.2 Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
4. Paste and click **Run**
5. Verify success (should see "Success. No rows returned")

### 1.3 Create Test Users

```sql
-- Run in SQL Editor

-- Create admin user (replace with your email)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@huevos.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","role":"admin"}',
  '',
  '',
  '',
  ''
);

-- Get the user ID from above insert
-- Then create profile
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, 'admin@huevos.com', 'Admin User', 'admin'
FROM auth.users WHERE email = 'admin@huevos.com';

-- Repeat for worker users
```

**Easier Alternative**: Use Supabase Auth UI

1. Go to **Authentication > Users**
2. Click "Invite User"
3. Enter email
4. After user signs up, update their profile:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'admin@huevos.com';
```

### 1.4 Get API Credentials

1. Go to **Settings > API**
2. Copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key
3. Save these for Step 3

---

## 📦 Step 2: Configure Local Environment

### 2.1 Clone Repository

```bash
git clone <repository-url>
cd buenos-dias-huevos
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Buenos Días Huevos
```

### 2.4 Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` and test:
- ✓ Login with test admin user
- ✓ Submit production record as worker
- ✓ View admin dashboard
- ✓ Test offline mode (toggle DevTools Network to "Offline")

---

## ☁️ Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Link Project

```bash
vercel link
```

Follow prompts:
- **Set up and deploy?** Yes
- **Scope**: Your account
- **Link to existing project?** No
- **Project name**: buenos-dias-huevos
- **Directory**: `./`
- **Override settings?** No

### 3.3 Add Environment Variables

```bash
# Add Supabase URL
vercel env add VITE_SUPABASE_URL production
# Paste your URL when prompted

# Add Supabase Key
vercel env add VITE_SUPABASE_ANON_KEY production
# Paste your anon key when prompted

# Add app version
vercel env add VITE_APP_VERSION production
# Enter: 1.0.0
```

### 3.4 Deploy to Production

```bash
# Deploy
vercel --prod
```

Wait ~2 minutes. You'll get a URL like:
```
https://buenos-dias-huevos.vercel.app
```

### 3.5 Configure Custom Domain (Optional)

1. Go to Vercel Dashboard > Project > Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## 🔒 Step 4: Secure Production Environment

### 4.1 Update Supabase Site URL

1. Go to Supabase Dashboard > **Authentication > URL Configuration**
2. Set **Site URL** to your Vercel URL:
   ```
   https://buenos-dias-huevos.vercel.app
   ```
3. Add **Redirect URLs**:
   ```
   https://buenos-dias-huevos.vercel.app/**
   ```

### 4.2 Enable Row Level Security (Already Done)

Verify RLS is enabled:

```sql
-- Run in SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

### 4.3 Disable Public Registration (Important!)

To prevent unauthorized user creation:

1. Go to **Authentication > Providers**
2. Disable "Email" provider's "Enable Email Signup"
3. Users can only be created by admin via dashboard

**Alternative**: Keep enabled but add approval workflow.

---

## 📱 Step 5: Configure PWA

### 5.1 Generate Icons

Create icons using a tool like [RealFaviconGenerator](https://realfavicongenerator.net/):

- 192x192px PNG
- 512x512px PNG
- favicon.ico

Save to `public/`:
```
public/
├── icon-192.png
├── icon-512.png
└── favicon.ico
```

### 5.2 Test PWA Installation

On mobile device:
1. Visit your Vercel URL
2. Tap "Add to Home Screen" (iOS) or "Install" (Android)
3. Open app from home screen
4. Test offline mode

---

## 🔄 Step 6: Setup CI/CD (Optional)

### 6.1 Enable Auto-Deploy from Git

1. Go to Vercel Dashboard > Project > Settings > Git
2. Connect GitHub/GitLab repository
3. Configure:
   - **Production Branch**: `main`
   - **Auto-deploy**: Enabled

Now every push to `main` auto-deploys!

### 6.2 Setup Preview Deployments

Every PR gets a preview URL automatically.

---

## 🧪 Step 7: Testing Checklist

Before going live:

### Authentication
- [ ] Admin can login
- [ ] Worker can login
- [ ] Wrong credentials show error
- [ ] Logout works
- [ ] Session persists on refresh

### Worker Flow
- [ ] Can select barn
- [ ] Can enter egg counts
- [ ] Validation works (negative numbers rejected)
- [ ] Submission succeeds
- [ ] Duplicate submission same day prevented
- [ ] Form resets after submit

### Offline Mode
- [ ] Record saves offline
- [ ] Status indicator shows "offline"
- [ ] Pending count increments
- [ ] Auto-syncs when back online
- [ ] Pending count decrements after sync

### Admin Dashboard
- [ ] Can view all records
- [ ] Filters work (date, barn)
- [ ] Charts display correctly
- [ ] Export CSV works
- [ ] Data is accurate

### Performance
- [ ] Initial load < 3 seconds
- [ ] Form submission < 100ms (when online)
- [ ] No console errors
- [ ] Works on mobile (iPhone, Android)

---

## 📊 Step 8: Monitoring & Analytics

### 8.1 Vercel Analytics (Free)

Automatically enabled! View in Vercel Dashboard > Analytics.

### 8.2 Supabase Monitoring

- Go to **Database > Performance**
- Check query performance
- Monitor active connections

### 8.3 Error Tracking (Optional)

Add Sentry:

```bash
npm install @sentry/react
```

Update `src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

---

## 🛠️ Maintenance Tasks

### Update Dependencies

```bash
npm update
npm audit fix
```

### Backup Database

1. Supabase Dashboard > Database > Backups
2. Enable daily backups (Settings > Backups)
3. Download manual backup:
   ```bash
   supabase db dump > backup.sql
   ```

### Monitor Logs

**Vercel Logs**:
```bash
vercel logs buenos-dias-huevos --prod
```

**Supabase Logs**:
- Dashboard > Logs > API Logs

---

## 🚨 Troubleshooting

### Issue: "Invalid JWT" Error

**Solution**:
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check Supabase project URL matches
- Clear browser cache/storage

### Issue: RLS Prevents Data Access

**Solution**:
```sql
-- Check user role
SELECT * FROM public.profiles WHERE email = 'user@example.com';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'production_records';
```

### Issue: PWA Not Installing

**Solution**:
- Must be served over HTTPS (Vercel does this)
- Check browser console for service worker errors
- Verify manifest.json is accessible

### Issue: Offline Sync Not Working

**Solution**:
- Check browser console for IndexedDB errors
- Clear IndexedDB: DevTools > Application > IndexedDB > Delete
- Verify service worker is registered

---

## 📞 Support

- **Documentation**: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- **Issues**: GitHub Issues
- **Email**: your-support@email.com

---

## 🎉 Going Live Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Test users created
- [ ] Vercel deployed successfully
- [ ] PWA installable on mobile
- [ ] Offline mode working
- [ ] All tests passed
- [ ] Custom domain configured (if applicable)
- [ ] Backups enabled
- [ ] Monitoring setup
- [ ] Users trained on system
- [ ] Support contact shared

---

**Congratulations!** 🎊 Your egg production system is live!

Next steps: Train workers, monitor usage, gather feedback for v2.0.
