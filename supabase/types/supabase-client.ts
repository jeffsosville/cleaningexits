/**
 * Typed Supabase client for multi-tenant marketplace
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Create a typed Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Helper to create a typed Supabase client with custom options
 */
export function createTypedSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: Parameters<typeof createClient>[2]
) {
  return createClient<Database>(supabaseUrl, supabaseKey, options);
}

/**
 * Type-safe table accessors
 */
export const db = {
  brokers: () => supabase.from('brokers'),
  brokerVerticals: () => supabase.from('broker_verticals'),
  listings: () => supabase.from('listings'),
  leads: () => supabase.from('leads'),
  deals: () => supabase.from('deals'),
  scraperRuns: () => supabase.from('scraper_runs'),
  scraperLogs: () => supabase.from('scraper_logs'),
} as const;

/**
 * Type-safe view accessors
 */
export const views = {
  activeListingsWithBroker: () => supabase.from('active_listings_with_broker'),
  leadPipeline: () => supabase.from('lead_pipeline'),
  dealMetrics: () => supabase.from('deal_metrics'),
} as const;

/**
 * Type-safe function callers
 */
export const functions = {
  getActiveListingsCount: (verticalId: Database['public']['Enums']['vertical_slug']) =>
    supabase.rpc('get_active_listings_count', { v_id: verticalId }),

  getBrokerListingsCount: (brokerId: string) =>
    supabase.rpc('get_broker_listings_count', { b_id: brokerId }),

  getConversionRate: (verticalId: Database['public']['Enums']['vertical_slug']) =>
    supabase.rpc('get_conversion_rate', { v_id: verticalId }),
} as const;

// Export types for convenience
export type {
  Database,
  Broker,
  BrokerInsert,
  BrokerUpdate,
  BrokerVertical,
  Listing,
  ListingInsert,
  ListingUpdate,
  Lead,
  LeadInsert,
  LeadUpdate,
  Deal,
  DealInsert,
  DealUpdate,
  ScraperRun,
  ScraperLog,
  VerticalSlug,
  LeadType,
  LeadStatus,
  ListingStatus,
  DealStatus,
  ScraperStatus,
} from './database.types';
