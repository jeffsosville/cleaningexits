# Multi-Tenant Schema Setup Guide

Step-by-step guide to set up the multi-tenant database schema in your Supabase project.

## Prerequisites

- Supabase project created
- Supabase CLI installed (optional but recommended)
- Node.js and npm/yarn installed
- Next.js application set up

## Step 1: Install Dependencies

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Or with yarn
yarn add @supabase/supabase-js
```

## Step 2: Set Environment Variables

Create or update `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For server-side operations (admin access)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get these values from:
1. Go to Supabase Dashboard → Settings → API
2. Copy URL and anon key
3. Copy service_role key (keep this secret!)

## Step 3: Run the Migration

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy entire contents of `supabase/migrations/20250101000000_initial_multi_tenant_schema.sql`
5. Paste into query editor
6. Click **Run** or press `Cmd/Ctrl + Enter`
7. Wait for execution to complete (should take ~5 seconds)

### Option B: Using Supabase CLI

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Push migration to database
supabase db push

# Or reset database (warning: drops all data!)
supabase db reset
```

## Step 4: Verify Migration

Check that all tables were created:

```sql
-- Run in SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Expected tables:
-- brokers
-- broker_verticals
-- listings
-- leads
-- deals
-- scraper_runs
-- scraper_logs
```

Check RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

## Step 5: Update Supabase Client

Replace your existing Supabase client with the typed version.

**Before (lib/supabaseClient.ts):**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**After (use supabase/types/supabase-client.ts):**
```typescript
// Now import from the typed client
import { supabase, db } from '@/supabase/types/supabase-client';
```

Or update your existing file:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/types/database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## Step 6: Configure Authentication

### Set JWT Claims

For RLS to work properly, JWT tokens must include `vertical_id` claim.

#### Option A: Using Supabase Auth Hooks (Recommended)

1. Go to **Database → Functions**
2. Create a new function:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default vertical based on signup domain or other logic
  NEW.raw_app_metadata := jsonb_set(
    COALESCE(NEW.raw_app_metadata, '{}'::jsonb),
    '{vertical_id}',
    '"cleaning"'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### Option B: Middleware-Based (For Multi-Domain Setup)

If you're using the multi-domain routing from previous prompts:

**middleware.ts:**
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getVerticalByHostname } from '@/config/verticals/utils';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get vertical from hostname
  const hostname = req.headers.get('host') || '';
  const vertical = getVerticalByHostname(hostname);

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Set vertical_id in JWT claims
    await supabase.auth.updateUser({
      data: { vertical_id: vertical.info.slug }
    });
  }

  return res;
}
```

#### Option C: Manual Token Generation (Server-Side)

For custom auth:

```typescript
import jwt from 'jsonwebtoken';

function generateToken(user) {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    vertical_id: user.vertical_id,    // Required for RLS
    broker_id: user.broker_id,        // If user is a broker
    role: user.role || 'user',        // admin, broker, user
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
  }, process.env.SUPABASE_JWT_SECRET!);
}
```

## Step 7: Test the Setup

### Test 1: Create a Broker

```typescript
import { createBrokerWithVerticals } from '@/supabase/queries/sample-queries';

const { data, error } = await createBrokerWithVerticals(
  {
    email: 'test@example.com',
    name: 'Test Broker',
    company: 'Test Brokerage',
  },
  ['cleaning']
);

console.log('Broker created:', data);
```

### Test 2: Create a Listing

```typescript
import { createListing } from '@/supabase/queries/sample-queries';

const { data, error } = await createListing({
  vertical_id: 'cleaning',
  title: 'Test Listing',
  slug: 'test-listing-' + Date.now(),
  asking_price: 100000,
  status: 'draft',
});

console.log('Listing created:', data);
```

### Test 3: Query Active Listings

```typescript
import { getActiveListingsByVertical } from '@/supabase/queries/sample-queries';

const { data, error } = await getActiveListingsByVertical('cleaning', {
  limit: 10
});

console.log('Active listings:', data);
```

### Test 4: Verify RLS

```typescript
// This should only return listings for the user's vertical
const { data, error } = await supabase
  .from('listings')
  .select('*');

console.log('My vertical listings:', data);
// Should be filtered by auth.user_vertical()
```

## Step 8: Seed Sample Data (Optional)

For development/testing, seed with sample data:

```typescript
// scripts/seed-database.ts
import { createBrokerWithVerticals, createListing } from '@/supabase/queries/sample-queries';

async function seedDatabase() {
  // Create brokers
  const { data: broker1 } = await createBrokerWithVerticals(
    {
      email: 'john@example.com',
      name: 'John Smith',
      company: 'Smith Brokerage',
    },
    ['cleaning', 'landscape']
  );

  // Create listings
  await createListing({
    vertical_id: 'cleaning',
    title: 'Commercial Cleaning Business - Seattle',
    slug: 'commercial-cleaning-seattle',
    description: 'Established commercial cleaning business...',
    city: 'Seattle',
    state: 'WA',
    asking_price: 350000,
    revenue: 500000,
    sde: 120000,
    category: 'commercial',
    status: 'active',
    broker_id: broker1.id,
    published_at: new Date().toISOString(),
  });

  console.log('Database seeded successfully!');
}

seedDatabase();
```

Run it:
```bash
npx tsx scripts/seed-database.ts
```

## Step 9: Set Up Type Generation (Optional)

To regenerate types after schema changes:

```bash
# Install Supabase CLI
npm install -g supabase

# Generate types
supabase gen types typescript --project-id your-project-ref > supabase/types/database.types.ts
```

## Common Issues & Solutions

### Issue 1: RLS Blocking All Queries

**Symptom:** Queries return empty results even though data exists.

**Solution:**
- Check JWT token includes `vertical_id` claim
- Verify RLS policies with admin role:
  ```typescript
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  ```

### Issue 2: Type Errors

**Symptom:** TypeScript errors like "Property X does not exist on type Y"

**Solution:**
- Regenerate types: `supabase gen types typescript`
- Restart TypeScript server in VS Code
- Check import paths are correct

### Issue 3: Migration Fails

**Symptom:** SQL errors when running migration

**Solution:**
- Check PostgreSQL version (needs 15+)
- Ensure extensions are enabled (uuid-ossp, pgcrypto)
- Run in SQL Editor to see exact error
- Check for existing tables with same names

### Issue 4: Can't Create Listings

**Symptom:** INSERT operation fails

**Solution:**
- Ensure `vertical_id` is set correctly
- Check broker exists if setting `broker_id`
- Verify `slug` is unique
- Check user has proper JWT claims

## Production Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] RLS policies tested with different user roles
- [ ] Indexes verified with `EXPLAIN ANALYZE`
- [ ] Service role key kept secret (never in client code)
- [ ] JWT secret is strong and secure
- [ ] Backup strategy configured
- [ ] Monitoring/logging enabled
- [ ] Rate limiting configured
- [ ] Database size alerts set up

## Performance Tuning

### Enable Query Logging

In Supabase Dashboard:
1. Settings → Database → Query Performance
2. Enable slow query logging
3. Set threshold to 100ms

### Monitor Index Usage

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Vacuum and Analyze

```sql
-- Run periodically
VACUUM ANALYZE;

-- Or on specific tables
VACUUM ANALYZE listings;
```

## Next Steps

1. **Implement Scraper** - Use `scraper_runs` and `scraper_logs` tables
2. **Build Admin Dashboard** - Query metrics using views and functions
3. **Set Up Email Notifications** - Trigger on new leads
4. **Integrate Vertical Config** - Connect to existing vertical system
5. **Add Search** - Implement full-text search on listings
6. **Build API Routes** - Create Next.js API routes using sample queries

## Resources

- [README.md](./README.md) - Full schema documentation
- [sample-queries.ts](./queries/sample-queries.ts) - Query examples
- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter issues:
1. Check error logs in Supabase Dashboard
2. Review this setup guide
3. Test with service role to bypass RLS
4. Check PostgreSQL logs for errors
5. Contact development team

---

**Last Updated:** 2025-01-01
