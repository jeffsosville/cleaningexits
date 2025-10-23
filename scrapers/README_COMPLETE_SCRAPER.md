# BizBuySell Complete Scraper

Production-ready scraper based on [jeffsosville/bbs-listings-scraper](https://github.com/jeffsosville/bbs-listings-scraper) with enhancements:

- ✅ **Direct PostgreSQL connection** (bypasses PostgREST cache issues)
- ✅ **Multi-tenant vertical filtering** (cleaning, landscape, hvac)
- ✅ **State-by-state scraping** for complete coverage
- ✅ **Required display fields** (`is_active`, `quality_score`, `scraped_at`)
- ✅ **Multi-threaded concurrent scraping**
- ✅ **Automatic deduplication**
- ✅ **Quality score calculation** for Top10 ranking

---

## Prerequisites

### 1. Add Missing Database Columns

**CRITICAL:** Run this migration first or NO listings will appear on your website!

```bash
psql postgresql://postgres:YOUR_PASSWORD@db.tcsgmaozbhkldpwlorzk.supabase.co/postgres < database/migration_add_display_columns.sql
```

Or manually:

```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quality_score NUMERIC;
UPDATE listings SET is_active = true WHERE is_active IS NULL;
UPDATE listings SET quality_score = 75 WHERE quality_score IS NULL;
```

### 2. Add PostgreSQL Password to .env

```bash
cd scrapers
nano .env
```

Add:
```
POSTGRES_PASSWORD=your_postgres_password_here
```

Get password from: **Supabase Dashboard → Settings → Database**

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Usage

### Mode 1: Scrape All Listings (Fast - Original Behavior)

Scrapes all BizBuySell listings without state filtering:

```bash
# Cleaning vertical
python bizbuysell_complete_scraper.py --vertical cleaning --mode all --max-pages 500 --workers 10

# Landscape vertical
python bizbuysell_complete_scraper.py --vertical landscape --mode all --max-pages 500 --workers 10

# HVAC vertical
python bizbuysell_complete_scraper.py --vertical hvac --mode all --max-pages 500 --workers 10
```

### Mode 2: Scrape by State (Complete Coverage)

Scrapes state-by-state for comprehensive coverage:

```bash
# Scrape specific states
python bizbuysell_complete_scraper.py --vertical cleaning --mode states --states CA,NY,TX,FL

# Scrape ALL 51 states
python bizbuysell_complete_scraper.py --vertical cleaning --mode states --max-pages 100
```

---

## Features

### 1. Vertical Filtering

**Cleaning Services** includes:
- cleaning, janitorial, custodial, sanitation, maintenance
- maid service, housekeeping, carpet cleaning, window cleaning
- pressure washing, commercial cleaning, residential cleaning

**Excludes:**
- dry cleaning, restaurant, HVAC, plumbing, landscaping

### 2. Quality Score Calculation

Automatically calculates `quality_score` (0-100) based on:

```python
Base Score: 50

Revenue Bonus (up to +20):
- $1M+: +20
- $500K+: +15
- $250K+: +10
- $100K+: +5

Cash Flow Bonus (up to +20):
- $200K+: +20
- $100K+: +15
- $50K+: +10
- $25K+: +5

Multiple Bonus (up to +10):
- 0.5x-3.0x: +10
- 3.0x-5.0x: +5
```

### 3. Display Fields

Sets all required fields for frontend display:

```python
'is_active': True          # REQUIRED for Index/Top10 display
'quality_score': 75        # REQUIRED for Top10 sorting
'scraped_at': datetime     # REQUIRED for Index 90-day filter
```

### 4. Direct PostgreSQL Upserts

Uses `INSERT ... ON CONFLICT (id) DO UPDATE SET` for efficient updates:

- New listings: Inserted
- Existing listings: Price/financials updated
- Duplicate detection: By unique hash of (listNumber + urlStub + title)

---

## Output

```
======================================================================
BizBuySell Complete Scraper - Cleaning Services
Mode: ALL
======================================================================

[*] Obtaining authentication token...
[+] Authentication token obtained successfully
[*] Scraping ALL listings with 10 workers...
[+] Scraping complete! Total unique listings: 15000

[*] Saving 850 Cleaning Services listings to database...
[+] Saved 100/850
[+] Saved 200/850
...
[+] Save complete!

======================================================================
SCRAPING COMPLETE
======================================================================
Total Found: 15000
Matched Vertical: 850
Filtered Out: 14150
Saved to DB: 850
Errors: 0
======================================================================
```

---

## Verify Listings Appear

After scraping, test with SQL:

```sql
-- Check Index page query (Homepage)
SELECT
    title,
    is_active,
    quality_score,
    cash_flow,
    asking_price,
    scraped_at
FROM listings
WHERE title ILIKE '%cleaning%'
  AND is_active = true
  AND scraped_at >= NOW() - INTERVAL '90 days'
ORDER BY cash_flow DESC NULLS LAST, asking_price DESC NULLS LAST
LIMIT 10;

-- Check Top10 page query
SELECT
    title,
    is_active,
    quality_score,
    revenue,
    asking_price
FROM listings
WHERE title ILIKE '%cleaning%'
  AND is_active = true
  AND asking_price > 0
ORDER BY quality_score DESC NULLS LAST, revenue DESC NULLS LAST
LIMIT 10;
```

Both queries should return 10 listings. If they don't:
1. Check `is_active = true` for your listings
2. Check `quality_score IS NOT NULL`
3. Check `scraped_at` is recent (last 90 days for Index)

---

## Command Reference

```bash
# Show help
python bizbuysell_complete_scraper.py --help

# Quick test (1 page, 2 workers)
python bizbuysell_complete_scraper.py --vertical cleaning --mode all --max-pages 1 --workers 2

# Production run (all listings)
python bizbuysell_complete_scraper.py --vertical cleaning --mode all --max-pages 1000 --workers 20

# State-by-state (California only)
python bizbuysell_complete_scraper.py --vertical cleaning --mode states --states CA --max-pages 50

# State-by-state (top 10 states)
python bizbuysell_complete_scraper.py --vertical cleaning --mode states --states CA,NY,TX,FL,IL,PA,OH,GA,NC,MI

# State-by-state (ALL states)
python bizbuysell_complete_scraper.py --vertical cleaning --mode states --max-pages 100
```

---

## Comparison with Original Scraper

| Feature | Original | Enhanced |
|---------|----------|----------|
| Database | JSON files | Direct PostgreSQL |
| Vertical Filtering | No | Yes (3 verticals) |
| State Scraping | No | Yes (51 states) |
| Display Fields | No | Yes (is_active, quality_score) |
| Frontend Ready | No | Yes |
| Deduplication | Yes | Yes |
| Multi-threaded | Yes | Yes |
| Quality Scoring | No | Yes |

---

## Troubleshooting

### No listings appear on website

```sql
-- Check if listings exist
SELECT COUNT(*) FROM listings;

-- Check if listings are active
SELECT COUNT(*) FROM listings WHERE is_active = true;

-- Check if listings have quality_score
SELECT COUNT(*) FROM listings WHERE quality_score IS NOT NULL;

-- Fix inactive listings
UPDATE listings SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- Fix missing quality scores
UPDATE listings SET quality_score = 75 WHERE quality_score IS NULL;
```

### Connection errors

- Check `POSTGRES_PASSWORD` in `.env`
- Verify Supabase database is accessible
- Check firewall rules

### Scraper runs but saves 0 listings

- Check vertical keywords match your listings
- Review exclude keywords (may be filtering too much)
- Run in `--mode all` first to see total available

---

## Advanced Usage

### Custom Vertical Keywords

Edit `VERTICAL_CONFIGS` in the script to customize filtering:

```python
VERTICAL_CONFIGS = {
    'cleaning': {
        'include_keywords': ['your', 'keywords', 'here'],
        'exclude_keywords': ['franchise', 'restaurant']
    }
}
```

### Database Schema

The scraper maps BizBuySell fields to your schema:

| BizBuySell | Your DB |
|------------|---------|
| `header` | `title` |
| `price` | `asking_price` |
| `grossSales` | `revenue` |
| `cashFlow` | `cash_flow`, `sde` |
| `ebitda` | `ebitda` |
| `location` | `city`, `state` |

---

## Files

- `bizbuysell_complete_scraper.py` - Main scraper
- `requirements.txt` - Dependencies
- `.env.example` - Environment template
- `database/migration_add_display_columns.sql` - Required migration
- `CRITICAL_SCHEMA_ISSUES.md` - Schema documentation
- `DISPLAY_QUERY_REQUIREMENTS.md` - Frontend query reference

---

## Credits

Based on [jeffsosville/bbs-listings-scraper](https://github.com/jeffsosville/bbs-listings-scraper)

Enhanced by Claude Code with PostgreSQL integration and multi-tenant support.
