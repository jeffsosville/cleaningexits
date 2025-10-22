-- ============================================================================
-- MIGRATION: Add Multi-Tenant Support to Existing Schema
-- ============================================================================
-- This migration adds multi-tenant support to an existing listings table
-- and creates the scraper_runs and scraper_logs tables for tracking.
--
-- SAFE: This migration is non-destructive and preserves existing data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add missing columns to existing listings table
-- ----------------------------------------------------------------------------

-- Add vertical_slug column (defaults to 'cleaning' for existing records)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS vertical_slug TEXT DEFAULT 'cleaning';

-- Update constraint to allow the three verticals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_vertical'
    ) THEN
        ALTER TABLE listings
        ADD CONSTRAINT valid_vertical
        CHECK (vertical_slug IN ('cleaning', 'landscape', 'hvac'));
    END IF;
END $$;

-- Add missing columns (all nullable to not break existing data)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS asking_price NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_text TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS broker_account TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS broker_source TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS broker_contact TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS list_number TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS url_stub TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hot_property BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS recently_added BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS recently_updated BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS scraper_run_id TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Map existing columns to new format (for existing records)
UPDATE listings SET
    id = COALESCE(id, surrogate_key),
    title = COALESCE(title, header),
    asking_price = COALESCE(asking_price, price),
    listing_url = COALESCE(listing_url, urlStub),
    image_url = COALESCE(image_url, img),
    broker_contact = COALESCE(broker_contact, brokerContactFullName),
    broker_source = COALESCE(broker_source, brokerCompany),
    list_number = COALESCE(list_number, listNumber::TEXT),
    url_stub = COALESCE(url_stub, urlStub),
    hot_property = COALESCE(hot_property, hotProperty::BOOLEAN),
    recently_added = COALESCE(recently_added, recentlyAdded::BOOLEAN),
    recently_updated = COALESCE(recently_updated, recentlyUpdated::BOOLEAN)
WHERE id IS NULL OR title IS NULL;

-- Add status constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_status'
    ) THEN
        ALTER TABLE listings
        ADD CONSTRAINT valid_status
        CHECK (status IN ('pending', 'approved', 'archived'));
    END IF;
END $$;

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_listings_id ON listings(id);
CREATE INDEX IF NOT EXISTS idx_listings_vertical_slug ON listings(vertical_slug);
CREATE INDEX IF NOT EXISTS idx_listings_broker_source ON listings(broker_source);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_scraped_at ON listings(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_scraper_run_id ON listings(scraper_run_id);
CREATE INDEX IF NOT EXISTS idx_listings_city_state ON listings(city, state);
CREATE INDEX IF NOT EXISTS idx_listings_asking_price ON listings(asking_price);
CREATE INDEX IF NOT EXISTS idx_listings_vertical_status ON listings(vertical_slug, status);
CREATE INDEX IF NOT EXISTS idx_listings_vertical_created ON listings(vertical_slug, created_at DESC);

-- Full-text search indexes (if not exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_listings_title_search'
    ) THEN
        CREATE INDEX idx_listings_title_search
        ON listings USING gin(to_tsvector('english', COALESCE(title, header, '')));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_listings_description_search'
    ) THEN
        CREATE INDEX idx_listings_description_search
        ON listings USING gin(to_tsvector('english', COALESCE(description, '')));
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 2: Create scraper_runs table for execution tracking
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

-- Indexes for scraper_runs
CREATE INDEX IF NOT EXISTS idx_scraper_runs_vertical ON scraper_runs(vertical_slug);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_broker ON scraper_runs(broker_source);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON scraper_runs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_started ON scraper_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_vertical_broker ON scraper_runs(vertical_slug, broker_source, started_at DESC);


-- ----------------------------------------------------------------------------
-- STEP 3: Create scraper_logs table for detailed logging
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
  CONSTRAINT valid_log_level CHECK (level IN ('debug', 'info', 'warning', 'error'))
);

-- Note: We don't add the FK constraint to allow the tables to be independent
-- This prevents issues if scraper_runs are deleted

-- Indexes for scraper_logs
CREATE INDEX IF NOT EXISTS idx_scraper_logs_run_id ON scraper_logs(scraper_run_id);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_timestamp ON scraper_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_level ON scraper_logs(level);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_run_timestamp ON scraper_logs(scraper_run_id, timestamp DESC);


-- ----------------------------------------------------------------------------
-- STEP 4: Create optional scraper_patterns table for ML knowledge base
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS scraper_patterns (
  domain TEXT PRIMARY KEY,
  pattern_signature TEXT NOT NULL,
  success_count INTEGER DEFAULT 0,
  total_listings INTEGER DEFAULT 0,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_patterns_success ON scraper_patterns(success_count DESC);


-- ----------------------------------------------------------------------------
-- STEP 5: Create optional scraper_history table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS scraper_history (
  id BIGSERIAL PRIMARY KEY,
  domain TEXT,
  pattern_signature TEXT,
  listings_count INTEGER,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_history_domain ON scraper_history(domain);
CREATE INDEX IF NOT EXISTS idx_scraper_history_scraped_at ON scraper_history(scraped_at);


-- ----------------------------------------------------------------------------
-- STEP 6: Create views for analytics
-- ----------------------------------------------------------------------------

-- Active listings by vertical
CREATE OR REPLACE VIEW active_listings_by_vertical AS
SELECT
  vertical_slug,
  COUNT(*) as total_listings,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_listings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_listings,
  COUNT(*) FILTER (WHERE asking_price IS NOT NULL OR price IS NOT NULL) as listings_with_price,
  AVG(COALESCE(asking_price, price)) as avg_asking_price,
  MIN(COALESCE(asking_price, price)) as min_asking_price,
  MAX(COALESCE(asking_price, price)) as max_asking_price
FROM listings
WHERE status != 'archived' OR status IS NULL
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
GROUP BY sr.id, sr.vertical_slug, sr.broker_source, sr.status, sr.started_at, sr.completed_at, sr.total_listings_found, sr.new_listings, sr.error_message
ORDER BY sr.started_at DESC
LIMIT 50;


-- ----------------------------------------------------------------------------
-- STEP 7: Create trigger for updated_at
-- ----------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for listings table (if not exists)
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ----------------------------------------------------------------------------
-- STEP 8: Enable RLS (optional - comment out if not needed)
-- ----------------------------------------------------------------------------

-- Enable RLS on new tables
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role (used by scrapers)
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Service role has full access" ON scraper_runs;
    DROP POLICY IF EXISTS "Service role has full access" ON scraper_logs;

    -- Create new policies
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
EXCEPTION
    WHEN undefined_object THEN
        -- Policies don't exist, that's fine
        NULL;
END $$;


-- ----------------------------------------------------------------------------
-- MIGRATION COMPLETE
-- ----------------------------------------------------------------------------

-- Verify migration
DO $$
DECLARE
    listings_count INTEGER;
    runs_exists BOOLEAN;
    logs_exists BOOLEAN;
BEGIN
    -- Check listings table
    SELECT COUNT(*) INTO listings_count FROM listings;

    -- Check new tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'scraper_runs'
    ) INTO runs_exists;

    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'scraper_logs'
    ) INTO logs_exists;

    -- Print summary
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'MIGRATION COMPLETE';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Existing listings: %', listings_count;
    RAISE NOTICE 'scraper_runs table: %', CASE WHEN runs_exists THEN 'CREATED' ELSE 'FAILED' END;
    RAISE NOTICE 'scraper_logs table: %', CASE WHEN logs_exists THEN 'CREATED' ELSE 'FAILED' END;
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Your scrapers should now work!';
    RAISE NOTICE '==================================================';
END $$;
