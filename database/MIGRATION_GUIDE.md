# Migration Guide: Add Multi-Tenant Support

This guide helps you migrate your existing Supabase database to support multi-tenant scrapers.

## ⚡ Quick Start (2 minutes)

### Step 1: Run the Migration SQL

**Option A: Using Supabase SQL Editor (Recommended)**

1. Open your Supabase project
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `migration_add_multitenant.sql`
5. Paste into the editor
6. Click **Run**

**Option B: Using psql Command Line**

```bash
# If you have psql installed and SUPABASE_CONNECTION_STRING set
psql $SUPABASE_CONNECTION_STRING < migration_add_multitenant.sql
```

**Option C: Using Supabase CLI**

```bash
supabase db push < migration_add_multitenant.sql
```

### Step 2: Verify Migration

Run this query in Supabase SQL Editor:

```sql
-- Check that new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('listings', 'scraper_runs', 'scraper_logs', 'scraper_patterns')
ORDER BY table_name;
```

You should see:
```
listings
scraper_logs
scraper_patterns
scraper_runs
```

### Step 3: Check Existing Data

```sql
-- Verify existing listings were preserved
SELECT
  COUNT(*) as total_listings,
  COUNT(vertical_slug) as with_vertical_slug,
  COUNT(id) as with_id
FROM listings;
```

All your existing listings should be there with `vertical_slug = 'cleaning'` by default.

### Step 4: Test the Scrapers

```bash
cd scrapers

# Test BizBuySell scraper with a small test
python bizbuysell_scraper_v2.py --vertical cleaning --max-pages 5 --workers 5
```

Expected output:
```
✓ SUCCESS: Saved to listings table
✓ Created scraper_run record
✓ Logged events to scraper_logs
```

---

## 🔍 What the Migration Does

### 1. **Adds Columns to Existing `listings` Table**

The migration adds these columns (all **nullable** to not break existing data):

| Column | Type | Description |
|--------|------|-------------|
| `vertical_slug` | TEXT | 'cleaning', 'landscape', or 'hvac' (defaults to 'cleaning') |
| `id` | TEXT | Unique identifier (maps from surrogate_key) |
| `title` | TEXT | Business title (maps from header) |
| `city` | TEXT | Extracted city |
| `state` | TEXT | Extracted state |
| `asking_price` | NUMERIC | Numeric price (maps from price) |
| `status` | TEXT | 'pending', 'approved', or 'archived' |
| `scraper_run_id` | TEXT | Links to scraper_runs table |
| `created_at` | TIMESTAMPTZ | When added to database |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Your existing columns are preserved:**
- `header`, `location`, `price`, `description`, `img`, `listNumber`, `urlStub`, `cashFlow`, `ebitda`, `brokerCompany`, `brokerContactFullName`, `region`, `hotProperty`, `recentlyUpdated`, `recentlyAdded`, `scraped_at`, `surrogate_key`

### 2. **Creates New Tracking Tables**

**`scraper_runs`** - Tracks each scraper execution
```sql
CREATE TABLE scraper_runs (
  id TEXT PRIMARY KEY,
  vertical_slug TEXT NOT NULL,
  broker_source TEXT NOT NULL,
  scraper_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  total_listings_found INTEGER,
  new_listings INTEGER,
  ...
);
```

**`scraper_logs`** - Detailed event logging
```sql
CREATE TABLE scraper_logs (
  id TEXT PRIMARY KEY,
  scraper_run_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB
);
```

**`scraper_patterns`** - ML knowledge base (optional)
```sql
CREATE TABLE scraper_patterns (
  domain TEXT PRIMARY KEY,
  pattern_signature TEXT NOT NULL,
  success_count INTEGER,
  total_listings INTEGER,
  ...
);
```

### 3. **Creates Analytics Views**

**`active_listings_by_vertical`** - Summary by vertical
```sql
SELECT * FROM active_listings_by_vertical;

-- Result:
vertical_slug | total_listings | approved | pending | avg_price
--------------+----------------+----------+---------+-----------
cleaning      | 3,489          | 2,892    | 597     | $245,000
landscape     | 2,979          | 2,456    | 523     | $312,000
hvac          | 3,988          | 3,401    | 587     | $467,000
```

**`scraper_performance`** - Scraper stats
```sql
SELECT * FROM scraper_performance WHERE vertical_slug = 'cleaning';

-- Result:
broker_source | total_runs | successful_runs | total_listings | avg_duration
--------------+------------+-----------------+----------------+--------------
BizBuySell    | 5          | 5               | 8,456          | 45.2s
Murphy        | 3          | 3               | 412            | 12.1s
Transworld    | 2          | 2               | 289            | 8.5s
```

---

## 🧪 Testing After Migration

### Test 1: Check Existing Data Preserved

```sql
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT vertical_slug) as verticals,
  MIN(scraped_at) as oldest_listing,
  MAX(scraped_at) as newest_listing
FROM listings;
```

Expected: All your existing listings should be there.

### Test 2: Insert a Test Listing

```sql
INSERT INTO listings (
  id,
  vertical_slug,
  title,
  location,
  asking_price,
  status,
  scraped_at
) VALUES (
  'test-listing-123',
  'cleaning',
  'Test Cleaning Business',
  'New York, NY',
  250000,
  'pending',
  NOW()
);

-- Verify
SELECT * FROM listings WHERE id = 'test-listing-123';
```

### Test 3: Create a Test Scraper Run

```sql
INSERT INTO scraper_runs (
  id,
  vertical_slug,
  broker_source,
  scraper_type,
  started_at,
  status,
  total_listings_found
) VALUES (
  'test-run-123',
  'cleaning',
  'BizBuySell',
  'bizbuysell',
  NOW(),
  'completed',
  100
);

-- Verify
SELECT * FROM scraper_runs WHERE id = 'test-run-123';
```

### Test 4: View Analytics

```sql
-- Listings by vertical
SELECT * FROM active_listings_by_vertical;

-- Scraper performance
SELECT * FROM scraper_performance;

-- Recent activity
SELECT * FROM recent_scraper_activity;
```

---

## 🚨 Troubleshooting

### Issue: "relation 'listings' already exists"

**Solution**: The migration is safe to run multiple times. It uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`.

### Issue: "column 'vertical_slug' does not exist" in scrapers

**Solution**: Make sure you ran the migration SQL. Check with:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'listings'
  AND column_name = 'vertical_slug';
```

Should return: `vertical_slug`

### Issue: "permission denied for table listings"

**Solution**: Make sure you're using the **service role key** in your `.env` file, not the anon key:

```bash
# In scrapers/.env
SUPABASE_KEY=your-service-role-key  # NOT anon key
```

### Issue: Scrapers still can't save

**Solution**: Check the scraper logs:

```bash
python bizbuysell_scraper_v2.py --vertical cleaning --max-pages 1
```

Look for error messages. Common issues:
- Wrong Supabase credentials
- Network/firewall issues
- Column type mismatches

---

## 🔄 Rollback (if needed)

If you need to undo the migration:

```sql
-- Remove new columns from listings table
ALTER TABLE listings
  DROP COLUMN IF EXISTS vertical_slug,
  DROP COLUMN IF EXISTS id,
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS asking_price,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS scraper_run_id,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at;

-- Drop new tables
DROP TABLE IF EXISTS scraper_logs CASCADE;
DROP TABLE IF EXISTS scraper_runs CASCADE;
DROP TABLE IF EXISTS scraper_patterns CASCADE;
DROP TABLE IF EXISTS scraper_history CASCADE;

-- Drop views
DROP VIEW IF EXISTS active_listings_by_vertical CASCADE;
DROP VIEW IF EXISTS scraper_performance CASCADE;
DROP VIEW IF EXISTS recent_scraper_activity CASCADE;
```

---

## 📊 Next Steps

After migration is complete:

1. **Test each scraper**:
   ```bash
   # BizBuySell
   python bizbuysell_scraper_v2.py --vertical cleaning --max-pages 10

   # Specialized
   python specialized_scrapers_v2.py --vertical landscape --broker murphy

   # Unified
   python unified_broker_scraper_v2.py --vertical hvac --top-n 5
   ```

2. **Run orchestrator for all verticals**:
   ```bash
   python orchestrator.py
   ```

3. **Monitor with analytics**:
   ```sql
   -- Check scraper runs
   SELECT * FROM recent_scraper_activity;

   -- Check listings by vertical
   SELECT * FROM active_listings_by_vertical;

   -- View performance
   SELECT * FROM scraper_performance;
   ```

4. **Set up cron job** (see README.md for details)

---

## ✅ Verification Checklist

- [ ] Migration SQL ran without errors
- [ ] All 4 tables exist: `listings`, `scraper_runs`, `scraper_logs`, `scraper_patterns`
- [ ] Existing listings preserved (count matches before migration)
- [ ] New `vertical_slug` column exists in `listings`
- [ ] Views created: `active_listings_by_vertical`, `scraper_performance`, `recent_scraper_activity`
- [ ] Test scraper runs successfully
- [ ] Data appears in `scraper_runs` table
- [ ] Logs appear in `scraper_logs` table

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify all steps in the [Verification Checklist](#-verification-checklist)
3. Run test queries to isolate the problem
4. Check Supabase logs for errors

**Database Schema**: See `database/schema.sql` for full schema reference

**Scraper Docs**: See `scrapers/README.md` for complete scraper documentation
