# Display Query Requirements for Index & Top10 Pages

This document describes the SQL queries that determine which listings appear on the **Index Page** and **Top10 Page**.

---

## 📍 Index Page Query (pages/index.tsx:48-61)

### Query Logic:
```javascript
supabase
  .from("listings")
  .select("listing_id, title, city, state, location, price, cash_flow, revenue, description, listing_url, scraped_at, why_hot")
  .or("title.ilike.%cleaning%,title.ilike.%janitorial%,title.ilike.%maid%,title.ilike.%housekeeping%,title.ilike.%custodial%")
  .gte("scraped_at", days90agoISO)     // Only last 90 days
  .eq("is_active", true)                // Must be active
  .not("title", "ilike", "%dry%clean%") // Excludes dry cleaners, etc.
  .not("title", "ilike", "%franchise%")
  .not("title", "ilike", "%restaurant%")
  // ... more excludes
  .order("cash_flow", { ascending: false, nullsFirst: false })
  .order("price", { ascending: false, nullsFirst: false })
  .order("scraped_at", { ascending: false })
  .limit(10)
```

### Required Fields for Scraper:
| Field | Required? | Purpose |
|-------|-----------|---------|
| `title` | ✅ YES | Must contain cleaning keywords |
| `is_active` | ✅ YES | Must be `true` |
| `scraped_at` | ✅ YES | Must be within last 90 days |
| `cash_flow` | 🔥 CRITICAL | **Primary sort** - Higher = better |
| `price` | 🔥 CRITICAL | **Secondary sort** - Higher = better |
| `listing_id` | ✅ YES | For linking to detail page |
| `city`, `state`, `location` | ⚠️ Recommended | For display |
| `revenue` | ⚠️ Recommended | For display |
| `description` | ⚠️ Recommended | For preview |
| `listing_url` | ✅ YES | Link to source |
| `why_hot` | ⚠️ Optional | Highlighted feature box |

### Sorting Priority:
1. **cash_flow** (DESC, nulls last) ← Most important!
2. **price** (DESC, nulls last)
3. **scraped_at** (DESC)

---

## 🔥 Top10 Page Query (pages/top10.tsx:58-73)

### Query Logic:
```javascript
supabase
  .from("listings")
  .select("id, listing_id, title, city, state, location, price, cash_flow, revenue, description, listing_url, broker_account, why_hot, quality_score, established_year, employees")
  .or("title.ilike.%cleaning%,title.ilike.%janitorial%,...")
  .eq("is_active", true)
  .gt("price", 0)                       // Must have a price
  .not("title", "ilike", "%dry%clean%")
  .not("title", "ilike", "%franchise%")
  // ... more excludes
  .order("quality_score", { ascending: false, nullsFirst: false })
  .order("revenue", { ascending: false, nullsFirst: false })
  .order("price", { ascending: false })
  .limit(10)
```

### Required Fields for Scraper:
| Field | Required? | Purpose |
|-------|-----------|---------|
| `title` | ✅ YES | Must contain cleaning keywords |
| `is_active` | ✅ YES | Must be `true` |
| `price` | ✅ YES | Must be `> 0` |
| `quality_score` | 🔥 CRITICAL | **Primary sort** - Higher = better |
| `revenue` | 🔥 CRITICAL | **Secondary sort** - Higher = better |
| `cash_flow` | ⚠️ Recommended | For display |
| `listing_id` | ✅ YES | For linking |
| `location` or (`city`, `state`) | ⚠️ Recommended | For display |
| `description` | ⚠️ Recommended | For preview |
| `listing_url` | ✅ YES | Link to source |
| `why_hot` | ⚠️ Optional | Featured highlight |
| `broker_account` | ⚠️ Optional | Broker info |
| `established_year` | ⚠️ Optional | Business age |
| `employees` | ⚠️ Optional | Team size |

### Sorting Priority:
1. **quality_score** (DESC, nulls last) ← Most important!
2. **revenue** (DESC, nulls last)
3. **price** (DESC)

---

## 🎯 Critical Fields Summary

### For a listing to appear on BOTH pages:
```sql
-- Minimum requirements
is_active = true
title ILIKE '%cleaning%' (or janitorial, maid, etc.)
title NOT ILIKE '%dry%clean%' (and other excludes)
price > 0 (for Top10 only)
scraped_at >= NOW() - INTERVAL '90 days' (for Index only)

-- For best ranking on Index page:
cash_flow = highest possible
price = high
scraped_at = recent

-- For best ranking on Top10 page:
quality_score = highest possible
revenue = highest possible
price = high
```

---

## 🚨 What Your Scraper Must Do

### 1. Set `is_active = true`
```python
'is_active': True  # Or the listing won't show!
```

### 2. Ensure `scraped_at` is recent (for Index page)
```python
'scraped_at': datetime.now(timezone.utc).isoformat()
```

### 3. Parse financial data properly
```python
'cash_flow': parse_financial(raw_listing.get("cashFlow"))  # For Index ranking
'revenue': parse_financial(raw_listing.get("grossSales"))   # For Top10 ranking
'price': parse_financial(raw_listing.get("price"))
```

### 4. Calculate or set `quality_score` (for Top10)
```python
# Option A: Calculate based on metrics
quality_score = calculate_quality_score(price, revenue, cash_flow)

# Option B: Default to high value for new listings
'quality_score': 100  # Will rank at top initially
```

### 5. Include title with cleaning keywords
```python
'title': raw_listing.get("header")  # Should contain "cleaning", "janitorial", etc.
```

---

## 📊 Exclude Keywords (Don't appear if title contains these)

```python
EXCLUDES = [
    "%dry%clean%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%",
    "%convenience%", "%grocery%", "%bakery%", "%printing%", "%marketing%",
    "%construction%", "%contractor%", "%roofing%", "%plumbing%", "%hvac%",
    "%landscap%", "%pest%", "%security%", "%catering%", "%lawn%", "%painting%",
    "%glass%", "%electrical%"
]
```

---

## 🔍 Column Name Mapping Issues

**IMPORTANT**: Your scraper's column names may not match the frontend queries!

### Frontend expects (PostgREST):
- `is_active` (boolean)
- `scraped_at` (timestamp)
- `quality_score` (numeric)

### Your scraper might be inserting:
- Different column names
- Missing these columns entirely

### Solution:
Check your database schema and ensure these columns exist:
```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quality_score NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ DEFAULT NOW();
```

---

## 💡 Recommendations

1. **Add `is_active` to your scraper** - Default to `true`
2. **Add `quality_score` calculation** - Based on financial metrics
3. **Ensure `scraped_at` is always set** - Use current timestamp
4. **Parse all financial fields** - `cash_flow`, `revenue`, `price`
5. **Test with sample query** - Run the queries manually to verify

---

## 🧪 Testing Your Scraper

After scraping, test if listings appear:

```sql
-- Test Index page query
SELECT listing_id, title, cash_flow, price, scraped_at, is_active
FROM listings
WHERE title ILIKE '%cleaning%'
  AND is_active = true
  AND scraped_at >= NOW() - INTERVAL '90 days'
ORDER BY cash_flow DESC NULLS LAST, price DESC NULLS LAST
LIMIT 10;

-- Test Top10 page query
SELECT listing_id, title, quality_score, revenue, price, is_active
FROM listings
WHERE title ILIKE '%cleaning%'
  AND is_active = true
  AND price > 0
ORDER BY quality_score DESC NULLS LAST, revenue DESC NULLS LAST
LIMIT 10;
```

---

Generated: 2025-10-23
Source: pages/index.tsx, pages/top10.tsx, app/api/listings/route.ts
