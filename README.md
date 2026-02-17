# 🥚 Buenos Días Huevos

**Mobile-first egg production tracking system for rural poultry workers**

A production-ready MVP built with React, TypeScript, Supabase, and Tailwind CSS. Features offline support, real-time sync, and admin analytics.

---

## ✨ Features

### For Workers 👷
- ✅ **One-tap barn selection** (A or B)
- ✅ **Simple egg count entry** (A, AA, B, EXTRA, JUMBO)
- ✅ **Offline-first** - Save records without internet
- ✅ **Auto-sync** - Uploads when connection restored
- ✅ **Duplicate prevention** - Can't submit twice per day per barn
- ✅ **Mobile optimized** - Large buttons, minimal typing

### For Admins 📊
- ✅ **Dashboard overview** - Total eggs, records, averages
- ✅ **Filter by date/barn/worker**
- ✅ **Visual charts** - Daily production trends
- ✅ **Export to CSV** - Download reports
- ✅ **Real-time data** - See submissions as they happen

### Technical 🛠️
- ✅ **PWA** - Installable on mobile home screen
- ✅ **Offline sync** via IndexedDB
- ✅ **Row-Level Security** - Database-enforced permissions
- ✅ **Type-safe** - Full TypeScript coverage
- ✅ **Responsive** - Works on all devices
- ✅ **Fast** - <3s load, <100ms interactions

---

## 🏗️ Architecture

```
Frontend:  React 18 + TypeScript + Vite + Tailwind CSS
State:     Zustand + React Query
Backend:   Supabase (PostgreSQL + Auth + RLS)
Offline:   IndexedDB + Service Worker
Deploy:    Vercel (Frontend) + Supabase Cloud (Backend)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design decisions.

---

## 📁 Project Structure

```
buenos-dias-huevos/
├── src/
│   ├── features/              # Feature modules
│   │   ├── auth/              # Authentication
│   │   ├── production/        # Production entry (workers)
│   │   └── admin/             # Dashboard (admins)
│   ├── shared/                # Shared code
│   │   ├── components/        # UI components (Button, Input, Card)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # Business logic (offline sync)
│   │   ├── stores/            # Zustand state (auth, sync)
│   │   └── utils/             # Utilities (validation, formatting)
│   ├── lib/                   # Third-party config
│   │   ├── supabase.ts        # Supabase client
│   │   └── queryClient.ts     # React Query client
│   ├── pages/                 # Page components
│   ├── App.tsx                # Root component + routing
│   └── main.tsx               # Entry point
├── supabase/
│   └── migrations/            # Database migrations
│       ├── 001_initial_schema.sql
│       └── 002_multi_farm_migration.sql (future)
├── public/                    # Static assets
├── ARCHITECTURE.md            # System design doc
├── DEPLOYMENT.md              # Deployment guide
└── package.json               # Dependencies
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account
- Vercel account (for deployment)

### 1. Clone & Install

```bash
git clone <repository-url>
cd buenos-dias-huevos
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_VERSION=1.0.0
```

### 3. Setup Database

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run `supabase/migrations/001_initial_schema.sql`
4. Create test users (see [DEPLOYMENT.md](DEPLOYMENT.md#13-create-test-users))

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

**Test accounts**:
- Admin: `admin@huevos.com` / `admin123`
- Worker: `worker@huevos.com` / `worker123`

---

## 📱 Testing PWA & Offline Mode

### Test Offline Functionality

1. Open DevTools > Network tab
2. Set throttling to "Offline"
3. Try submitting a production record
4. See "Guardado offline" toast
5. Go back online
6. Watch record auto-sync

### Install PWA on Mobile

1. Open app on mobile browser
2. iOS: Share → Add to Home Screen
3. Android: Menu → Install App
4. Open from home screen
5. Works like native app!

---

## 🗄️ Database Schema

### Tables

**profiles** - User information
```sql
- id (UUID, PK)
- email (TEXT)
- full_name (TEXT)
- role (admin | worker)
```

**production_records** - Daily egg counts
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- barn (A | B)
- a, aa, b, extra, jumbo (INTEGER)
- total (INTEGER, computed)
- synced (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

### Security (RLS Policies)

- ✅ Workers: INSERT own records, SELECT own records
- ✅ Admins: SELECT all, UPDATE all, DELETE all
- ✅ Database-enforced (can't bypass via API)

---

## 🎨 UI/UX Design Principles

### Mobile-First
- **Touch targets**: 44px minimum (Apple HIG standard)
- **Font size**: 16px base (prevents iOS zoom on focus)
- **One-screen workflow**: No complex navigation
- **Large buttons**: Easy to tap with gloves

### Accessibility
- **High contrast**: WCAG AA compliant colors
- **Clear labels**: Spanish language, simple terms
- **Error messages**: Specific, actionable
- **Loading states**: Always show feedback

### Performance
- **Code splitting**: By feature, lazy-loaded
- **Image optimization**: WebP + compression
- **Caching**: React Query + Service Worker
- **Bundle size**: <500KB gzipped

---

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run format           # Prettier formatting

# Testing
npm run test             # Run unit tests
npm run test:ui          # Test UI (Vitest)
```

---

## 📦 Dependencies

### Core
- `react` - UI library
- `react-router-dom` - Routing
- `@supabase/supabase-js` - Database client
- `@tanstack/react-query` - Server state management
- `zustand` - Client state management

### UI
- `tailwindcss` - Styling
- `react-toastify` - Notifications
- `chart.js` + `react-chartjs-2` - Charts

### Utilities
- `date-fns` - Date formatting
- `idb` - IndexedDB wrapper
- `clsx` + `tailwind-merge` - Class names

### Dev Tools
- `vite` - Build tool
- `typescript` - Type safety
- `vite-plugin-pwa` - PWA support
- `vitest` - Testing

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide.

**Quick Deploy**:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🔮 Roadmap

### Phase 1: MVP (Current) ✅
- ✅ Worker production entry
- ✅ Admin dashboard
- ✅ Offline support
- ✅ PWA installation

### Phase 2: Multi-Farm (Q2 2026)
- Multiple farms support
- Dynamic barn creation
- Farm-scoped access control
- Migration script ready ([`002_multi_farm_migration.sql`](supabase/migrations/002_multi_farm_migration.sql))

### Phase 3: Advanced (Q3 2026)
- Inventory management
- Predictive analytics (ML)
- WhatsApp notifications
- Mortality tracking
- Quality control (photo uploads)

### Phase 4: Enterprise (Q4 2026)
- Multi-tenancy
- Custom dashboards
- React Native mobile app
- REST + GraphQL API

---

## 🤝 Contributing

### Code Standards

- Use TypeScript strict mode
- Follow ESLint rules
- Write tests for new features
- Update documentation

### Git Workflow

```bash
main           # Production branch
├── develop    # Staging branch
└── feature/x  # Feature branches
```

### Commit Convention

```
feat: Add offline sync for production records
fix: Prevent duplicate submissions on slow networks
docs: Update deployment guide
chore: Update dependencies
```

---

## 🐛 Troubleshooting

### Common Issues

**"IMMUTABLE function" error during database migration**
- This has been fixed in the migration file
- The migration now creates a custom immutable function for date indexing
- Simply re-run the migration from the updated file
- See [DATABASE_FIX.md](DATABASE_FIX.md) for technical details

**"Invalid JWT" error**
- Verify Supabase URL and key in `.env.local`
- Check browser console for detailed error
- Clear localStorage and refresh

**Records not syncing**
- Check browser console for errors
- Verify internet connection
- Check Supabase RLS policies

**PWA not installing**
- Must be served over HTTPS (Vercel provides this)
- Check service worker registration in DevTools
- Verify manifest.json is accessible

See [DEPLOYMENT.md - Troubleshooting](DEPLOYMENT.md#-troubleshooting) for more.

---

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design & decisions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [supabase/migrations/](supabase/migrations/) - Database schema

---

## 📄 License

MIT License - See LICENSE file for details

---

## 📞 Support

- **Email**: support@example.com
- **Issues**: [GitHub Issues](https://github.com/xxx/issues)
- **Docs**: [Full documentation](https://docs.example.com)

---

## 🙏 Acknowledgments

Built with ❤️ for rural poultry workers.

**Technologies**:
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

**Made with 🥚 by a Senior Full-Stack Engineer**

*Version 1.0.0 - Production Ready*
