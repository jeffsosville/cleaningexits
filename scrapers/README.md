# BizBuySell Scrapers - Complete Guide

Production-ready scrapers for BizBuySell with PostgreSQL integration, vertical filtering, and multi-state support.

---

## 📁 Files

| File | Purpose |
|------|---------|
| `business_scraper.py` | Main scraper (original from bbs-listings-scraper) |
| `combiner.py` | Combines JSON files and imports to database |
| `broker_analyzer.py` | Analyzes broker performance from listings |
| `requirements.txt` | Python dependencies |
| `.env.example` | Environment variables template |
| `README_COMPLETE_SCRAPER.md` | Detailed documentation |
| `CRITICAL_SCHEMA_ISSUES.md` | Schema troubleshooting |
| `DISPLAY_QUERY_REQUIREMENTS.md` | Frontend query reference |

---

## 🚀 Quick Start

### 1. Run Database Migration

**CRITICAL:** Without this, NO listings will appear on your website!

```bash
psql postgresql://postgres:YOUR_PASSWORD@db.tcsgmaozbhkldpwlorzk.supabase.co/postgres \
  < ../database/migration_add_display_columns.sql
```

### 2. Setup Environment

```bash
# Add PostgreSQL password
echo "POSTGRES_PASSWORD=your_password" >> .env

# Install dependencies
pip install -r requirements.txt
```

### 3. Run Scraper

```bash
# Quick test (1 page, 2 workers)
python business_scraper.py --vertical cleaning --max-pages 1 --workers 2

# Production run
python business_scraper.py --vertical cleaning --max-pages 500 --workers 10

# Save to JSON
python business_scraper.py --vertical cleaning --json

# State-specific
python business_scraper.py --vertical cleaning --state CA
```

---

## 📊 Two Workflow Options

### Workflow 1: Direct to Database (Recommended)

Scrape and save directly to PostgreSQL:

```bash
# Scrape all cleaning businesses
python business_scraper.py --vertical cleaning --max-pages 500 --workers 10

# Result: Listings saved directly to database with:
# - is_active = true
# - quality_score calculated
# - scraped_at = now()
```

### Workflow 2: JSON First, Then Import

Scrape to JSON files, combine, then import:

```bash
# Step 1: Scrape to JSON files (by state)
python business_scraper.py --vertical cleaning --state CA --json
python business_scraper.py --vertical cleaning --state NY --json
python business_scraper.py --vertical cleaning --state TX --json
# ... repeat for other states

# Step 2: Combine JSON files
python combiner.py --prefix "bizbuysell_cleaning_" --output combined_cleaning.json

# Step 3: Import to database
python combiner.py --prefix "bizbuysell_cleaning_" --database --vertical cleaning
```

---

## 🎯 Use Cases

### Use Case 1: Quick Test Run

Test scraper on 1 page:

```bash
python business_scraper.py --vertical cleaning --max-pages 1 --workers 2
```

Expected output:
```
Total Found: 100-200
Matched Vertical: 10-30
Saved: 10-30
```

### Use Case 2: Full State Scrape

Scrape all listings in California:

```bash
python business_scraper.py --vertical cleaning --state CA --max-pages 100
```

### Use Case 3: Multi-State Batch

Scrape multiple states to JSON, then combine:

```bash
# Scrape major states
for state in CA NY TX FL IL PA OH GA NC MI; do
    python business_scraper.py --vertical cleaning --state $state --json
    sleep 60  # Rate limiting
done

# Combine all JSON files
python combiner.py --prefix "bizbuysell_cleaning_" --output all_states.json --database
```

### Use Case 4: All Listings (No State Filter)

Scrape everything:

```bash
python business_scraper.py --vertical cleaning --max-pages 1000 --workers 20
```

### Use Case 5: Broker Performance Analysis

Analyze which brokers have the most listings:

```bash
# Scrape to JSON
python business_scraper.py --vertical cleaning --json --max-pages 500

# Analyze broker performance
python broker_analyzer.py --input bizbuysell_cleaning_listings.json
```

Expected output:
```
TOP 10 BROKERS BY NUMBER OF LISTINGS
#1 Acme Business Brokers
   Listings: 45 | Avg Price: $350,000
   Contact: John Smith | (555) 123-4567
   Profile: https://www.bizbuysell.com/broker/...

#2 Superior Business Sales
   Listings: 38 | Avg Price: $425,000
   ...
```

---

## 🛠️ Command Reference

### business_scraper.py

```bash
# Show help
python business_scraper.py --help

# Required arguments:
--vertical      # cleaning, landscape, or hvac

# Optional arguments:
--max-pages N   # Max pages to scrape (default: 500)
--workers N     # Concurrent workers (default: 10)
--state XX      # State code filter (e.g., CA, NY, TX)
--json          # Save to JSON instead of database
--both          # Save to both database and JSON
```

### combiner.py

```bash
# Show help
python combiner.py --help

# Combine JSON files (no database)
python combiner.py --prefix "bizbuysell_" --output combined.json --json-only

# Combine and import to database
python combiner.py --prefix "bizbuysell_" --database --vertical cleaning

# Combine without filtering
python combiner.py --prefix "bizbuysell_" --no-filter --database
```

### broker_analyzer.py

```bash
# Show help
python broker_analyzer.py --help

# Analyze default file (bizbuysell_all_listings.json)
python broker_analyzer.py

# Analyze specific JSON file
python broker_analyzer.py --input bizbuysell_cleaning_listings.json

# Custom output files
python broker_analyzer.py --output-csv my_brokers.csv --output-json my_brokers.json

# Skip intermediate brokers.json file
python broker_analyzer.py --no-brokers-json
```

---

## 📈 Vertical Filtering

### Cleaning Services

**Includes:**
- cleaning, janitorial, custodial, sanitation, maintenance
- maid service, housekeeping, carpet cleaning, window cleaning
- pressure washing, commercial/residential cleaning

**Excludes:**
- dry cleaning, restaurant, HVAC, plumbing, landscaping

### Landscape Services

**Includes:**
- landscape, landscaping, lawn care, lawn maintenance
- irrigation, hardscape, tree service, snow removal

**Excludes:**
- restaurant, HVAC, plumbing, cleaning, pool, spa

### HVAC Services

**Includes:**
- hvac, heating, cooling, air conditioning, furnace
- ventilation, refrigeration, climate control

**Excludes:**
- restaurant, cleaning, landscaping, pool, spa

---

## 🔍 Quality Score

Automatically calculated (0-100) based on:

```
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

---

## 🎓 Examples

### Example 1: Scrape Cleaning Businesses in California

```bash
python business_scraper.py --vertical cleaning --state CA --max-pages 50
```

Output:
```
Total Found: 5000
Matched Vertical: 350
Filtered Out: 4650
Saved: 350
```

### Example 2: Scrape All Verticals

```bash
# Scrape all three verticals
python business_scraper.py --vertical cleaning --max-pages 500
python business_scraper.py --vertical landscape --max-pages 500
python business_scraper.py --vertical hvac --max-pages 500
```

### Example 3: Multi-State JSON Workflow

```bash
# 1. Scrape top 10 states to JSON
for state in CA NY TX FL IL PA OH GA NC MI; do
    echo "Scraping $state..."
    python business_scraper.py --vertical cleaning --state $state --max-pages 50 --json
done

# 2. Combine all JSON files
python combiner.py --prefix "bizbuysell_cleaning_" --output all_top10_states.json

# 3. Import to database with vertical filtering
python combiner.py --prefix "bizbuysell_cleaning_" --database --vertical cleaning
```

### Example 4: Save to Both Database and JSON

```bash
python business_scraper.py --vertical cleaning --both --max-pages 500
```

This creates:
- Database entries with `is_active=true`, `quality_score`, etc.
- JSON file: `bizbuysell_cleaning_listings.json`

### Example 5: Analyze Broker Performance

```bash
# First scrape to JSON
python business_scraper.py --vertical cleaning --json --max-pages 500

# Then analyze brokers
python broker_analyzer.py --input bizbuysell_cleaning_listings.json
```

Output includes:
- `brokers.json` - Full data grouped by broker
- `brokers_report.csv` - Ranked broker performance table
- `brokers_report.json` - JSON version for parsing
- Console output showing top 10 brokers with stats

---

## 🚨 Troubleshooting

### No listings appear on website

```sql
-- Check if listings exist
SELECT COUNT(*) FROM listings WHERE vertical_slug = 'cleaning';

-- Check if listings are active
SELECT COUNT(*) FROM listings WHERE is_active = true;

-- Check quality scores
SELECT COUNT(*) FROM listings WHERE quality_score IS NOT NULL;

-- Fix inactive listings
UPDATE listings SET is_active = true WHERE is_active IS NULL;
UPDATE listings SET quality_score = 75 WHERE quality_score IS NULL;
```

### Connection errors

- Verify `POSTGRES_PASSWORD` in `.env`
- Check Supabase is accessible
- Test connection: `psql postgresql://postgres:PASSWORD@db.tcsgmaozbhkldpwlorzk.supabase.co/postgres`

### Scraper runs but saves 0 listings

- Check vertical keywords match your needs
- Try `--no-filter` flag to see all listings
- Review `filtered_out` count in output

### JSON files not combining

- Check file prefix matches: `bizbuysell_cleaning_*.json`
- Verify files are in current directory
- Use `--prefix` flag to specify custom prefix

---

## 📊 Expected Results

### Quick Test (1 page)

```
Total Found: 100-200 listings
Matched Vertical: 10-30 listings
Time: 5-10 seconds
```

### Full Run (500 pages)

```
Total Found: 15,000-20,000 listings
Matched Vertical: 800-1,500 listings
Time: 5-10 minutes
```

### State-Specific (CA, 50 pages)

```
Total Found: 3,000-5,000 listings
Matched Vertical: 200-400 listings
Time: 1-2 minutes
```

---

## 🔐 Security Notes

- Never commit `.env` file
- Keep `POSTGRES_PASSWORD` secure
- Use service role key for production
- Enable RLS on Supabase tables

---

## 📝 File Naming Conventions

### Scraper Output

```
bizbuysell_cleaning_listings.json
bizbuysell_landscape_listings.json
bizbuysell_hvac_listings.json
```

### State-Specific Output

```
bizbuysell_cleaning_CA.json
bizbuysell_cleaning_NY.json
bizbuysell_cleaning_TX.json
```

### Combined Output

```
combined_cleaning.json
all_states_cleaning.json
bizbuysell_all.json
```

---

## 🎯 Performance Tips

1. **Workers:** Use 10-20 workers for optimal speed
2. **Rate Limiting:** Add sleep between state scrapes
3. **Batch Size:** Process 100 listings per database commit
4. **Deduplication:** Handled automatically by ID hash
5. **Memory:** JSON workflow uses less memory for large datasets

---

## 📚 Additional Resources

- `README_COMPLETE_SCRAPER.md` - Detailed scraper documentation
- `CRITICAL_SCHEMA_ISSUES.md` - Schema troubleshooting guide
- `DISPLAY_QUERY_REQUIREMENTS.md` - Frontend query reference
- `../database/migration_add_display_columns.sql` - Required migration

---

## 🆘 Support

If you encounter issues:

1. Check `CRITICAL_SCHEMA_ISSUES.md` for schema problems
2. Verify database migration was run
3. Test with `--max-pages 1` first
4. Review `DISPLAY_QUERY_REQUIREMENTS.md` for frontend queries

---

## 🎉 Success Checklist

- [ ] Database migration run
- [ ] `.env` file configured with POSTGRES_PASSWORD
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Test scrape successful (`--max-pages 1`)
- [ ] Vertical filtering working (check `matched_vertical` count)
- [ ] Database entries created (`SELECT COUNT(*) FROM listings`)
- [ ] Listings appear on website (Index and Top10 pages)

---

## 📄 License

Based on [jeffsosville/bbs-listings-scraper](https://github.com/jeffsosville/bbs-listings-scraper)

Enhanced by Claude Code with PostgreSQL integration and multi-tenant support.
