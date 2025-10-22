/**
 * TypeScript types generated from Supabase schema
 * Multi-Tenant Business Listing Marketplace
 */

// ============================================================================
// ENUMS
// ============================================================================

export type VerticalSlug = 'cleaning' | 'landscape' | 'hvac';

export type LeadType = 'buyer' | 'seller';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost';

export type ListingStatus = 'draft' | 'active' | 'pending' | 'sold' | 'archived';

export type DealStatus = 'negotiating' | 'due_diligence' | 'financing' | 'closing' | 'closed' | 'cancelled';

export type ScraperStatus = 'pending' | 'running' | 'completed' | 'failed';

export type ScraperLogLevel = 'info' | 'warning' | 'error';

// ============================================================================
// TABLE TYPES
// ============================================================================

/**
 * Broker: Business broker who can work across multiple verticals
 */
export interface Broker {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  license_number: string | null;
  bio: string | null;
  photo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Broker Insert: Type for inserting new brokers
 */
export interface BrokerInsert {
  id?: string;
  email: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  license_number?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  website_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

/**
 * Broker Update: Type for updating brokers
 */
export interface BrokerUpdate {
  email?: string;
  name?: string;
  company?: string | null;
  phone?: string | null;
  license_number?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  website_url?: string | null;
  is_active?: boolean;
  updated_at?: string;
  updated_by?: string | null;
}

/**
 * Broker Vertical: Junction table for broker-vertical many-to-many relationship
 */
export interface BrokerVertical {
  id: string;
  broker_id: string;
  vertical_id: VerticalSlug;
  is_primary: boolean;
  commission_rate: number | null; // Decimal stored as number (e.g., 10.00 = 10%)
  created_at: string;
}

/**
 * Broker Vertical Insert
 */
export interface BrokerVerticalInsert {
  id?: string;
  broker_id: string;
  vertical_id: VerticalSlug;
  is_primary?: boolean;
  commission_rate?: number | null;
  created_at?: string;
}

/**
 * Listing: Business listing with vertical isolation
 */
export interface Listing {
  id: string;
  vertical_id: VerticalSlug;

  // Basic information
  title: string;
  description: string | null;
  slug: string;

  // Location
  city: string | null;
  state: string | null;
  country: string;
  zip_code: string | null;

  // Financial details
  asking_price: number | null;
  revenue: number | null;
  sde: number | null;
  ebitda: number | null;
  cash_flow: number | null;
  inventory_value: number | null;

  // Business details
  year_established: number | null;
  employees_count: number | null;
  category: string | null;

  // Listing metadata
  status: ListingStatus;
  broker_id: string | null;
  source: string | null;
  external_id: string | null;
  external_url: string | null;

  // Media
  images: ListingImage[] | null;
  documents: ListingDocument[] | null;

  // SEO
  meta_title: string | null;
  meta_description: string | null;

  // Custom fields per vertical
  custom_fields: Record<string, any> | null;

  // Audit fields
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  published_at: string | null;
  archived_at: string | null;
}

/**
 * Listing Insert
 */
export interface ListingInsert {
  id?: string;
  vertical_id: VerticalSlug;
  title: string;
  description?: string | null;
  slug: string;
  city?: string | null;
  state?: string | null;
  country?: string;
  zip_code?: string | null;
  asking_price?: number | null;
  revenue?: number | null;
  sde?: number | null;
  ebitda?: number | null;
  cash_flow?: number | null;
  inventory_value?: number | null;
  year_established?: number | null;
  employees_count?: number | null;
  category?: string | null;
  status?: ListingStatus;
  broker_id?: string | null;
  source?: string | null;
  external_id?: string | null;
  external_url?: string | null;
  images?: ListingImage[] | null;
  documents?: ListingDocument[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
  custom_fields?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  published_at?: string | null;
  archived_at?: string | null;
}

/**
 * Listing Update
 */
export interface ListingUpdate {
  title?: string;
  description?: string | null;
  slug?: string;
  city?: string | null;
  state?: string | null;
  country?: string;
  zip_code?: string | null;
  asking_price?: number | null;
  revenue?: number | null;
  sde?: number | null;
  ebitda?: number | null;
  cash_flow?: number | null;
  inventory_value?: number | null;
  year_established?: number | null;
  employees_count?: number | null;
  category?: string | null;
  status?: ListingStatus;
  broker_id?: string | null;
  source?: string | null;
  external_id?: string | null;
  external_url?: string | null;
  images?: ListingImage[] | null;
  documents?: ListingDocument[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
  custom_fields?: Record<string, any> | null;
  updated_at?: string;
  updated_by?: string | null;
  published_at?: string | null;
  archived_at?: string | null;
}

/**
 * Listing Image: Structure for images JSONB field
 */
export interface ListingImage {
  url: string;
  caption?: string;
  is_primary?: boolean;
  order?: number;
  uploaded_at?: string;
}

/**
 * Listing Document: Structure for documents JSONB field
 */
export interface ListingDocument {
  name: string;
  url: string;
  type: string; // 'financials', 'tax_returns', 'lease_agreement', etc.
  size_bytes?: number;
  uploaded_at?: string;
}

/**
 * Lead: Buyer or seller lead per vertical
 */
export interface Lead {
  id: string;
  vertical_id: VerticalSlug;

  // Lead type and status
  type: LeadType;
  status: LeadStatus;

  // Contact information
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;

  // Lead details
  message: string | null;
  budget_min: number | null;
  budget_max: number | null;
  business_value: number | null;
  preferred_location: string | null;
  preferred_categories: string[] | null;

  // Source tracking
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_url: string | null;

  // Assignment
  assigned_broker_id: string | null;
  related_listing_id: string | null;

  // Communication tracking
  last_contacted_at: string | null;
  contact_count: number;
  notes: LeadNote[] | null;

  // Custom fields
  custom_fields: Record<string, any> | null;

  // Audit fields
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Lead Insert
 */
export interface LeadInsert {
  id?: string;
  vertical_id: VerticalSlug;
  type: LeadType;
  status?: LeadStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  business_value?: number | null;
  preferred_location?: string | null;
  preferred_categories?: string[] | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer_url?: string | null;
  assigned_broker_id?: string | null;
  related_listing_id?: string | null;
  last_contacted_at?: string | null;
  contact_count?: number;
  notes?: LeadNote[] | null;
  custom_fields?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

/**
 * Lead Update
 */
export interface LeadUpdate {
  status?: LeadStatus;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  business_value?: number | null;
  preferred_location?: string | null;
  preferred_categories?: string[] | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer_url?: string | null;
  assigned_broker_id?: string | null;
  related_listing_id?: string | null;
  last_contacted_at?: string | null;
  contact_count?: number;
  notes?: LeadNote[] | null;
  custom_fields?: Record<string, any> | null;
  updated_at?: string;
  updated_by?: string | null;
}

/**
 * Lead Note: Structure for notes JSONB field
 */
export interface LeadNote {
  text: string;
  created_at: string;
  created_by: string;
  type?: 'call' | 'email' | 'meeting' | 'other';
}

/**
 * Deal: Closed transaction
 */
export interface Deal {
  id: string;
  vertical_id: VerticalSlug;

  // Deal parties
  listing_id: string | null;
  buyer_lead_id: string | null;
  seller_lead_id: string | null;
  broker_id: string | null;

  // Deal information
  status: DealStatus;
  deal_title: string;

  // Financial details
  offered_price: number | null;
  final_price: number | null;
  commission_amount: number | null;
  commission_rate: number | null;

  // Timeline
  offer_date: string | null;
  acceptance_date: string | null;
  expected_close_date: string | null;
  actual_close_date: string | null;

  // Documentation
  documents: DealDocument[] | null;

  // Notes
  notes: DealNote[] | null;

  // Custom fields
  custom_fields: Record<string, any> | null;

  // Audit fields
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Deal Insert
 */
export interface DealInsert {
  id?: string;
  vertical_id: VerticalSlug;
  listing_id?: string | null;
  buyer_lead_id?: string | null;
  seller_lead_id?: string | null;
  broker_id?: string | null;
  status?: DealStatus;
  deal_title: string;
  offered_price?: number | null;
  final_price?: number | null;
  commission_amount?: number | null;
  commission_rate?: number | null;
  offer_date?: string | null;
  acceptance_date?: string | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  documents?: DealDocument[] | null;
  notes?: DealNote[] | null;
  custom_fields?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

/**
 * Deal Update
 */
export interface DealUpdate {
  listing_id?: string | null;
  buyer_lead_id?: string | null;
  seller_lead_id?: string | null;
  broker_id?: string | null;
  status?: DealStatus;
  deal_title?: string;
  offered_price?: number | null;
  final_price?: number | null;
  commission_amount?: number | null;
  commission_rate?: number | null;
  offer_date?: string | null;
  acceptance_date?: string | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  documents?: DealDocument[] | null;
  notes?: DealNote[] | null;
  custom_fields?: Record<string, any> | null;
  updated_at?: string;
  updated_by?: string | null;
}

/**
 * Deal Document: Structure for documents JSONB field
 */
export interface DealDocument {
  name: string;
  url: string;
  type: 'loi' | 'purchase_agreement' | 'due_diligence' | 'closing_docs' | 'other';
  uploaded_at: string;
  uploaded_by?: string;
}

/**
 * Deal Note: Structure for notes JSONB field
 */
export interface DealNote {
  text: string;
  created_at: string;
  created_by: string;
  type?: 'milestone' | 'issue' | 'communication' | 'other';
}

/**
 * Scraper Run: Tracking scraper jobs
 */
export interface ScraperRun {
  id: string;
  vertical_id: VerticalSlug;

  // Scraper configuration
  source_name: string;
  source_url: string;

  // Run details
  status: ScraperStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;

  // Results
  listings_found: number;
  listings_created: number;
  listings_updated: number;
  listings_skipped: number;

  // Error tracking
  error_message: string | null;
  error_details: Record<string, any> | null;

  // Metadata
  run_metadata: Record<string, any> | null;

  // Audit fields
  created_at: string;
  created_by: string | null;
}

/**
 * Scraper Run Insert
 */
export interface ScraperRunInsert {
  id?: string;
  vertical_id: VerticalSlug;
  source_name: string;
  source_url: string;
  status?: ScraperStatus;
  started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
  listings_found?: number;
  listings_created?: number;
  listings_updated?: number;
  listings_skipped?: number;
  error_message?: string | null;
  error_details?: Record<string, any> | null;
  run_metadata?: Record<string, any> | null;
  created_at?: string;
  created_by?: string | null;
}

/**
 * Scraper Run Update
 */
export interface ScraperRunUpdate {
  status?: ScraperStatus;
  started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
  listings_found?: number;
  listings_created?: number;
  listings_updated?: number;
  listings_skipped?: number;
  error_message?: string | null;
  error_details?: Record<string, any> | null;
  run_metadata?: Record<string, any> | null;
}

/**
 * Scraper Log: Detailed logs per scraper run
 */
export interface ScraperLog {
  id: string;
  scraper_run_id: string;
  log_level: ScraperLogLevel;
  message: string;
  details: Record<string, any> | null;
  created_at: string;
}

/**
 * Scraper Log Insert
 */
export interface ScraperLogInsert {
  id?: string;
  scraper_run_id: string;
  log_level: ScraperLogLevel;
  message: string;
  details?: Record<string, any> | null;
  created_at?: string;
}

// ============================================================================
// VIEW TYPES
// ============================================================================

/**
 * Active Listings with Broker: View joining listings with broker info
 */
export interface ActiveListingWithBroker extends Listing {
  broker_name: string | null;
  broker_email: string | null;
  broker_company: string | null;
  broker_phone: string | null;
}

/**
 * Lead Pipeline: Aggregated lead metrics per vertical
 */
export interface LeadPipeline {
  vertical_id: VerticalSlug;
  type: LeadType;
  status: LeadStatus;
  lead_count: number;
  assigned_brokers: number;
  avg_budget: number | null;
  oldest_lead: string;
  newest_lead: string;
}

/**
 * Deal Metrics: Aggregated deal metrics per vertical
 */
export interface DealMetrics {
  vertical_id: VerticalSlug;
  status: DealStatus;
  deal_count: number;
  total_value: number | null;
  avg_deal_size: number | null;
  total_commission: number | null;
  avg_days_to_close: number | null;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Broker with Verticals: Broker joined with their vertical assignments
 */
export interface BrokerWithVerticals extends Broker {
  verticals: Array<{
    vertical_id: VerticalSlug;
    is_primary: boolean;
    commission_rate: number | null;
  }>;
}

/**
 * Listing with Relations: Listing with all related data
 */
export interface ListingWithRelations extends Listing {
  broker?: Broker;
  leads?: Lead[];
  deals?: Deal[];
}

/**
 * Lead with Relations: Lead with all related data
 */
export interface LeadWithRelations extends Lead {
  assigned_broker?: Broker;
  related_listing?: Listing;
  deals?: Deal[];
}

/**
 * Deal with Relations: Deal with all related data
 */
export interface DealWithRelations extends Deal {
  listing?: Listing;
  buyer_lead?: Lead;
  seller_lead?: Lead;
  broker?: Broker;
}

// ============================================================================
// DATABASE TYPE
// ============================================================================

/**
 * Main Database interface for Supabase client typing
 */
export interface Database {
  public: {
    Tables: {
      brokers: {
        Row: Broker;
        Insert: BrokerInsert;
        Update: BrokerUpdate;
      };
      broker_verticals: {
        Row: BrokerVertical;
        Insert: BrokerVerticalInsert;
        Update: Partial<BrokerVerticalInsert>;
      };
      listings: {
        Row: Listing;
        Insert: ListingInsert;
        Update: ListingUpdate;
      };
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: LeadUpdate;
      };
      deals: {
        Row: Deal;
        Insert: DealInsert;
        Update: DealUpdate;
      };
      scraper_runs: {
        Row: ScraperRun;
        Insert: ScraperRunInsert;
        Update: ScraperRunUpdate;
      };
      scraper_logs: {
        Row: ScraperLog;
        Insert: ScraperLogInsert;
        Update: Partial<ScraperLogInsert>;
      };
    };
    Views: {
      active_listings_with_broker: {
        Row: ActiveListingWithBroker;
      };
      lead_pipeline: {
        Row: LeadPipeline;
      };
      deal_metrics: {
        Row: DealMetrics;
      };
    };
    Functions: {
      get_active_listings_count: {
        Args: { v_id: VerticalSlug };
        Returns: number;
      };
      get_broker_listings_count: {
        Args: { b_id: string };
        Returns: number;
      };
      get_conversion_rate: {
        Args: { v_id: VerticalSlug };
        Returns: number;
      };
    };
    Enums: {
      vertical_slug: VerticalSlug;
      lead_type: LeadType;
      lead_status: LeadStatus;
      listing_status: ListingStatus;
      deal_status: DealStatus;
      scraper_status: ScraperStatus;
    };
  };
}
