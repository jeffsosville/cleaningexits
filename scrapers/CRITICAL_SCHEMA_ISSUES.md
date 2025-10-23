# 🚨 CRITICAL SCHEMA MISMATCHES

## Problem Summary

The **frontend queries** (index.tsx, top10.tsx) expect columns that **DON'T EXIST** in your database schema files.

---

## ❌ Missing Columns

### 1. `is_active` (CRITICAL - Blocks ALL listings)

**Frontend expects:**
```javascript
.eq("is_active", true)  // pages/index.tsx:53, pages/top10.tsx:62
```

**Your schema has:**
- ❌ NOT DEFINED in `database/schema.sql`
- ❌ NOT DEFINED in `database/migration_add_multitenant.sql`
- ❌ NOT BEING SET by `scrapers/bizbuysell_scraper_v2.py`

**Impact:**
- 🔥 **ALL LISTINGS ARE FILTERED OUT** because `is_active = true` filter fails
- No listings will ever appear on Index or Top10 pages
- This is why your 15 scraped listings aren't showing up!

---

### 2. `quality_score` (CRITICAL for Top10 ranking)

**Frontend expects:**
```javascript
.order("quality_score", { ascending: false, nullsFirst: false })  // pages/top10.tsx:70
```

**Your schema has:**
- ❌ NOT DEFINED in any SQL files
- ❌ NOT BEING SET by scraper

**Impact:**
- Top10 page sorting is broken
- All listings will have NULL quality_score, so ordering is random

---

### 3. `scraped_at` vs `ingested_at` confusion

**Frontend expects:**
```javascript
.gte("scraped_at", days90agoISO)  // pages/index.tsx:52
```

**Your schema has:**
- ✅ `scraped_at` EXISTS in `database/schema.sql:60`
- ⚠️ But API route uses `ingested_at` (app/api/listings/route.ts:17)

**Impact:**
- Timestamp filtering may not work correctly
- Index page filters by `scraped_at`
- API route sorts by `ingested_at`

---

## 🎯 Required Fixes

### Fix #1: Add `is_active` column

```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
```

### Fix #2: Add `quality_score` column

```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quality_score NUMERIC;
CREATE INDEX IF NOT EXISTS idx_listings_quality_score ON listings(quality_score DESC NULLS LAST);
```

### Fix #3: Update scraper to set these fields

```python
# In normalize_listing() method
return {
    # ... existing fields ...

    # CRITICAL: Must set for frontend queries to work
    'is_active': True,  # ← REQUIRED or listings won't show!
    'quality_score': self.calculate_quality_score(
        raw_listing.get("price"),
        raw_listing.get("grossSales"),
        raw_listing.get("cashFlow")
    ),
    'scraped_at': datetime.now(timezone.utc).isoformat(),
}
```

### Fix #4: Add quality_score calculation

```python
def calculate_quality_score(self, price, revenue, cash_flow):
    """Calculate quality score (0-100) based on financial metrics"""
    score = 50  # Base score

    # Bonus for revenue (up to +20)
    if revenue:
        if revenue > 1000000:  # $1M+
            score += 20
        elif revenue > 500000:  # $500K+
            score += 15
        elif revenue > 250000:  # $250K+
            score += 10
        elif revenue > 100000:  # $100K+
            score += 5

    # Bonus for cash flow (up to +20)
    if cash_flow:
        if cash_flow > 200000:  # $200K+
            score += 20
        elif cash_flow > 100000:  # $100K+
            score += 15
        elif cash_flow > 50000:   # $50K+
            score += 10
        elif cash_flow > 25000:   # $25K+
            score += 5

    # Bonus for good multiples (up to +10)
    if price and revenue:
        multiple = price / revenue
        if 0.5 <= multiple <= 3.0:  # Reasonable multiple
            score += 10
        elif 3.0 < multiple <= 5.0:
            score += 5

    return min(max(score, 0), 100)  # Clamp to 0-100
```

---

## 📊 Schema Comparison

| Column | Frontend Needs | schema.sql | Scraper Sets | Status |
|--------|---------------|-----------|--------------|--------|
| `is_active` | ✅ YES | ❌ NO | ❌ NO | 🚨 BROKEN |
| `quality_score` | ✅ YES | ❌ NO | ❌ NO | 🚨 BROKEN |
| `scraped_at` | ✅ YES | ✅ YES | ✅ YES | ✅ GOOD |
| `cash_flow` | ✅ YES | ✅ YES | ✅ YES | ✅ GOOD |
| `revenue` | ✅ YES | ✅ YES | ✅ YES | ✅ GOOD |
| `price` | ✅ YES | ✅ YES | ✅ YES | ✅ GOOD |
| `title` | ✅ YES | ✅ YES | ✅ YES | ✅ GOOD |
| `listing_id` | ✅ YES | ❓ | ✅ YES | ⚠️ CHECK |
| `location` | ✅ YES | ✅ YES | ✅ YES | ✅ GOOD |

---

## 🔍 Why Your 15 Listings Aren't Showing

The scraper successfully inserted 15 cleaning listings, but they're NOT appearing because:

1. ❌ Frontend filters by `is_active = true`
2. ❌ Your listings don't have `is_active` column (or it's NULL)
3. ❌ SQL query: `WHERE is_active = true` returns 0 rows
4. ❌ Result: Empty homepage and Top10 page

**Even if the scraper worked perfectly, without `is_active = true`, nothing will display!**

---

## ✅ Immediate Action Items

### Step 1: Add missing columns to database
```bash
# Connect to PostgreSQL
psql postgresql://postgres:PASSWORD@db.tcsgmaozbhkldpwlorzk.supabase.co/postgres

# Run these commands
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quality_score NUMERIC;

# Update existing listings
UPDATE listings SET is_active = true WHERE is_active IS NULL;
UPDATE listings SET quality_score = 75 WHERE quality_score IS NULL;  -- Default score

# Add indexes
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_quality_score ON listings(quality_score DESC NULLS LAST);
```

### Step 2: Update scraper to set these fields
Add the following to `bizbuysell_scraper_v2.py` in the `normalize_listing` method:

```python
'is_active': True,
'quality_score': 75,  # Or use calculate_quality_score() method
'scraped_at': datetime.now(timezone.utc).isoformat(),
```

### Step 3: Re-run scraper
```bash
python bizbuysell_scraper_v2.py --vertical cleaning --max-pages 1 --workers 10
```

### Step 4: Verify listings appear
Visit: http://localhost:3000 (or your domain)

---

## 🧪 Testing Query

```sql
-- Check if listings will appear on Index page
SELECT
    listing_id,
    title,
    is_active,
    quality_score,
    cash_flow,
    price,
    scraped_at,
    CASE
        WHEN is_active IS NULL THEN '❌ is_active is NULL - WON''T SHOW'
        WHEN is_active = false THEN '❌ is_active is false - WON''T SHOW'
        WHEN is_active = true THEN '✅ is_active is true - WILL SHOW'
    END as display_status
FROM listings
WHERE title ILIKE '%cleaning%'
ORDER BY cash_flow DESC NULLS LAST
LIMIT 10;
```

---

Generated: 2025-10-23
Analyzed: pages/index.tsx, pages/top10.tsx, database/schema.sql, scrapers/bizbuysell_scraper_v2.py
