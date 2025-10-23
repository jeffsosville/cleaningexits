-- ============================================================================
-- MIGRATION: Add is_active and quality_score columns
-- ============================================================================
-- These columns are REQUIRED for listings to appear on Index and Top10 pages
-- Without these, ALL listings will be filtered out by the frontend queries
-- ============================================================================

-- Add is_active column (CRITICAL - frontend filters by this)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add quality_score column (CRITICAL - Top10 page sorts by this)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quality_score NUMERIC;

-- Update existing listings to be active
UPDATE listings SET is_active = true WHERE is_active IS NULL;

-- Set default quality_score for existing listings (based on financials if available)
UPDATE listings
SET quality_score = CASE
    WHEN cash_flow > 200000 THEN 90
    WHEN cash_flow > 100000 THEN 80
    WHEN cash_flow > 50000 THEN 75
    WHEN revenue > 1000000 THEN 85
    WHEN revenue > 500000 THEN 75
    WHEN revenue > 250000 THEN 70
    ELSE 65
END
WHERE quality_score IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_quality_score ON listings(quality_score DESC NULLS LAST);

-- Add composite index for Top10 query
CREATE INDEX IF NOT EXISTS idx_listings_top10 ON listings(is_active, quality_score DESC, revenue DESC, asking_price DESC);

-- Add composite index for Index page query
CREATE INDEX IF NOT EXISTS idx_listings_index ON listings(is_active, scraped_at DESC, cash_flow DESC, asking_price DESC);

-- Verify the changes
SELECT
    COUNT(*) as total_listings,
    COUNT(*) FILTER (WHERE is_active = true) as active_listings,
    COUNT(*) FILTER (WHERE quality_score IS NOT NULL) as listings_with_score,
    AVG(quality_score) as avg_quality_score
FROM listings;

COMMENT ON COLUMN listings.is_active IS 'Required for frontend display. Set to true for listings to appear on Index/Top10 pages';
COMMENT ON COLUMN listings.quality_score IS 'Ranking score (0-100) for Top10 page. Calculated from price, revenue, cash_flow';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
