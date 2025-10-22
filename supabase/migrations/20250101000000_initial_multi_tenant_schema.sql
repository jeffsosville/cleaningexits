-- Multi-Tenant Business Listing Marketplace Schema
-- This schema supports multiple verticals with data isolation via RLS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Vertical identifiers (should match config/types.ts)
CREATE TYPE vertical_slug AS ENUM ('cleaning', 'landscape', 'hvac');

-- Lead types
CREATE TYPE lead_type AS ENUM ('buyer', 'seller');

-- Lead status
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost');

-- Listing status
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'pending', 'sold', 'archived');

-- Deal status
CREATE TYPE deal_status AS ENUM ('negotiating', 'due_diligence', 'financing', 'closing', 'closed', 'cancelled');

-- Scraper status
CREATE TYPE scraper_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BROKERS: Can work across multiple verticals
-- ----------------------------------------------------------------------------
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  license_number VARCHAR(100),
  bio TEXT,
  photo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit fields
  created_by UUID,
  updated_by UUID
);

-- Junction table for broker-vertical relationship (many-to-many)
CREATE TABLE broker_verticals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  vertical_id vertical_slug NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- Primary vertical for the broker
  commission_rate DECIMAL(5,2), -- Custom commission rate per vertical (e.g., 10.00 = 10%)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(broker_id, vertical_id)
);

-- ----------------------------------------------------------------------------
-- LISTINGS: Business listings with vertical isolation
-- ----------------------------------------------------------------------------
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical_id vertical_slug NOT NULL,

  -- Basic information
  title VARCHAR(500) NOT NULL,
  description TEXT,
  slug VARCHAR(500) UNIQUE NOT NULL, -- URL-friendly identifier

  -- Location
  city VARCHAR(255),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'US',
  zip_code VARCHAR(20),

  -- Financial details
  asking_price DECIMAL(15,2),
  revenue DECIMAL(15,2),
  sde DECIMAL(15,2), -- Seller's Discretionary Earnings
  ebitda DECIMAL(15,2),
  cash_flow DECIMAL(15,2),
  inventory_value DECIMAL(15,2),

  -- Business details
  year_established INTEGER,
  employees_count INTEGER,
  category VARCHAR(100), -- Links to vertical categories

  -- Listing metadata
  status listing_status DEFAULT 'draft',
  broker_id UUID REFERENCES brokers(id) ON DELETE SET NULL,
  source VARCHAR(100), -- 'manual', 'bizbuysell', 'bizquest', etc.
  external_id VARCHAR(255), -- ID from external source
  external_url TEXT, -- Original listing URL

  -- Media
  images JSONB, -- Array of image URLs with metadata
  documents JSONB, -- Array of document URLs with metadata

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,

  -- Custom fields per vertical
  custom_fields JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- LEADS: Buyer and seller leads per vertical
-- ----------------------------------------------------------------------------
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical_id vertical_slug NOT NULL,

  -- Lead type and status
  type lead_type NOT NULL,
  status lead_status DEFAULT 'new',

  -- Contact information
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),

  -- Lead details
  message TEXT,
  budget_min DECIMAL(15,2), -- For buyers
  budget_max DECIMAL(15,2), -- For buyers
  business_value DECIMAL(15,2), -- For sellers
  preferred_location VARCHAR(255),
  preferred_categories JSONB, -- Array of category IDs

  -- Source tracking
  source VARCHAR(100), -- 'website', 'referral', 'paid_ad', etc.
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  referrer_url TEXT,

  -- Assignment
  assigned_broker_id UUID REFERENCES brokers(id) ON DELETE SET NULL,
  related_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,

  -- Communication tracking
  last_contacted_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  notes JSONB, -- Array of note objects with timestamps

  -- Custom fields
  custom_fields JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ----------------------------------------------------------------------------
-- DEALS: Closed transactions
-- ----------------------------------------------------------------------------
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical_id vertical_slug NOT NULL,

  -- Deal parties
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  buyer_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  seller_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  broker_id UUID REFERENCES brokers(id) ON DELETE SET NULL,

  -- Deal information
  status deal_status DEFAULT 'negotiating',
  deal_title VARCHAR(500) NOT NULL,

  -- Financial details
  offered_price DECIMAL(15,2),
  final_price DECIMAL(15,2),
  commission_amount DECIMAL(15,2),
  commission_rate DECIMAL(5,2),

  -- Timeline
  offer_date DATE,
  acceptance_date DATE,
  expected_close_date DATE,
  actual_close_date DATE,

  -- Documentation
  documents JSONB, -- LOI, purchase agreement, due diligence docs

  -- Notes and communication
  notes JSONB,

  -- Custom fields
  custom_fields JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ----------------------------------------------------------------------------
-- SCRAPER_RUNS: Tracking scraper jobs for broker sources
-- ----------------------------------------------------------------------------
CREATE TABLE scraper_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical_id vertical_slug NOT NULL,

  -- Scraper configuration
  source_name VARCHAR(100) NOT NULL, -- 'BizBuySell', 'BizQuest', etc.
  source_url TEXT NOT NULL,

  -- Run details
  status scraper_status DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Results
  listings_found INTEGER DEFAULT 0,
  listings_created INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  listings_skipped INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  run_metadata JSONB, -- Configuration, filters used, etc.

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- ----------------------------------------------------------------------------
-- SCRAPER_LOGS: Detailed logs per scraper run
-- ----------------------------------------------------------------------------
CREATE TABLE scraper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scraper_run_id UUID NOT NULL REFERENCES scraper_runs(id) ON DELETE CASCADE,

  -- Log entry
  log_level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error'
  message TEXT NOT NULL,
  details JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Brokers indexes
CREATE INDEX idx_brokers_email ON brokers(email);
CREATE INDEX idx_brokers_is_active ON brokers(is_active);
CREATE INDEX idx_broker_verticals_broker_id ON broker_verticals(broker_id);
CREATE INDEX idx_broker_verticals_vertical_id ON broker_verticals(vertical_id);
CREATE INDEX idx_broker_verticals_composite ON broker_verticals(broker_id, vertical_id);

-- Listings indexes (optimized for vertical-based queries)
CREATE INDEX idx_listings_vertical_id ON listings(vertical_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_vertical_status ON listings(vertical_id, status);
CREATE INDEX idx_listings_broker_id ON listings(broker_id);
CREATE INDEX idx_listings_slug ON listings(slug);
CREATE INDEX idx_listings_city_state ON listings(city, state);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_vertical_category ON listings(vertical_id, category);
CREATE INDEX idx_listings_asking_price ON listings(asking_price);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_published_at ON listings(published_at DESC);
CREATE INDEX idx_listings_source ON listings(source);
CREATE INDEX idx_listings_external_id ON listings(external_id);

-- Leads indexes (optimized for vertical-based queries)
CREATE INDEX idx_leads_vertical_id ON leads(vertical_id);
CREATE INDEX idx_leads_type ON leads(type);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_vertical_type_status ON leads(vertical_id, type, status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_assigned_broker_id ON leads(assigned_broker_id);
CREATE INDEX idx_leads_related_listing_id ON leads(related_listing_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_source ON leads(source);

-- Deals indexes (optimized for vertical-based queries)
CREATE INDEX idx_deals_vertical_id ON deals(vertical_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_vertical_status ON deals(vertical_id, status);
CREATE INDEX idx_deals_listing_id ON deals(listing_id);
CREATE INDEX idx_deals_buyer_lead_id ON deals(buyer_lead_id);
CREATE INDEX idx_deals_seller_lead_id ON deals(seller_lead_id);
CREATE INDEX idx_deals_broker_id ON deals(broker_id);
CREATE INDEX idx_deals_actual_close_date ON deals(actual_close_date DESC);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);

-- Scraper runs indexes (optimized for vertical-based queries)
CREATE INDEX idx_scraper_runs_vertical_id ON scraper_runs(vertical_id);
CREATE INDEX idx_scraper_runs_status ON scraper_runs(status);
CREATE INDEX idx_scraper_runs_vertical_source ON scraper_runs(vertical_id, source_name);
CREATE INDEX idx_scraper_runs_started_at ON scraper_runs(started_at DESC);
CREATE INDEX idx_scraper_logs_run_id ON scraper_logs(scraper_run_id);
CREATE INDEX idx_scraper_logs_created_at ON scraper_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- HELPER FUNCTION: Get user's vertical from JWT
-- ----------------------------------------------------------------------------
-- This function extracts the vertical_id from the JWT token
-- You'll need to set this in your auth token claims
CREATE OR REPLACE FUNCTION auth.user_vertical()
RETURNS vertical_slug AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'vertical_id', '')::vertical_slug;
$$ LANGUAGE sql STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'role') = 'admin',
    false
  );
$$ LANGUAGE sql STABLE;

-- Helper function to get user's broker_id from JWT
CREATE OR REPLACE FUNCTION auth.user_broker_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'broker_id', '')::UUID;
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- BROKERS: Admin can see all, brokers can see themselves
-- ----------------------------------------------------------------------------
CREATE POLICY "Brokers: Admin full access"
  ON brokers
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Brokers: View own profile"
  ON brokers
  FOR SELECT
  TO authenticated
  USING (id = auth.user_broker_id());

CREATE POLICY "Brokers: Update own profile"
  ON brokers
  FOR UPDATE
  TO authenticated
  USING (id = auth.user_broker_id())
  WITH CHECK (id = auth.user_broker_id());

-- Public read access for active brokers (for public directory)
CREATE POLICY "Brokers: Public read active"
  ON brokers
  FOR SELECT
  TO anon
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- BROKER_VERTICALS: Vertical-based access
-- ----------------------------------------------------------------------------
CREATE POLICY "Broker Verticals: Admin full access"
  ON broker_verticals
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Broker Verticals: Brokers view own"
  ON broker_verticals
  FOR SELECT
  TO authenticated
  USING (broker_id = auth.user_broker_id());

CREATE POLICY "Broker Verticals: Public read"
  ON broker_verticals
  FOR SELECT
  TO anon
  USING (true);

-- ----------------------------------------------------------------------------
-- LISTINGS: Vertical-based isolation
-- ----------------------------------------------------------------------------
CREATE POLICY "Listings: Admin full access"
  ON listings
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Listings: Vertical isolation for authenticated"
  ON listings
  FOR SELECT
  TO authenticated
  USING (vertical_id = auth.user_vertical() OR auth.is_admin());

CREATE POLICY "Listings: Brokers manage own listings"
  ON listings
  FOR ALL
  TO authenticated
  USING (
    broker_id = auth.user_broker_id()
    AND vertical_id = auth.user_vertical()
  )
  WITH CHECK (
    broker_id = auth.user_broker_id()
    AND vertical_id = auth.user_vertical()
  );

-- Public read access for active listings
CREATE POLICY "Listings: Public read active"
  ON listings
  FOR SELECT
  TO anon
  USING (status = 'active' AND published_at IS NOT NULL);

-- ----------------------------------------------------------------------------
-- LEADS: Vertical-based isolation
-- ----------------------------------------------------------------------------
CREATE POLICY "Leads: Admin full access"
  ON leads
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Leads: Vertical isolation"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    vertical_id = auth.user_vertical()
    OR assigned_broker_id = auth.user_broker_id()
    OR auth.is_admin()
  );

CREATE POLICY "Leads: Brokers manage assigned leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (
    assigned_broker_id = auth.user_broker_id()
    AND vertical_id = auth.user_vertical()
  )
  WITH CHECK (
    assigned_broker_id = auth.user_broker_id()
    AND vertical_id = auth.user_vertical()
  );

-- Allow lead creation from public forms
CREATE POLICY "Leads: Public create"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- DEALS: Vertical-based isolation
-- ----------------------------------------------------------------------------
CREATE POLICY "Deals: Admin full access"
  ON deals
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Deals: Vertical isolation"
  ON deals
  FOR SELECT
  TO authenticated
  USING (
    vertical_id = auth.user_vertical()
    OR broker_id = auth.user_broker_id()
    OR auth.is_admin()
  );

CREATE POLICY "Deals: Brokers manage own deals"
  ON deals
  FOR ALL
  TO authenticated
  USING (
    broker_id = auth.user_broker_id()
    AND vertical_id = auth.user_vertical()
  )
  WITH CHECK (
    broker_id = auth.user_broker_id()
    AND vertical_id = auth.user_vertical()
  );

-- ----------------------------------------------------------------------------
-- SCRAPER_RUNS: Vertical-based isolation
-- ----------------------------------------------------------------------------
CREATE POLICY "Scraper Runs: Admin full access"
  ON scraper_runs
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "Scraper Runs: Vertical isolation"
  ON scraper_runs
  FOR SELECT
  TO authenticated
  USING (vertical_id = auth.user_vertical() OR auth.is_admin());

-- ----------------------------------------------------------------------------
-- SCRAPER_LOGS: Admin only
-- ----------------------------------------------------------------------------
CREATE POLICY "Scraper Logs: Admin full access"
  ON scraper_logs
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON brokers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to get active listings count per vertical
CREATE OR REPLACE FUNCTION get_active_listings_count(v_id vertical_slug)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM listings
  WHERE vertical_id = v_id
    AND status = 'active'
    AND published_at IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- Function to get broker's listing count
CREATE OR REPLACE FUNCTION get_broker_listings_count(b_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM listings
  WHERE broker_id = b_id
    AND status = 'active';
$$ LANGUAGE sql STABLE;

-- Function to calculate deal conversion rate per vertical
CREATE OR REPLACE FUNCTION get_conversion_rate(v_id vertical_slug)
RETURNS DECIMAL AS $$
  SELECT
    CASE
      WHEN COUNT(*) FILTER (WHERE type = 'buyer') = 0 THEN 0
      ELSE (
        COUNT(DISTINCT d.buyer_lead_id)::DECIMAL /
        COUNT(*) FILTER (WHERE type = 'buyer')::DECIMAL * 100
      )
    END
  FROM leads l
  LEFT JOIN deals d ON l.id = d.buyer_lead_id AND d.status = 'closed'
  WHERE l.vertical_id = v_id;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active listings with broker info
CREATE VIEW active_listings_with_broker AS
SELECT
  l.*,
  b.name as broker_name,
  b.email as broker_email,
  b.company as broker_company,
  b.phone as broker_phone
FROM listings l
LEFT JOIN brokers b ON l.broker_id = b.id
WHERE l.status = 'active'
  AND l.published_at IS NOT NULL;

-- View: Lead pipeline by vertical
CREATE VIEW lead_pipeline AS
SELECT
  vertical_id,
  type,
  status,
  COUNT(*) as lead_count,
  COUNT(DISTINCT assigned_broker_id) as assigned_brokers,
  AVG(budget_max) as avg_budget,
  MIN(created_at) as oldest_lead,
  MAX(created_at) as newest_lead
FROM leads
GROUP BY vertical_id, type, status;

-- View: Deal metrics by vertical
CREATE VIEW deal_metrics AS
SELECT
  vertical_id,
  status,
  COUNT(*) as deal_count,
  SUM(final_price) as total_value,
  AVG(final_price) as avg_deal_size,
  SUM(commission_amount) as total_commission,
  AVG(EXTRACT(EPOCH FROM (actual_close_date - offer_date))/86400) as avg_days_to_close
FROM deals
WHERE actual_close_date IS NOT NULL
GROUP BY vertical_id, status;

-- ============================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL - COMMENT OUT FOR PRODUCTION)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
-- Insert sample broker
INSERT INTO brokers (name, email, company, phone, license_number)
VALUES
  ('John Smith', 'john@example.com', 'Smith Brokerage', '555-0100', 'BR12345'),
  ('Jane Doe', 'jane@example.com', 'Doe & Associates', '555-0200', 'BR67890');

-- Link brokers to verticals
INSERT INTO broker_verticals (broker_id, vertical_id, is_primary)
SELECT id, 'cleaning', true FROM brokers WHERE email = 'john@example.com'
UNION ALL
SELECT id, 'landscape', false FROM brokers WHERE email = 'john@example.com'
UNION ALL
SELECT id, 'hvac', true FROM brokers WHERE email = 'jane@example.com';

-- Insert sample listings
INSERT INTO listings (
  vertical_id, title, slug, description, city, state,
  asking_price, revenue, sde, status, category,
  broker_id, published_at
)
SELECT
  'cleaning',
  'Established Commercial Cleaning Business',
  'commercial-cleaning-seattle-wa-001',
  'Well-established commercial cleaning business serving Seattle metro area with 50+ recurring clients.',
  'Seattle',
  'WA',
  350000,
  500000,
  120000,
  'active',
  'commercial',
  (SELECT id FROM brokers WHERE email = 'john@example.com'),
  NOW()
UNION ALL
SELECT
  'landscape',
  'Full-Service Landscaping Company',
  'landscape-company-portland-or-001',
  'Profitable landscaping business with equipment, vehicles, and 30+ residential contracts.',
  'Portland',
  'OR',
  500000,
  750000,
  180000,
  'active',
  'lawn-maintenance',
  (SELECT id FROM brokers WHERE email = 'john@example.com'),
  NOW();

-- Insert sample leads
INSERT INTO leads (
  vertical_id, type, status, first_name, last_name,
  email, phone, budget_min, budget_max, source
)
VALUES
  ('cleaning', 'buyer', 'new', 'Bob', 'Johnson', 'bob@example.com', '555-1000', 200000, 400000, 'website'),
  ('landscape', 'seller', 'qualified', 'Alice', 'Williams', 'alice@example.com', '555-2000', NULL, NULL, 'referral'),
  ('hvac', 'buyer', 'contacted', 'Charlie', 'Brown', 'charlie@example.com', '555-3000', 500000, 1000000, 'paid_ad');
*/

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE brokers IS 'Business brokers who can work across multiple verticals';
COMMENT ON TABLE broker_verticals IS 'Many-to-many relationship between brokers and verticals';
COMMENT ON TABLE listings IS 'Business listings with vertical-based data isolation';
COMMENT ON TABLE leads IS 'Buyer and seller leads tracked per vertical';
COMMENT ON TABLE deals IS 'Closed transactions and deals in progress';
COMMENT ON TABLE scraper_runs IS 'Tracking of scraper jobs for automated listing imports';
COMMENT ON TABLE scraper_logs IS 'Detailed logs for each scraper run';

COMMENT ON COLUMN listings.custom_fields IS 'Vertical-specific fields stored as JSONB (e.g., equipment_included, vehicles_included for cleaning)';
COMMENT ON COLUMN leads.notes IS 'Array of note objects with structure: [{text, created_at, created_by}]';
COMMENT ON COLUMN deals.documents IS 'Array of document objects with structure: [{name, url, type, uploaded_at}]';
