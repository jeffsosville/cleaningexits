-- ============================================================================
-- MULTI-TENANT SCRAPER SYSTEM - SUPABASE SCHEMA
-- ============================================================================
-- This schema supports 3 verticals: cleaning, landscape, hvac
-- Compatible with 3 scraper types: BizBuySell, Unified Broker, Specialized
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: listings
-- Main table for all business listings across all verticals
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  -- Primary key
  id TEXT PRIMARY KEY,                    -- SHA256 hash of unique identifier

  -- Vertical identification
  vertical_slug TEXT NOT NULL,            -- 'cleaning' | 'landscape' | 'hvac'

  -- Core listing fields
  title TEXT NOT NULL,                    -- Business name/title
  location TEXT,                          -- Full location string (e.g., "New York, NY")
  city TEXT,                              -- Extracted city
  state TEXT,                             -- Extracted state code (e.g., "NY")

  -- Financial fields (all nullable to support different data sources)
  asking_price NUMERIC,                   -- Asking price
  price_text TEXT,                        -- Original price text (for display)
  cash_flow NUMERIC,                      -- Annual cash flow / SDE
  ebitda NUMERIC,                         -- EBITDA
  annual_revenue NUMERIC,                 -- Annual revenue / gross sales

  -- Description and media
  description TEXT,                       -- Business description
  image_url TEXT,                         -- Primary image URL
  listing_url TEXT NOT NULL,              -- Source URL

  -- Categorization
  category_id TEXT,                       -- Category from vertical config
  business_type TEXT,                     -- Business type/industry

  -- Source tracking
  broker_account TEXT,                    -- Broker account ID (for unified scraper)
  broker_source TEXT NOT NULL,            -- Source name: 'BizBuySell', 'Murphy', etc.
  broker_contact TEXT,                    -- Broker contact name
  broker_company TEXT,                    -- Broker company name

  -- Metadata from different sources
  list_number TEXT,                       -- Original listing number from source
  url_stub TEXT,                          -- URL stub from BizBuySell
  region TEXT,                            -- Geographic region

  -- Status and flags
  status TEXT DEFAULT 'pending',          -- 'pending' | 'approved' | 'archived'
  hot_property BOOLEAN DEFAULT FALSE,     -- Featured listing
  recently_added BOOLEAN DEFAULT FALSE,   -- New listing flag
  recently_updated BOOLEAN DEFAULT FALSE, -- Updated flag

  -- Tracking
  scraper_run_id TEXT,                    -- FK to scraper_runs table
  scraped_at TIMESTAMPTZ NOT NULL,        -- When scraped from source
  created_at TIMESTAMPTZ DEFAULT NOW(),   -- When added to our system
  updated_at TIMESTAMPTZ DEFAULT NOW(),   -- Last update

  -- Constraints
  CONSTRAINT valid_vertical CHECK (vertical_slug IN ('cleaning', 'landscape', 'hvac')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'archived'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_vertical_slug ON listings(vertical_slug);
CREATE INDEX IF NOT EXISTS idx_listings_broker_source ON listings(broker_source);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_scraped_at ON listings(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_scraper_run_id ON listings(scraper_run_id);
CREATE INDEX IF NOT EXISTS idx_listings_city_state ON listings(city, state);
CREATE INDEX IF NOT EXISTS idx_listings_asking_price ON listings(asking_price);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_listings_title_search ON listings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_search ON listings USING gin(to_tsvector('english', description));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_vertical_status ON listings(vertical_slug, status);
CREATE INDEX IF NOT EXISTS idx_listings_vertical_created ON listings(vertical_slug, created_at DESC);


-- ----------------------------------------------------------------------------
-- TABLE: scraper_runs
-- Tracks each scraper execution for monitoring and analytics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scraper_runs (
  -- Primary key
  id TEXT PRIMARY KEY,                    -- UUID

  -- Run identification
  vertical_slug TEXT NOT NULL,            -- Which vertical was scraped
  broker_source TEXT NOT NULL,            -- Which broker: 'BizBuySell', 'Murphy', etc.
  scraper_type TEXT NOT NULL,             -- 'bizbuysell' | 'unified' | 'specialized'

  -- Execution tracking
  started_at TIMESTAMPTZ NOT NULL,        -- When scraper started
  completed_at TIMESTAMPTZ,               -- When scraper finished
  status TEXT NOT NULL DEFAULT 'running', -- 'running' | 'completed' | 'failed'

  -- Results tracking
  total_listings_found INTEGER DEFAULT 0,  -- Total listings scraped
  new_listings INTEGER DEFAULT 0,          -- New listings added
  updated_listings INTEGER DEFAULT 0,      -- Existing listings updated
  failed_listings INTEGER DEFAULT 0,       -- Failed to process

  -- Configuration used
  max_pages INTEGER,                       -- Max pages scraped
  rate_limit INTEGER,                      -- Requests per minute

  -- Error tracking
  error_message TEXT,                      -- Error message if failed
  error_stack TEXT,                        -- Full error stack trace

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_scraper_vertical CHECK (vertical_slug IN ('cleaning', 'landscape', 'hvac')),
  CONSTRAINT valid_scraper_status CHECK (status IN ('running', 'completed', 'failed')),
  CONSTRAINT valid_scraper_type CHECK (scraper_type IN ('bizbuysell', 'unified', 'specialized'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scraper_runs_vertical ON scraper_runs(vertical_slug);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_broker ON scraper_runs(broker_source);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON scraper_runs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_started ON scraper_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_vertical_broker ON scraper_runs(vertical_slug, broker_source, started_at DESC);


-- ----------------------------------------------------------------------------
-- TABLE: scraper_logs
-- Detailed logs for debugging and monitoring scraper execution
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scraper_logs (
  -- Primary key
  id TEXT PRIMARY KEY,                    -- UUID

  -- Foreign key
  scraper_run_id TEXT NOT NULL,           -- FK to scraper_runs

  -- Log details
  timestamp TIMESTAMPTZ NOT NULL,         -- When event occurred
  level TEXT NOT NULL,                    -- 'debug' | 'info' | 'warning' | 'error'
  message TEXT NOT NULL,                  -- Log message

  -- Additional context
  context JSONB,                          -- JSON object with additional data

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_log_level CHECK (level IN ('debug', 'info', 'warning', 'error')),
  CONSTRAINT fk_scraper_run FOREIGN KEY (scraper_run_id) REFERENCES scraper_runs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scraper_logs_run_id ON scraper_logs(scraper_run_id);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_timestamp ON scraper_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_level ON scraper_logs(level);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_run_timestamp ON scraper_logs(scraper_run_id, timestamp DESC);


-- ----------------------------------------------------------------------------
-- TABLE: vertical_configs (optional - for storing configs in DB)
-- Stores vertical configuration in database instead of code
-- This is OPTIONAL - you can continue using TypeScript configs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vertical_configs (
  -- Primary key
  slug TEXT PRIMARY KEY,                  -- 'cleaning' | 'landscape' | 'hvac'

  -- Basic info
  name TEXT NOT NULL,                     -- 'Cleaning Services'
  domain TEXT NOT NULL,                   -- 'cleaningexits.com'
  brand_color TEXT,                       -- '#3B82F6'

  -- Keywords for filtering
  include_keywords TEXT[],                -- Keywords to include
  exclude_keywords TEXT[],                -- Keywords to exclude
  seo_keywords TEXT[],                    -- SEO keywords

  -- Broker sources
  broker_sources JSONB,                   -- Array of broker source configs

  -- Valuation multiples
  valuation_multiples JSONB,              -- Revenue/SDE/EBITDA multiples

  -- Categories
  categories JSONB,                       -- Array of category configs

  -- Metadata
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_vertical_slug CHECK (slug IN ('cleaning', 'landscape', 'hvac'))
);

-- Seed vertical configs (example - optional)
INSERT INTO vertical_configs (slug, name, domain, brand_color, include_keywords, exclude_keywords, seo_keywords)
VALUES
  (
    'cleaning',
    'Cleaning Services',
    'cleaningexits.com',
    '#3B82F6',
    ARRAY['cleaning', 'janitorial', 'custodial', 'sanitation', 'maintenance', 'maid service', 'housekeeping', 'carpet cleaning', 'window cleaning', 'pressure washing'],
    ARRAY['restaurant', 'food service', 'hvac', 'plumbing', 'electrical', 'landscaping', 'lawn care'],
    ARRAY['cleaning business for sale', 'janitorial business for sale', 'commercial cleaning business', 'residential cleaning service', 'cleaning company acquisition']
  ),
  (
    'landscape',
    'Landscape Services',
    'landscapeexits.com',
    '#10B981',
    ARRAY['landscape', 'landscaping', 'lawn care', 'lawn maintenance', 'irrigation', 'hardscape', 'tree service', 'snow removal', 'lawn mowing', 'garden'],
    ARRAY['restaurant', 'food service', 'hvac', 'plumbing', 'electrical', 'cleaning', 'janitorial'],
    ARRAY['landscape business for sale', 'lawn care business for sale', 'landscaping company', 'lawn maintenance service', 'landscape acquisition']
  ),
  (
    'hvac',
    'HVAC Services',
    'hvacexits.com',
    '#EF4444',
    ARRAY['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'ventilation', 'refrigeration', 'climate control', 'ductwork'],
    ARRAY['restaurant', 'food service', 'cleaning', 'janitorial', 'landscaping', 'lawn care', 'plumbing', 'electrical'],
    ARRAY['hvac business for sale', 'heating cooling business', 'air conditioning company', 'hvac contractor', 'hvac acquisition']
  )
ON CONFLICT (slug) DO NOTHING;


-- ----------------------------------------------------------------------------
-- VIEWS for common queries
-- ----------------------------------------------------------------------------

-- Active listings by vertical
CREATE OR REPLACE VIEW active_listings_by_vertical AS
SELECT
  vertical_slug,
  COUNT(*) as total_listings,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_listings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_listings,
  COUNT(*) FILTER (WHERE asking_price IS NOT NULL) as listings_with_price,
  AVG(asking_price) as avg_asking_price,
  MIN(asking_price) as min_asking_price,
  MAX(asking_price) as max_asking_price
FROM listings
WHERE status != 'archived'
GROUP BY vertical_slug;

-- Scraper performance by source
CREATE OR REPLACE VIEW scraper_performance AS
SELECT
  vertical_slug,
  broker_source,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
  SUM(total_listings_found) as total_listings_found,
  SUM(new_listings) as total_new_listings,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM scraper_runs
GROUP BY vertical_slug, broker_source
ORDER BY vertical_slug, total_listings_found DESC;

-- Recent scraper activity
CREATE OR REPLACE VIEW recent_scraper_activity AS
SELECT
  sr.id,
  sr.vertical_slug,
  sr.broker_source,
  sr.status,
  sr.started_at,
  sr.completed_at,
  sr.total_listings_found,
  sr.new_listings,
  sr.error_message,
  COUNT(sl.id) as log_count,
  COUNT(sl.id) FILTER (WHERE sl.level = 'error') as error_count
FROM scraper_runs sr
LEFT JOIN scraper_logs sl ON sr.id = sl.scraper_run_id
GROUP BY sr.id
ORDER BY sr.started_at DESC
LIMIT 50;


-- ----------------------------------------------------------------------------
-- FUNCTIONS for common operations
-- ----------------------------------------------------------------------------

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for listings table
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for vertical_configs table
DROP TRIGGER IF EXISTS update_vertical_configs_updated_at ON vertical_configs;
CREATE TRIGGER update_vertical_configs_updated_at
  BEFORE UPDATE ON vertical_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (optional - for multi-user access)
-- ----------------------------------------------------------------------------

-- Enable RLS on tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_configs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role (used by scrapers)
CREATE POLICY "Service role has full access" ON listings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access" ON scraper_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access" ON scraper_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access" ON vertical_configs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public read access to approved listings (for anonymous users)
CREATE POLICY "Public can read approved listings" ON listings
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Public read access to vertical configs
CREATE POLICY "Public can read vertical configs" ON vertical_configs
  FOR SELECT
  TO anon
  USING (active = true);


-- ----------------------------------------------------------------------------
-- EXAMPLE QUERIES
-- ----------------------------------------------------------------------------

-- Get all cleaning listings
-- SELECT * FROM listings WHERE vertical_slug = 'cleaning' AND status = 'approved' ORDER BY created_at DESC LIMIT 10;

-- Get scraper performance for cleaning vertical
-- SELECT * FROM scraper_performance WHERE vertical_slug = 'cleaning';

-- Get recent scraper logs with errors
-- SELECT sl.* FROM scraper_logs sl WHERE sl.level = 'error' ORDER BY sl.timestamp DESC LIMIT 20;

-- Get listings by broker source
-- SELECT broker_source, COUNT(*) FROM listings WHERE vertical_slug = 'cleaning' GROUP BY broker_source;

-- Get listings with financials
-- SELECT * FROM listings WHERE vertical_slug = 'cleaning' AND asking_price IS NOT NULL AND cash_flow IS NOT NULL LIMIT 10;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
