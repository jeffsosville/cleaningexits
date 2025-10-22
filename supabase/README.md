# Multi-Tenant Supabase Schema

Comprehensive database schema for a multi-tenant business listing marketplace with support for multiple verticals (Cleaning, Landscape, HVAC).

## Overview

This schema provides a complete multi-tenant solution with:

- **Data Isolation**: Row Level Security (RLS) ensures vertical-based data isolation
- **Performance**: Optimized indexes for vertical-based queries
- **Type Safety**: Full TypeScript type definitions
- **Audit Trails**: Automatic timestamps and audit fields
- **Scalability**: Many-to-many broker-vertical relationships

## Architecture

### Verticals

The system supports multiple business verticals:
- `cleaning` - Cleaning Services
- `landscape` - Landscape Services
- `hvac` - HVAC Services

Each vertical operates as an independent tenant with isolated data.

### Key Tables

1. **brokers** - Business brokers (can work across verticals)
2. **broker_verticals** - Many-to-many junction table
3. **listings** - Business listings with vertical isolation
4. **leads** - Buyer and seller leads per vertical
5. **deals** - Closed transactions and deals in progress
6. **scraper_runs** - Automated listing import tracking
7. **scraper_logs** - Detailed scraper execution logs

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│   brokers   │◄─────┤ broker_verticals ├─────►│  VERTICALS   │
└──────┬──────┘      └──────────────────┘      │  (cleaning,  │
       │                                        │  landscape,  │
       │                                        │  hvac)       │
       │                                        └──────────────┘
       │                                                ▲
       │                                                │
       │             ┌─────────────┐                    │
       └────────────►│  listings   │◄───────────────────┤
       │             └──────┬──────┘                    │
       │                    │                           │
       │                    │                           │
       │             ┌──────▼──────┐                    │
       └────────────►│    leads    │◄───────────────────┤
       │             └──────┬──────┘                    │
       │                    │                           │
       │                    │                           │
       │             ┌──────▼──────┐                    │
       └────────────►│    deals    │◄───────────────────┤
                     └─────────────┘                    │
                                                        │
                     ┌──────────────┐                   │
                     │ scraper_runs │◄──────────────────┘
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │ scraper_logs │
                     └──────────────┘
```

## Table Details

### brokers

Business brokers who can work across multiple verticals.

**Key Fields:**
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email address
- `name` (VARCHAR) - Broker name
- `company` (VARCHAR) - Brokerage company
- `license_number` (VARCHAR) - Professional license
- `is_active` (BOOLEAN) - Active status
- Timestamps: `created_at`, `updated_at`

**RLS Policies:**
- Admins: Full access
- Authenticated users: View/update own profile
- Public: View active brokers only

### broker_verticals

Junction table for many-to-many broker-vertical relationships.

**Key Fields:**
- `broker_id` (UUID) - Foreign key to brokers
- `vertical_id` (ENUM) - Vertical slug
- `is_primary` (BOOLEAN) - Primary vertical flag
- `commission_rate` (DECIMAL) - Custom commission per vertical

**Unique Constraint:** `(broker_id, vertical_id)`

### listings

Business listings with vertical-based data isolation.

**Key Fields:**
- `id` (UUID) - Primary key
- `vertical_id` (ENUM) - Vertical for data isolation
- `title` (VARCHAR) - Listing title
- `slug` (VARCHAR) - URL-friendly identifier (unique)
- `description` (TEXT) - Full description
- Location: `city`, `state`, `country`, `zip_code`
- Financial: `asking_price`, `revenue`, `sde`, `ebitda`, `cash_flow`
- Business: `year_established`, `employees_count`, `category`
- `status` (ENUM) - draft, active, pending, sold, archived
- `broker_id` (UUID) - Assigned broker
- `source` (VARCHAR) - Origin (manual, bizbuysell, etc.)
- `images` (JSONB) - Array of image objects
- `documents` (JSONB) - Array of document objects
- `custom_fields` (JSONB) - Vertical-specific data
- Timestamps: `created_at`, `updated_at`, `published_at`, `archived_at`

**RLS Policies:**
- Admins: Full access
- Authenticated: View own vertical's listings
- Brokers: Manage own listings in their vertical
- Public: View active published listings only

**Indexes:**
- `vertical_id`, `status`, `vertical_id + status`
- `slug`, `broker_id`, `category`, `city + state`
- `asking_price`, `created_at`, `published_at`

### leads

Buyer and seller leads tracked per vertical.

**Key Fields:**
- `id` (UUID) - Primary key
- `vertical_id` (ENUM) - Vertical for data isolation
- `type` (ENUM) - buyer | seller
- `status` (ENUM) - new, contacted, qualified, negotiating, won, lost
- Contact: `first_name`, `last_name`, `email`, `phone`, `company`
- `message` (TEXT) - Initial message
- Buyer: `budget_min`, `budget_max`
- Seller: `business_value`
- `preferred_location`, `preferred_categories` (JSONB)
- UTM tracking: `utm_source`, `utm_medium`, `utm_campaign`
- `assigned_broker_id` (UUID) - Assigned broker
- `related_listing_id` (UUID) - Related listing
- Communication: `last_contacted_at`, `contact_count`
- `notes` (JSONB) - Array of note objects
- `custom_fields` (JSONB)
- Timestamps: `created_at`, `updated_at`

**RLS Policies:**
- Admins: Full access
- Authenticated: View own vertical's leads
- Brokers: Manage assigned leads
- Public: Can create leads (contact forms)

**Indexes:**
- `vertical_id`, `type`, `status`
- `vertical_id + type + status` (composite)
- `email`, `assigned_broker_id`, `created_at`

### deals

Closed transactions and deals in progress.

**Key Fields:**
- `id` (UUID) - Primary key
- `vertical_id` (ENUM) - Vertical for data isolation
- Relations: `listing_id`, `buyer_lead_id`, `seller_lead_id`, `broker_id`
- `status` (ENUM) - negotiating, due_diligence, financing, closing, closed, cancelled
- `deal_title` (VARCHAR) - Deal name
- Financial: `offered_price`, `final_price`, `commission_amount`, `commission_rate`
- Timeline: `offer_date`, `acceptance_date`, `expected_close_date`, `actual_close_date`
- `documents` (JSONB) - LOI, agreements, etc.
- `notes` (JSONB) - Deal notes with timestamps
- `custom_fields` (JSONB)
- Timestamps: `created_at`, `updated_at`

**RLS Policies:**
- Admins: Full access
- Authenticated: View own vertical's deals
- Brokers: Manage own deals

**Indexes:**
- `vertical_id`, `status`, `vertical_id + status`
- `listing_id`, `buyer_lead_id`, `seller_lead_id`, `broker_id`
- `actual_close_date`, `created_at`

### scraper_runs

Tracking for automated listing imports from external sources.

**Key Fields:**
- `id` (UUID) - Primary key
- `vertical_id` (ENUM) - Vertical being scraped
- `source_name` (VARCHAR) - BizBuySell, BizQuest, etc.
- `source_url` (TEXT) - URL being scraped
- `status` (ENUM) - pending, running, completed, failed
- Timing: `started_at`, `completed_at`, `duration_seconds`
- Results: `listings_found`, `listings_created`, `listings_updated`, `listings_skipped`
- Error: `error_message`, `error_details` (JSONB)
- `run_metadata` (JSONB) - Configuration used
- `created_at`

**RLS Policies:**
- Admins: Full access
- Authenticated: View own vertical's runs

**Indexes:**
- `vertical_id`, `status`, `vertical_id + source_name`
- `started_at`

### scraper_logs

Detailed logs for each scraper run.

**Key Fields:**
- `id` (UUID) - Primary key
- `scraper_run_id` (UUID) - Foreign key
- `log_level` (VARCHAR) - info, warning, error
- `message` (TEXT) - Log message
- `details` (JSONB) - Additional context
- `created_at`

**RLS Policies:**
- Admins: Full access only

**Indexes:**
- `scraper_run_id`, `created_at`

## Row Level Security (RLS)

### Authentication Context

RLS policies rely on JWT claims:

```typescript
// JWT Token Structure
{
  "vertical_id": "cleaning",  // User's vertical
  "broker_id": "uuid",        // If user is a broker
  "role": "admin" | "broker" | "user"
}
```

### Helper Functions

```sql
-- Get user's vertical from JWT
auth.user_vertical() → vertical_slug

-- Check if user is admin
auth.is_admin() → boolean

-- Get user's broker_id from JWT
auth.user_broker_id() → UUID
```

### Policy Examples

**Vertical Isolation (Listings):**
```sql
-- Users can only see listings from their vertical
CREATE POLICY "Listings: Vertical isolation"
  ON listings FOR SELECT
  TO authenticated
  USING (vertical_id = auth.user_vertical());
```

**Broker Access (Listings):**
```sql
-- Brokers manage their own listings
CREATE POLICY "Listings: Brokers manage own"
  ON listings FOR ALL
  TO authenticated
  USING (broker_id = auth.user_broker_id());
```

**Public Access (Listings):**
```sql
-- Public can view active published listings
CREATE POLICY "Listings: Public read active"
  ON listings FOR SELECT
  TO anon
  USING (status = 'active' AND published_at IS NOT NULL);
```

## TypeScript Types

### Setup

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase/types/database.types';

// Create typed client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Usage Examples

```typescript
import { db } from './supabase/types/supabase-client';
import type { ListingInsert, VerticalSlug } from './supabase/types/database.types';

// Type-safe insert
const newListing: ListingInsert = {
  vertical_id: 'cleaning',
  title: 'Commercial Cleaning Business',
  slug: 'commercial-cleaning-seattle',
  asking_price: 350000,
  status: 'draft',
};

const { data, error } = await db
  .listings()
  .insert(newListing)
  .select()
  .single();

// Type-safe query with relations
const { data: listing } = await supabase
  .from('listings')
  .select(`
    *,
    broker:brokers(
      name,
      email
    )
  `)
  .eq('slug', 'commercial-cleaning-seattle')
  .single();
```

## Common Operations

### 1. Create a Broker with Verticals

```typescript
import { createBrokerWithVerticals } from './supabase/queries/sample-queries';

const { data: broker } = await createBrokerWithVerticals(
  {
    email: 'john@example.com',
    name: 'John Smith',
    company: 'Smith Brokerage',
    phone: '555-0100',
  },
  ['cleaning', 'landscape'] // Assign to multiple verticals
);
```

### 2. Get Active Listings for a Vertical

```typescript
import { getActiveListingsByVertical } from './supabase/queries/sample-queries';

const { data: listings } = await getActiveListingsByVertical('cleaning', {
  limit: 20,
  category: 'commercial',
  minPrice: 100000,
  maxPrice: 500000,
  state: 'WA',
});
```

### 3. Create a Lead from a Form

```typescript
import { createLeadFromForm } from './supabase/queries/sample-queries';

const { data: lead } = await createLeadFromForm(
  {
    vertical_id: 'cleaning',
    type: 'buyer',
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob@example.com',
    phone: '555-1234',
    budget_min: 200000,
    budget_max: 400000,
    message: 'Looking for a commercial cleaning business in Seattle area',
    source: 'website',
  },
  {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'cleaning-buyers-q4',
  }
);
```

### 4. Assign Lead to Broker

```typescript
import { assignLeadToBroker } from './supabase/queries/sample-queries';

const { data: lead } = await assignLeadToBroker(
  'lead-uuid',
  'broker-uuid'
);
```

### 5. Add Note to Lead

```typescript
import { addNoteToLead } from './supabase/queries/sample-queries';

await addNoteToLead(
  'lead-uuid',
  'Called and discussed budget. Very interested in commercial listings.',
  'user-uuid',
  'call'
);
```

### 6. Create a Deal

```typescript
import { createDeal } from './supabase/queries/sample-queries';

const { data: deal } = await createDeal({
  vertical_id: 'cleaning',
  deal_title: 'Seattle Commercial Cleaning Acquisition',
  listing_id: 'listing-uuid',
  buyer_lead_id: 'buyer-uuid',
  broker_id: 'broker-uuid',
  status: 'negotiating',
  offered_price: 325000,
  commission_rate: 10.0,
  offer_date: '2025-01-15',
});
```

### 7. Update Deal Status

```typescript
import { updateDealStatus } from './supabase/queries/sample-queries';

await updateDealStatus(
  'deal-uuid',
  'due_diligence',
  'Buyer accepted offer. Moving to due diligence phase.',
  'user-uuid'
);
```

### 8. Track Scraper Run

```typescript
import {
  createScraperRun,
  updateScraperRun,
  addScraperLog
} from './supabase/queries/sample-queries';

// Start run
const { data: run } = await createScraperRun(
  'cleaning',
  'BizBuySell',
  'https://www.bizbuysell.com/cleaning-businesses/',
  { filters: { state: 'WA' } }
);

// Update as running
await updateScraperRun(run.id, {
  status: 'running',
  started_at: new Date().toISOString(),
});

// Add logs
await addScraperLog(run.id, 'info', 'Started scraping page 1');
await addScraperLog(run.id, 'info', 'Found 25 listings on page 1');

// Complete
await updateScraperRun(run.id, {
  status: 'completed',
  completed_at: new Date().toISOString(),
  listings_found: 25,
  listings_created: 20,
  listings_updated: 3,
  listings_skipped: 2,
});
```

### 9. Get Dashboard Metrics

```typescript
import { getVerticalDashboardMetrics } from './supabase/queries/sample-queries';

const metrics = await getVerticalDashboardMetrics('cleaning');

console.log(metrics);
// {
//   activeListingsCount: 156,
//   leadPipeline: [...],
//   dealMetrics: [...],
//   conversionRate: 12.5
// }
```

### 10. Get Top Performing Brokers

```typescript
import { getTopBrokers } from './supabase/queries/sample-queries';

const { data: topBrokers } = await getTopBrokers('cleaning', 10);

// Returns brokers sorted by total commission
// with deal metrics attached
```

## Views

### active_listings_with_broker

Pre-joined view of active listings with broker information.

```typescript
const { data } = await supabase
  .from('active_listings_with_broker')
  .select('*')
  .eq('vertical_id', 'cleaning');
```

### lead_pipeline

Aggregated lead metrics per vertical, type, and status.

```typescript
const { data } = await supabase
  .from('lead_pipeline')
  .select('*')
  .eq('vertical_id', 'cleaning')
  .eq('type', 'buyer');
```

### deal_metrics

Aggregated deal metrics per vertical and status.

```typescript
const { data } = await supabase
  .from('deal_metrics')
  .select('*')
  .eq('vertical_id', 'cleaning');
```

## Functions

### get_active_listings_count(vertical_id)

Returns count of active published listings for a vertical.

```typescript
const { data: count } = await supabase
  .rpc('get_active_listings_count', { v_id: 'cleaning' });
```

### get_broker_listings_count(broker_id)

Returns count of active listings for a broker.

```typescript
const { data: count } = await supabase
  .rpc('get_broker_listings_count', { b_id: 'broker-uuid' });
```

### get_conversion_rate(vertical_id)

Calculates lead-to-deal conversion rate for a vertical.

```typescript
const { data: rate } = await supabase
  .rpc('get_conversion_rate', { v_id: 'cleaning' });
// Returns percentage (e.g., 12.5 = 12.5%)
```

## Performance Optimization

### Indexes

All tables have optimized indexes for:
- Vertical-based queries (primary access pattern)
- Status filtering
- Foreign key lookups
- Date-based sorting
- Common composite queries

### Query Tips

1. **Always filter by vertical_id first** - Leverages primary index
2. **Use composite indexes** - `(vertical_id, status)` is indexed
3. **Limit results** - Use `.limit()` for pagination
4. **Select only needed columns** - Reduces data transfer
5. **Use views for complex joins** - Pre-optimized queries

### Example: Optimized Query

```typescript
// Good: Uses vertical_id + status composite index
const { data } = await db
  .listings()
  .select('id, title, asking_price')
  .eq('vertical_id', 'cleaning')
  .eq('status', 'active')
  .order('published_at', { ascending: false })
  .limit(20);

// Bad: Missing vertical_id filter
const { data } = await db
  .listings()
  .select('*')
  .eq('status', 'active'); // Scans all verticals
```

## Migrations

### Running the Migration

```bash
# Using Supabase CLI
supabase db reset
supabase db push

# Or apply directly in Supabase Dashboard
# Copy contents of migrations/20250101000000_initial_multi_tenant_schema.sql
```

### Migration File Structure

```
supabase/
├── migrations/
│   └── 20250101000000_initial_multi_tenant_schema.sql  # Main schema
├── types/
│   ├── database.types.ts      # TypeScript types
│   └── supabase-client.ts     # Typed client
├── queries/
│   └── sample-queries.ts      # Common operations
└── README.md                  # This file
```

## Testing

### Sample Data

The migration includes commented-out sample data for testing. To use:

1. Open `migrations/20250101000000_initial_multi_tenant_schema.sql`
2. Scroll to bottom and uncomment the sample data section
3. Run the migration

This creates:
- 2 sample brokers
- 2 sample listings (cleaning, landscape)
- 3 sample leads (buyer, seller, buyer)

### Test Queries

```typescript
// Test vertical isolation
const { data: cleaningListings } = await db
  .listings()
  .select('*')
  .eq('vertical_id', 'cleaning');

// Test broker-vertical relationship
const { data: broker } = await getBrokerWithVerticals('broker-uuid');
console.log(broker.verticals); // Array of assigned verticals

// Test RLS (should only see own vertical's data)
const { data: myListings } = await db
  .listings()
  .select('*');
// RLS automatically filters by auth.user_vertical()
```

## Security Considerations

### RLS Enforcement

1. **Always enable RLS** on all tables containing sensitive data
2. **Test policies** with different user roles
3. **Never bypass RLS** in client-side code (use service role sparingly)

### JWT Claims

Set proper claims when creating JWT tokens:

```typescript
// Server-side: Set claims based on user's vertical
const token = jwt.sign({
  sub: user.id,
  email: user.email,
  vertical_id: user.vertical_id,  // Important!
  broker_id: user.broker_id,      // If applicable
  role: user.role,
}, secret);
```

### Public Access

- Listings: Only active, published listings
- Brokers: Only active brokers
- Leads: Can create (for contact forms), cannot read
- Everything else: Requires authentication

## Troubleshooting

### RLS Blocking Queries

If queries return empty results unexpectedly:

1. Check JWT claims include `vertical_id`
2. Verify user role is set correctly
3. Test with service role to bypass RLS temporarily
4. Check policy definitions match your use case

```typescript
// Debug: Use service role to see all data
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role bypasses RLS
  { auth: { persistSession: false } }
);
```

### Performance Issues

1. **Check indexes** - Run `EXPLAIN ANALYZE` on slow queries
2. **Limit result sets** - Always use pagination
3. **Avoid N+1 queries** - Use `.select()` with joins
4. **Monitor Supabase dashboard** - Check slow query log

### Type Errors

If TypeScript types don't match database:

1. Regenerate types: `supabase gen types typescript`
2. Restart TypeScript server
3. Check for schema drift

## Future Enhancements

Potential additions for future versions:

1. **Audit log table** - Track all data changes
2. **User preferences** - Store user settings per vertical
3. **Email queue** - Manage outgoing emails
4. **File uploads** - Track document uploads
5. **Comments/discussions** - Internal communication
6. **Notifications** - Real-time alerts
7. **Webhooks** - External integrations
8. **API usage tracking** - Rate limiting data

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeScript Types](https://supabase.com/docs/reference/javascript/typescript-support)
- [Performance Tips](https://supabase.com/docs/guides/platform/performance)

## Support

For issues or questions:
1. Check this README first
2. Review Supabase documentation
3. Check error logs in Supabase dashboard
4. Contact development team

---

**Version:** 1.0.0
**Last Updated:** 2025-01-01
**Compatible With:** Supabase PostgreSQL 15+
