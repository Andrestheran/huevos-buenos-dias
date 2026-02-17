# 🏗️ System Architecture - Buenos Días Huevos

## Overview

A mobile-first, offline-capable egg production tracking system for rural poultry workers with admin oversight capabilities.

---

## 🎯 Design Philosophy

### Core Principles

1. **Mobile-First**: Designed for touch interfaces, large tap targets (min 44x44px)
2. **Offline-First**: Workers can submit data without connectivity
3. **Zero Cognitive Load**: Single-screen workflows, minimal decisions
4. **Performance**: <3s initial load, <100ms interactions
5. **Scalability**: Modular architecture for future extensions

### UX Strategy

- **Workers**: One-tap barn selection → Number inputs → Submit
- **Admin**: Dashboard with instant filters, visual summaries, export
- **Feedback**: Toast notifications, loading states, sync indicators

---

## 🛠️ Technology Stack

### Frontend
```
React 18.3+          → Component architecture
TypeScript 5+        → Type safety
Vite 5+              → Fast builds, HMR
Tailwind CSS 3+      → Utility-first styling
Zustand 4+           → Lightweight state management
React Query 5+       → Server state, caching
Chart.js 4+          → Data visualization
Workbox              → Service worker/PWA
```

### Backend
```
Supabase PostgreSQL  → Relational database
Supabase Auth        → JWT-based authentication
Row Level Security   → Database-level permissions
Supabase Realtime    → Optional live updates (future)
```

### Deployment
```
Vercel               → Frontend hosting, edge functions
Supabase Cloud       → Managed PostgreSQL + Auth
```

---

## 📊 Database Design

### Schema Overview

```sql
┌─────────────┐         ┌──────────────────────┐
│   auth.users│◄────────┤  production_records  │
│  (Supabase) │         │                      │
└─────────────┘         │  - barn (enum)       │
                        │  - egg_types (jsonb) │
                        │  - created_at        │
                        │  - synced (bool)     │
                        └──────────────────────┘
```

### Key Design Decisions

#### 1. Egg Types Storage Strategy
**Decision**: JSONB column vs. separate columns

**Chosen**: **Separate columns** (`a`, `aa`, `b`, `extra`, `jumbo`)

**Rationale**:
- ✅ Type safety in queries
- ✅ Simple aggregations (`SUM(a)`, `AVG(aa)`)
- ✅ Indexable for performance
- ✅ Clear schema for new developers
- ❌ JSONB would be flexible but harder to query/aggregate

#### 2. Barn Storage
**Decision**: Enum vs. Foreign Key table

**Chosen**: **PostgreSQL ENUM** for MVP, migration path to FK

**Rationale**:
- MVP: Only 2 barns (A, B) → Enum is simple
- Future: Migrate to `barns` table when scaling to multiple farms
- Migration script provided in [SCALING.md](SCALING.md)

#### 3. Duplicate Prevention Strategy
**Decision**: How to prevent double-entry per day

**Chosen**: **Unique constraint** on `(user_id, barn, DATE(created_at))`

**Rationale**:
- Database-enforced (foolproof)
- Prevents race conditions
- Clear error message for UI

#### 4. Offline Sync Approach
**Decision**: How to handle offline records

**Chosen**: **UUID primary keys** + `synced` boolean flag

**Rationale**:
- Client generates UUIDs offline
- `synced` flag tracks upload status
- No conflicts when syncing multiple devices
- IndexedDB mirrors PostgreSQL structure

---

## 🗂️ Folder Structure

```
src/
├── features/              # Feature-based modules
│   ├── auth/
│   │   ├── components/    # Login, AuthGuard
│   │   ├── hooks/         # useAuth, useSession
│   │   └── services/      # authService.ts
│   ├── production/
│   │   ├── components/    # ProductionForm, RecordCard
│   │   ├── hooks/         # useProductionMutation
│   │   ├── services/      # productionService.ts
│   │   └── types/         # ProductionRecord types
│   └── admin/
│       ├── components/    # Dashboard, Filters, Charts
│       ├── hooks/         # useProductionStats
│       └── services/      # exportService.ts
├── shared/
│   ├── components/        # Button, Input, Card, Toast
│   ├── hooks/             # useOfflineSync, useToast
│   ├── services/          # supabaseClient, syncService
│   ├── stores/            # authStore, syncStore (Zustand)
│   └── utils/             # date formatters, validators
├── lib/                   # Third-party configs
│   ├── supabase.ts
│   └── queryClient.ts
└── App.tsx                # Root router
```

### Why Feature-Based?

- **Scalability**: Add new features (inventory, alerts) without touching existing code
- **Co-location**: Related code lives together (easier to find)
- **Lazy Loading**: Code-split by feature (faster initial load)
- **Team Workflow**: Multiple devs can work on separate features

---

## 🔐 Security Model

### Row Level Security Policies

```sql
-- Workers: INSERT only their own records
CREATE POLICY "Workers can insert own records"
ON production_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND is_worker(auth.uid()));

-- Admin: SELECT all records
CREATE POLICY "Admin can view all records"
ON production_records FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Workers: SELECT only their own
CREATE POLICY "Workers can view own records"
ON production_records FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND is_worker(auth.uid()));
```

### Authentication Flow

```
1. User enters email/password
2. Supabase Auth validates credentials
3. JWT token issued (contains user_id, role in metadata)
4. Client stores token in localStorage
5. All API calls include JWT in Authorization header
6. RLS policies enforce permissions at DB level
```

### Why RLS?

- **Defense in Depth**: Security at database layer (can't be bypassed by compromised frontend)
- **Auditability**: All queries logged with user context
- **Compliance**: Meets data access control requirements

---

## 🔄 Offline Sync Architecture

### Flow Diagram

```
[Worker Device]                    [Supabase]
      │                                 │
   Submit ───► IndexedDB (pending)      │
      │              │                  │
      │         Network?                │
      │              │                  │
      │         ┌─── Yes ───► POST /api │
      │         │                   │   │
      │         │              Success  │
      │         │                   │   │
      │         └──► Mark synced ◄──┘   │
      │                                 │
   Offline ───► Queue in IndexedDB      │
      │                                 │
  Come online ──► Batch sync ──────────►│
```

### Implementation Details

**Storage**: IndexedDB via `idb` library (better than localStorage)

**Sync Logic**:
1. On submit: Save to IndexedDB with `synced: false`
2. Attempt immediate upload
3. If offline: Queue for later
4. Background sync every 30s when online
5. Mark records as `synced: true` on success

**Conflict Resolution**: Last-write-wins (acceptable for MVP)

**Future Enhancement**: Operational Transform (OT) for collaborative editing

---

## 🎨 UI/UX Design System

### Design Tokens

```typescript
// Tailwind config
const theme = {
  colors: {
    primary: '#F59E0B',    // Amber (warm, approachable)
    success: '#10B981',    // Green
    danger: '#EF4444',     // Red
    neutral: '#6B7280',    // Gray
  },
  spacing: {
    touch: '44px',         // Min touch target (Apple HIG)
  },
  fontSize: {
    base: '16px',          // Prevents iOS zoom on focus
    lg: '20px',            // Headings
    xl: '24px',            // Numbers
  },
}
```

### Component Patterns

**Worker Form**:
```
┌───────────────────────────────┐
│  🏠 Barn Selection            │ ← Large buttons
│  [ A ]  [ B ]                 │
│                               │
│  🥚 Egg Count                 │
│  A:     [____]                │ ← Number inputs
│  AA:    [____]                │   (type="number")
│  B:     [____]                │
│  EXTRA: [____]                │
│  JUMBO: [____]                │
│                               │
│  [  Submit Production  ]      │ ← 56px tall button
│                               │
│  📶 Synced ✓                  │ ← Status indicator
└───────────────────────────────┘
```

**Admin Dashboard**:
```
┌───────────────────────────────┐
│  📊 Production Dashboard      │
│                               │
│  [Filters] [Date Range] [CSV] │
│                               │
│  ┌─────────────────────────┐ │
│  │  Chart: Daily Totals     │ │
│  │                          │ │
│  │  [Line chart]            │ │
│  └─────────────────────────┘ │
│                               │
│  📋 Recent Records            │
│  ┌─────────────────────────┐ │
│  │ 2026-02-16 | Barn A      │ │
│  │ Worker: Juan | 1,250 🥚  │ │
│  └─────────────────────────┘ │
└───────────────────────────────┘
```

---

## 📈 Performance Strategy

### Optimization Techniques

1. **Code Splitting**
   ```typescript
   const AdminDashboard = lazy(() => import('./features/admin/Dashboard'));
   // Admin code not loaded for workers
   ```

2. **Query Optimization**
   - React Query caching (5min stale time)
   - Pagination (50 records/page)
   - Indexed database queries

3. **Asset Optimization**
   - Vite auto-splits vendor chunks
   - Tailwind CSS purging (only used classes)
   - Image optimization with `sharp`

4. **PWA Caching**
   ```javascript
   // Cache static assets
   workbox.precaching.precacheAndRoute([
     { url: '/index.html', revision: 'abc123' },
     { url: '/assets/main.js', revision: 'def456' },
   ]);

   // Runtime caching for API
   workbox.routing.registerRoute(
     /^https:\/\/.*\.supabase\.co/,
     new workbox.strategies.NetworkFirst({
       cacheName: 'api-cache',
       plugins: [
         new workbox.expiration.ExpirationPlugin({
           maxEntries: 50,
           maxAgeSeconds: 5 * 60, // 5 minutes
         }),
       ],
     })
   );
   ```

### Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| First Contentful Paint | <1.5s | TBD |
| Time to Interactive | <3s | TBD |
| Form submission | <100ms | TBD |
| Offline save | <50ms | TBD |

---

## 🚀 Scalability Path

### Phase 1: MVP (Current)
- 2 barns
- 5 egg types
- 2 roles
- Single farm

### Phase 2: Multi-Farm (Q2 2026)
**Changes Required**:
1. Add `farms` table with one-to-many relationship to `barns`
2. Add `farm_id` to production_records
3. Update RLS policies for farm-scoped access
4. Add farm selector in admin UI

**Migration Script** (see [migrations/002_multi_farm.sql](migrations/002_multi_farm.sql)):
```sql
-- Add farms table
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT
);

-- Migrate barns to table
CREATE TABLE barns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  name TEXT NOT NULL,
  capacity INTEGER
);

-- Migrate existing data
INSERT INTO farms (id, name) VALUES
  (gen_random_uuid(), 'Farm 1');

INSERT INTO barns (farm_id, name)
SELECT f.id, unnest(ARRAY['A', 'B'])
FROM farms f WHERE f.name = 'Farm 1';
```

### Phase 3: Advanced Features (Q3 2026)
- **Inventory Management**: Track feed, supplies
- **Predictive Analytics**: ML model for production forecasts
- **WhatsApp Notifications**: Daily summaries via Twilio
- **Mortality Tracking**: Record bird health issues
- **Quality Control**: Photo uploads for damaged eggs

### Phase 4: Enterprise (Q4 2026)
- **Multi-tenancy**: Separate data per organization
- **Advanced Reporting**: Custom dashboards, scheduled PDFs
- **Mobile App**: React Native version (shared codebase via Nx)
- **API for Integrations**: REST + GraphQL endpoints

---

## 🧪 Testing Strategy

### Test Coverage Goals

```
Unit Tests:         80% coverage
Integration Tests:  Critical paths (auth, submit, sync)
E2E Tests:          Happy paths (Playwright)
```

### Test Structure

```
src/
├── features/
│   └── production/
│       ├── __tests__/
│       │   ├── ProductionForm.test.tsx     # Component tests
│       │   ├── productionService.test.ts   # Service tests
│       │   └── useProductionMutation.test.ts # Hook tests
│       └── components/
│           └── ProductionForm.tsx
```

### Key Test Scenarios

1. **Auth**: Login/logout, role-based routing
2. **Production Form**: Validation, duplicate prevention, offline save
3. **Sync**: Queue management, retry logic, conflict resolution
4. **Admin**: Filtering, aggregations, export correctness
5. **PWA**: Service worker registration, cache updates

---

## 🔧 Development Workflow

### Local Setup

```bash
# 1. Clone and install
git clone <repo>
cd buenos-dias-huevos
npm install

# 2. Configure environment
cp .env.example .env.local
# Add Supabase URL and anon key

# 3. Run migrations
npm run db:migrate

# 4. Start dev server
npm run dev
# → http://localhost:5173
```

### Git Workflow

```
main          → Production (Vercel auto-deploy)
  └─ develop  → Staging
      └─ feature/xyz  → Feature branches
```

### Commit Convention

```
feat: Add offline sync for production records
fix: Prevent duplicate submissions on slow networks
chore: Update dependencies
docs: Add architecture decision records
```

---

## 📦 Deployment Strategy

### Vercel Setup

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Add environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# 4. Deploy
vercel --prod
```

### Environment Variables

```bash
# Frontend (.env.local)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_APP_VERSION=1.0.0

# Supabase (dashboard)
JWT_SECRET=xxx
SITE_URL=https://huevos.vercel.app
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🛡️ Error Handling

### Error Boundaries

```typescript
// Top-level error boundary
<ErrorBoundary
  fallback={<ErrorScreen />}
  onError={(error) => logToSentry(error)}
>
  <App />
</ErrorBoundary>
```

### Network Errors

```typescript
// Automatic retry with exponential backoff
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### User-Facing Messages

| Error Type | Message |
|------------|---------|
| Network offline | "Sin conexión. Los datos se guardarán automáticamente." |
| Duplicate entry | "Ya registraste la producción para este gallinero hoy." |
| Validation error | "Por favor ingresa un número válido." |
| Permission denied | "No tienes permiso para realizar esta acción." |

---

## 📖 Key Design Decisions

### 1. Why Zustand over Redux?

**Zustand**:
- ✅ 1KB vs 20KB (Redux Toolkit)
- ✅ Zero boilerplate
- ✅ No provider wrapping
- ✅ Perfect for simple auth/sync state

**When to switch**: If state becomes complex (>10 stores), consider Redux Toolkit

### 2. Why React Query over SWR?

**React Query**:
- ✅ More mature (v5 stable)
- ✅ Better devtools
- ✅ Built-in mutations
- ✅ Excellent TypeScript support

**Trade-off**: Slightly larger bundle (+5KB)

### 3. Why Vercel over Netlify/AWS?

**Vercel**:
- ✅ Zero-config for Vite
- ✅ Edge functions (future use)
- ✅ Best DX for frontends
- ✅ Free tier sufficient for MVP

**Alternative**: Netlify (equivalent), AWS Amplify (more complex)

### 4. Why Separate Columns vs JSONB for Egg Types?

See [Database Design](#key-design-decisions) section above.

---

## 📚 Documentation Structure

```
docs/
├── ARCHITECTURE.md       # This file
├── API.md                # Supabase queries reference
├── DEPLOYMENT.md         # Step-by-step deploy guide
├── SCALING.md            # Migration guides for growth
├── CONTRIBUTING.md       # Code standards, PR process
└── ADR/                  # Architecture Decision Records
    ├── 001-offline-sync.md
    ├── 002-database-schema.md
    └── 003-authentication.md
```

---

## 🎓 Learning Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PWA Patterns](https://web.dev/offline-cookbook/)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Mobile-First Design](https://web.dev/mobile-first-css/)

---

## 🤝 Support

For questions or issues:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [GitHub Issues](https://github.com/xxx/issues)
3. Contact: dev@example.com

---

**Last Updated**: 2026-02-16
**Version**: 1.0.0
**Status**: ✅ Production Ready
