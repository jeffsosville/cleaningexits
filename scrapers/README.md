# Multi-Tenant Business Listing Scrapers

Production-ready scraping system for business-for-sale listings across 3 verticals: **Cleaning Services**, **Landscape Services**, and **HVAC Services**.

## 🎯 Features

- **Multi-Vertical Support**: Cleaning, Landscape, HVAC
- **3 Scraper Types**: BizBuySell (API), Specialized Brokers, Unified Broker Network
- **Keyword Filtering**: Automatic vertical classification using include/exclude keywords
- **Smart Tracking**: scraper_runs and scraper_logs tables for monitoring
- **ML Pattern Detection**: Self-learning pattern database for general brokers
- **Comprehensive Coverage**: 6 specialized brokers + BizBuySell + 1000s of general brokers

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Setup](#setup)
3. [Database Schema](#database-schema)
4. [Scrapers Overview](#scrapers-overview)
5. [Usage Examples](#usage-examples)
6. [Orchestration](#orchestration)
7. [Vertical Configuration](#vertical-configuration)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                             │
│                  (orchestrator.py)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│  BizBuySell  │ │ Specialized  │ │ Unified Broker       │
│   Scraper    │ │   Brokers    │ │ Network (ML-based)   │
│              │ │              │ │                      │
│ • API-based  │ │ • Murphy     │ │ • Pattern Detection  │
│ • Fast       │ │ • Transworld │ │ • Self-Learning      │
│ • 1000s of   │ │ • Sunbelt    │ │ • General Brokers    │
│   listings   │ │ • VR         │ │                      │
│              │ │ • FCBB       │ │                      │
│              │ │ • Hedgestone │ │                      │
└──────┬───────┘ └──────┬───────┘ └──────┬───────────────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   KEYWORD        │
              │   FILTERING      │
              │                  │
              │ • include_kw     │
              │ • exclude_kw     │
              └────────┬─────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │      SUPABASE DATABASE      │
         ├─────────────────────────────┤
         │ • listings (vertical_slug)  │
         │ • scraper_runs              │
         │ • scraper_logs              │
         │ • scraper_patterns (ML KB)  │
         └─────────────────────────────┘
```

---

## 🚀 Setup

### 1. Install Dependencies

```bash
cd /home/user/cleaningexits/scrapers

# Install Python packages
pip install -r requirements.txt
```

**Requirements** (`requirements.txt`):
```
supabase-py>=2.0.0
python-dotenv>=1.0.0
playwright>=1.40.0
beautifulsoup4>=4.12.0
pandas>=2.0.0
colorama>=0.4.6
curl-cffi>=0.6.0
selenium>=4.15.0
webdriver-manager>=4.0.0
aiohttp>=3.9.0
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

### 3. Configure Environment

Create `.env` file in `/home/user/cleaningexits/scrapers/`:

```bash
# Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

### 4. Set Up Database

```bash
# Connect to Supabase and run schema
psql $SUPABASE_CONNECTION_STRING < ../database/schema.sql
```

Or use Supabase SQL Editor to run `../database/schema.sql`.

---

## 🗄️ Database Schema

### Tables Created

#### 1. `listings` - Main Listings Table

Stores all business listings across all verticals.

```sql
CREATE TABLE listings (
  id TEXT PRIMARY KEY,              -- SHA256 hash
  vertical_slug TEXT NOT NULL,      -- 'cleaning' | 'landscape' | 'hvac'

  -- Core fields
  title TEXT NOT NULL,
  location TEXT,
  city TEXT,
  state TEXT,

  -- Financial
  asking_price NUMERIC,
  cash_flow NUMERIC,
  ebitda NUMERIC,
  annual_revenue NUMERIC,

  -- Metadata
  broker_source TEXT NOT NULL,      -- 'BizBuySell', 'Murphy', etc.
  scraper_run_id TEXT,              -- FK to scraper_runs
  status TEXT DEFAULT 'pending',    -- 'pending' | 'approved' | 'archived'

  -- Timestamps
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_listings_vertical_slug` - Fast filtering by vertical
- `idx_listings_status` - Filter by approval status
- `idx_listings_vertical_status` - Combined index
- Full-text search on `title` and `description`

#### 2. `scraper_runs` - Execution Tracking

Tracks each scraper execution for monitoring and analytics.

```sql
CREATE TABLE scraper_runs (
  id TEXT PRIMARY KEY,              -- UUID
  vertical_slug TEXT NOT NULL,
  broker_source TEXT NOT NULL,
  scraper_type TEXT NOT NULL,       -- 'bizbuysell' | 'specialized' | 'unified'

  -- Execution
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,             -- 'running' | 'completed' | 'failed'

  -- Results
  total_listings_found INTEGER,
  new_listings INTEGER,
  updated_listings INTEGER,
  failed_listings INTEGER,

  -- Errors
  error_message TEXT
);
```

#### 3. `scraper_logs` - Detailed Event Logging

Logs events for debugging and monitoring.

```sql
CREATE TABLE scraper_logs (
  id TEXT PRIMARY KEY,              -- UUID
  scraper_run_id TEXT NOT NULL,    -- FK to scraper_runs
  timestamp TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL,              -- 'debug' | 'info' | 'warning' | 'error'
  message TEXT NOT NULL,
  context JSONB                     -- Additional data
);
```

#### 4. `scraper_patterns` - ML Knowledge Base

Stores learned patterns for ML-based scraper (optional).

```sql
CREATE TABLE scraper_patterns (
  domain TEXT PRIMARY KEY,
  pattern_signature TEXT NOT NULL,
  success_count INTEGER,
  total_listings INTEGER,
  first_seen TIMESTAMPTZ,
  last_used TIMESTAMPTZ
);
```

### Views

#### `active_listings_by_vertical`
```sql
SELECT
  vertical_slug,
  COUNT(*) as total_listings,
  AVG(asking_price) as avg_asking_price,
  ...
FROM listings
WHERE status != 'archived'
GROUP BY vertical_slug;
```

#### `scraper_performance`
```sql
SELECT
  vertical_slug,
  broker_source,
  COUNT(*) as total_runs,
  SUM(total_listings_found) as total_listings,
  AVG(duration_seconds) as avg_duration
FROM scraper_runs
GROUP BY vertical_slug, broker_source;
```

---

## 🤖 Scrapers Overview

### 1. BizBuySell Scraper

**File**: `bizbuysell_scraper_v2.py`

- **Type**: API-based
- **Speed**: Fast (parallel requests)
- **Coverage**: 10,000+ national listings
- **Filtering**: Keyword-based vertical classification

**Features**:
- Concurrent page fetching (10 workers)
- Automatic keyword filtering
- Saves to `listings` table with `vertical_slug`
- Tracks runs in `scraper_runs`

**Run standalone**:
```bash
python bizbuysell_scraper_v2.py --vertical cleaning --max-pages 100 --workers 10
```

### 2. Specialized Brokers Scraper

**File**: `specialized_scrapers_v2.py`

- **Type**: Custom scrapers for major brokers
- **Brokers**: Murphy, Hedgestone, Transworld, Sunbelt, VR, FCBB
- **Coverage**: 5,000+ franchise/commercial listings
- **Technologies**: Selenium (Murphy, Hedgestone), curl_cffi (others)

**Features**:
- Broker-specific extraction logic
- High accuracy (designed for each site)
- Vertical filtering
- Parallel execution

**Run standalone**:
```bash
# All specialized brokers
python specialized_scrapers_v2.py --vertical landscape

# Single broker
python specialized_scrapers_v2.py --vertical hvac --broker murphy
```

### 3. Unified Broker Network Scraper

**File**: `unified_broker_scraper_v2.py`

- **Type**: ML-based pattern detection
- **Coverage**: 1000s of small/regional brokers
- **Technology**: Playwright (headless Chrome) + BeautifulSoup
- **Intelligence**: Self-learning pattern database

**Features**:
- Detects repeating HTML patterns automatically
- Learns from successful scrapes
- ML-based pattern prediction
- Multi-page crawling (up to 100 pages)
- Vertical keyword filtering

**Run standalone**:
```bash
# Top 10 brokers for cleaning
python unified_broker_scraper_v2.py --vertical cleaning --top-n 10

# All brokers for landscape
python unified_broker_scraper_v2.py --vertical landscape --all
```

---

## 💡 Usage Examples

### Example 1: Scrape BizBuySell for Cleaning Vertical

```bash
cd /home/user/cleaningexits/scrapers
python bizbuysell_scraper_v2.py --vertical cleaning --max-pages 50
```

**Output**:
```
======================================================================
BizBuySell Scraper V2 - Multi-Tenant
======================================================================
Vertical: Cleaning Services (cleaning)
Max Pages: 50
Workers: 10
======================================================================

[INFO] Obtaining authentication token...
[INFO] Authentication token obtained successfully
[INFO] Starting to scrape Cleaning Services listings with 10 workers...
[INFO] Scraping complete! Total unique listings scraped: 2,450
[INFO] Filtering 2,450 listings for Cleaning Services...
[INFO] Filtered to 1,832 Cleaning Services listings
[INFO] Filtered out 618 non-matching listings
[INFO] Saving 1,832 listings to Supabase...
[INFO] ✓ Saved batch 1 (500 listings)
[INFO] ✓ Saved batch 2 (500 listings)
[INFO] ✓ Saved batch 3 (500 listings)
[INFO] ✓ Saved batch 4 (332 listings)

======================================================================
SCRAPING COMPLETE
======================================================================
Vertical: Cleaning Services
Total Found: 2,450
Matched Vertical: 1,832
Filtered Out: 618
New Listings: 1,832
Errors: 0
======================================================================
```

### Example 2: Run Specialized Scrapers for HVAC

```bash
python specialized_scrapers_v2.py --vertical hvac
```

**Output**:
```
======================================================================
SPECIALIZED SCRAPERS V2 - HVAC SERVICES
======================================================================
Scraping 6 specialized brokers...
======================================================================

======================================================================
Murphy Business & Financial Corporation
======================================================================
[Murphy] Page 1: 24 cards (+24 new) [Total: 24]
[Murphy] Page 2: 24 cards (+24 new) [Total: 48]
...
✓ SUCCESS: 156 Murphy listings
  142/156 with price
  89/156 with cash flow (SDE)
  ✓ Matched 23/156 listings to HVAC Services vertical
  ⚠ Filtered out 133 non-matching listings

...

======================================================================
SPECIALIZED SCRAPERS COMPLETE
======================================================================
Total listings: 287
Matched vertical: 287
======================================================================

  Saving 287 listings to Supabase...
    ✓ Saved batch 1 (100 listings)
    ✓ Saved batch 2 (100 listings)
    ✓ Saved batch 3 (87 listings)
  ✓ Saved 287/287 listings
```

### Example 3: Run All Scrapers for All Verticals (Orchestrator)

```bash
python orchestrator.py
```

**Output**:
```
======================================================================
MULTI-TENANT SCRAPER ORCHESTRATOR
======================================================================
Verticals: Cleaning Services, Landscape Services, HVAC Services
Scrapers: BizBuySell, Specialized Brokers, Unified Broker Network
Started: 2025-10-22 14:30:15
======================================================================

======================================================================
VERTICAL: CLEANING SERVICES
======================================================================

[1/9] BizBuySell → Cleaning Services
----------------------------------------------------------------------
... (BizBuySell output) ...
✓ BizBuySell completed: 1,832 listings

⏳ Waiting 5 seconds before next run...

[2/9] Specialized Brokers → Cleaning Services
----------------------------------------------------------------------
... (Specialized output) ...
✓ Specialized Brokers completed: 412 listings

⏳ Waiting 5 seconds before next run...

[3/9] Unified Broker Network → Cleaning Services
----------------------------------------------------------------------
... (Unified output) ...
✓ Unified Broker Network completed: 1,245 listings

======================================================================
VERTICAL: LANDSCAPE SERVICES
======================================================================
...

======================================================================
ORCHESTRATION COMPLETE
======================================================================
Duration: 45m 23s
Total Runs: 9
Successful: 9
Failed: 0
Total Listings: 12,456
======================================================================

Cleaning Services:
  ✓ BizBuySell                       1,832 listings
  ✓ Specialized Brokers                412 listings
  ✓ Unified Broker Network           1,245 listings
  ──────────────────────────────────────────────────
  Total:                             3,489 listings

Landscape Services:
  ✓ BizBuySell                       1,567 listings
  ✓ Specialized Brokers                289 listings
  ✓ Unified Broker Network           1,123 listings
  ──────────────────────────────────────────────────
  Total:                             2,979 listings

HVAC Services:
  ✓ BizBuySell                       2,134 listings
  ✓ Specialized Brokers                567 listings
  ✓ Unified Broker Network           1,287 listings
  ──────────────────────────────────────────────────
  Total:                             3,988 listings

======================================================================
```

### Example 4: Custom Orchestration

```bash
# Only BizBuySell and Specialized for Cleaning
python orchestrator.py --verticals cleaning --scrapers bizbuysell specialized

# Cleaning and Landscape with custom limits
python orchestrator.py \
  --verticals cleaning landscape \
  --bizbuysell-pages 50 \
  --unified-top-n 5
```

---

## 🎛️ Orchestration

The **orchestrator** (`orchestrator.py`) coordinates all scrapers across all verticals.

### Command-Line Options

```bash
python orchestrator.py [OPTIONS]
```

**Vertical Selection**:
- `--verticals cleaning landscape hvac` - Which verticals to scrape (default: all)

**Scraper Selection**:
- `--scrapers bizbuysell specialized unified` - Which scrapers to run (default: all)

**BizBuySell Config**:
- `--bizbuysell-pages 100` - Max pages to scrape (default: 100)
- `--bizbuysell-workers 10` - Parallel workers (default: 10)

**Unified Config**:
- `--unified-top-n 10` - Max brokers to scrape (default: 10)
- `--unified-category franchise` - Filter by category (optional)

**Orchestrator Options**:
- `--no-skip-errors` - Stop on first error (default: continue)
- `--delay 5` - Seconds between runs (default: 5)

### Full Example

```bash
python orchestrator.py \
  --verticals cleaning landscape \
  --scrapers bizbuysell specialized \
  --bizbuysell-pages 50 \
  --bizbuysell-workers 15 \
  --delay 10 \
  --no-skip-errors
```

---

## ⚙️ Vertical Configuration

Each vertical has:
- **Include Keywords**: Listings must match at least one
- **Exclude Keywords**: Listings matching any are filtered out

### Cleaning Services

**Include Keywords**:
```python
'cleaning', 'janitorial', 'custodial', 'sanitation', 'maintenance',
'maid service', 'housekeeping', 'carpet cleaning', 'window cleaning',
'pressure washing', 'commercial cleaning', 'residential cleaning'
```

**Exclude Keywords**:
```python
'restaurant', 'food service', 'hvac', 'plumbing', 'electrical',
'landscaping', 'lawn care', 'pool', 'spa', 'salon'
```

### Landscape Services

**Include Keywords**:
```python
'landscape', 'landscaping', 'lawn care', 'lawn maintenance',
'irrigation', 'hardscape', 'tree service', 'snow removal',
'lawn mowing', 'garden', 'turf care'
```

**Exclude Keywords**:
```python
'restaurant', 'food service', 'hvac', 'plumbing', 'electrical',
'cleaning', 'janitorial', 'pool', 'spa'
```

### HVAC Services

**Include Keywords**:
```python
'hvac', 'heating', 'cooling', 'air conditioning', 'furnace',
'ventilation', 'refrigeration', 'climate control', 'ductwork',
'heat pump', 'ac repair'
```

**Exclude Keywords**:
```python
'restaurant', 'food service', 'cleaning', 'janitorial',
'landscaping', 'lawn care', 'pool', 'spa'
```

---

## 🔍 Querying the Data

### Get All Cleaning Listings

```sql
SELECT *
FROM listings
WHERE vertical_slug = 'cleaning'
  AND status = 'approved'
ORDER BY created_at DESC
LIMIT 100;
```

### Get Listings with Financial Data

```sql
SELECT *
FROM listings
WHERE vertical_slug = 'hvac'
  AND asking_price IS NOT NULL
  AND cash_flow IS NOT NULL
ORDER BY asking_price DESC;
```

### Get Scraper Performance

```sql
SELECT * FROM scraper_performance
WHERE vertical_slug = 'landscape'
ORDER BY total_listings_found DESC;
```

### Get Recent Scraper Runs

```sql
SELECT
  vertical_slug,
  broker_source,
  status,
  total_listings_found,
  new_listings,
  started_at,
  completed_at
FROM scraper_runs
ORDER BY started_at DESC
LIMIT 20;
```

### Search by Keyword

```sql
SELECT *
FROM listings
WHERE vertical_slug = 'cleaning'
  AND (
    title ILIKE '%janitorial%'
    OR description ILIKE '%janitorial%'
  );
```

---

## 🐛 Troubleshooting

### Issue: "SUPABASE_URL not set"

**Solution**: Create `.env` file with Supabase credentials:
```bash
cd /home/user/cleaningexits/scrapers
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
EOF
```

### Issue: "playwright not installed"

**Solution**:
```bash
pip install playwright
playwright install chromium
```

### Issue: "Table 'listings' does not exist"

**Solution**: Run database schema:
```bash
psql $SUPABASE_CONNECTION_STRING < ../database/schema.sql
```

Or use Supabase SQL Editor.

### Issue: BizBuySell returns 401 Unauthorized

**Solution**: The auth token may have expired. The scraper automatically refreshes it on each run. If issue persists, check if BizBuySell changed their auth mechanism.

### Issue: Specialized scrapers fail with "element not found"

**Solution**: The website may have changed their HTML structure. Check the `specialized_scrapers_integration.py` file and update the CSS selectors.

### Issue: Too many listings filtered out

**Solution**: Review and adjust the `include_keywords` and `exclude_keywords` in the vertical configuration. The keywords may be too restrictive.

---

## 📊 Monitoring & Analytics

### Check Scraper Runs

```sql
-- Last 10 runs
SELECT * FROM recent_scraper_activity LIMIT 10;

-- Failed runs
SELECT *
FROM scraper_runs
WHERE status = 'failed'
ORDER BY started_at DESC;

-- Runs with errors
SELECT
  sr.vertical_slug,
  sr.broker_source,
  sr.error_message,
  COUNT(sl.id) FILTER (WHERE sl.level = 'error') as error_count
FROM scraper_runs sr
LEFT JOIN scraper_logs sl ON sr.id = sl.scraper_run_id
WHERE sr.status = 'failed'
GROUP BY sr.id, sr.vertical_slug, sr.broker_source, sr.error_message;
```

### Analyze Listing Quality

```sql
-- Listings with complete financial data
SELECT
  vertical_slug,
  COUNT(*) as total,
  COUNT(asking_price) as with_price,
  COUNT(cash_flow) as with_cashflow,
  COUNT(annual_revenue) as with_revenue,
  ROUND(COUNT(asking_price)::NUMERIC / COUNT(*) * 100, 1) as price_pct
FROM listings
GROUP BY vertical_slug;
```

---

## 🚀 Production Deployment

### Cron Job Setup

Run scrapers daily at 2 AM:

```bash
crontab -e
```

Add:
```bash
0 2 * * * cd /home/user/cleaningexits/scrapers && /usr/bin/python3 orchestrator.py >> /var/log/scraper-$(date +\%Y\%m\%d).log 2>&1
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install-deps && playwright install chromium

# Copy scrapers
COPY scrapers/ ./scrapers/
COPY database/ ./database/

# Run orchestrator
CMD ["python", "scrapers/orchestrator.py"]
```

---

## 📝 License

Proprietary - All Rights Reserved

---

## 🤝 Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review scraper logs in `scraper_logs` table
- Contact: [your-email@example.com]

---

**Last Updated**: October 22, 2025
**Version**: 2.0.0
