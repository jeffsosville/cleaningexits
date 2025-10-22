/**
 * Sample queries for common operations in the multi-tenant marketplace
 * These examples demonstrate how to use the typed Supabase client with RLS
 */

import { db, views, functions, supabase } from '../types/supabase-client';
import type {
  VerticalSlug,
  ListingInsert,
  LeadInsert,
  DealInsert,
  BrokerInsert,
  ListingStatus,
  LeadStatus,
} from '../types/database.types';

// ============================================================================
// BROKER QUERIES
// ============================================================================

/**
 * Get all brokers for a specific vertical
 */
export async function getBrokersByVertical(verticalId: VerticalSlug) {
  const { data, error } = await supabase
    .from('broker_verticals')
    .select(`
      *,
      broker:brokers(*)
    `)
    .eq('vertical_id', verticalId);

  return { data, error };
}

/**
 * Create a new broker and assign to verticals
 */
export async function createBrokerWithVerticals(
  broker: BrokerInsert,
  verticalIds: VerticalSlug[]
) {
  // Create broker
  const { data: newBroker, error: brokerError } = await db
    .brokers()
    .insert(broker)
    .select()
    .single();

  if (brokerError || !newBroker) {
    return { data: null, error: brokerError };
  }

  // Assign to verticals
  const verticalAssignments = verticalIds.map((verticalId, index) => ({
    broker_id: newBroker.id,
    vertical_id: verticalId,
    is_primary: index === 0, // First vertical is primary
  }));

  const { error: verticalError } = await db
    .brokerVerticals()
    .insert(verticalAssignments);

  if (verticalError) {
    return { data: null, error: verticalError };
  }

  return { data: newBroker, error: null };
}

/**
 * Get broker with all their verticals
 */
export async function getBrokerWithVerticals(brokerId: string) {
  const { data, error } = await supabase
    .from('brokers')
    .select(`
      *,
      verticals:broker_verticals(
        vertical_id,
        is_primary,
        commission_rate
      )
    `)
    .eq('id', brokerId)
    .single();

  return { data, error };
}

/**
 * Update broker's primary vertical
 */
export async function updateBrokerPrimaryVertical(
  brokerId: string,
  newPrimaryVertical: VerticalSlug
) {
  // Set all to non-primary
  await db
    .brokerVerticals()
    .update({ is_primary: false })
    .eq('broker_id', brokerId);

  // Set new primary
  const { data, error } = await db
    .brokerVerticals()
    .update({ is_primary: true })
    .eq('broker_id', brokerId)
    .eq('vertical_id', newPrimaryVertical)
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// LISTING QUERIES
// ============================================================================

/**
 * Get all active listings for a vertical
 */
export async function getActiveListingsByVertical(
  verticalId: VerticalSlug,
  options?: {
    limit?: number;
    offset?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    state?: string;
  }
) {
  let query = db
    .listings()
    .select('*')
    .eq('vertical_id', verticalId)
    .eq('status', 'active')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  // Apply filters
  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.minPrice) {
    query = query.gte('asking_price', options.minPrice);
  }
  if (options?.maxPrice) {
    query = query.lte('asking_price', options.maxPrice);
  }
  if (options?.state) {
    query = query.eq('state', options.state);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;
  return { data, error };
}

/**
 * Get listing by slug with broker info
 */
export async function getListingBySlug(slug: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      broker:brokers(
        id,
        name,
        email,
        company,
        phone,
        photo_url
      )
    `)
    .eq('slug', slug)
    .single();

  return { data, error };
}

/**
 * Create a new listing
 */
export async function createListing(listing: ListingInsert) {
  const { data, error } = await db
    .listings()
    .insert(listing)
    .select()
    .single();

  return { data, error };
}

/**
 * Update listing status
 */
export async function updateListingStatus(
  listingId: string,
  status: ListingStatus
) {
  const updates: any = { status };

  if (status === 'active') {
    updates.published_at = new Date().toISOString();
  } else if (status === 'archived') {
    updates.archived_at = new Date().toISOString();
  }

  const { data, error } = await db
    .listings()
    .update(updates)
    .eq('id', listingId)
    .select()
    .single();

  return { data, error };
}

/**
 * Search listings by keyword
 */
export async function searchListings(
  verticalId: VerticalSlug,
  keyword: string,
  limit: number = 20
) {
  const { data, error } = await db
    .listings()
    .select('*')
    .eq('vertical_id', verticalId)
    .eq('status', 'active')
    .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,city.ilike.%${keyword}%`)
    .limit(limit);

  return { data, error };
}

/**
 * Get broker's listings with stats
 */
export async function getBrokerListingsWithStats(brokerId: string) {
  const { data, error } = await db
    .listings()
    .select('*')
    .eq('broker_id', brokerId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };

  // Calculate stats
  const stats = {
    total: data.length,
    active: data.filter((l) => l.status === 'active').length,
    pending: data.filter((l) => l.status === 'pending').length,
    sold: data.filter((l) => l.status === 'sold').length,
    totalValue: data.reduce((sum, l) => sum + (l.asking_price || 0), 0),
  };

  return { data, stats, error: null };
}

/**
 * Get listings needing attention (drafts older than 7 days)
 */
export async function getListingsNeedingAttention(verticalId: VerticalSlug) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await db
    .listings()
    .select('*')
    .eq('vertical_id', verticalId)
    .eq('status', 'draft')
    .lt('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  return { data, error };
}

// ============================================================================
// LEAD QUERIES
// ============================================================================

/**
 * Create a new lead from a form submission
 */
export async function createLeadFromForm(
  lead: LeadInsert,
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }
) {
  const leadData: LeadInsert = {
    ...lead,
    ...utmParams,
    status: 'new',
    contact_count: 0,
  };

  const { data, error } = await db
    .leads()
    .insert(leadData)
    .select()
    .single();

  return { data, error };
}

/**
 * Get leads by vertical and status
 */
export async function getLeadsByVerticalAndStatus(
  verticalId: VerticalSlug,
  status?: LeadStatus
) {
  let query = db
    .leads()
    .select(`
      *,
      assigned_broker:brokers(
        id,
        name,
        email
      ),
      related_listing:listings(
        id,
        title,
        slug
      )
    `)
    .eq('vertical_id', verticalId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  return { data, error };
}

/**
 * Assign lead to broker
 */
export async function assignLeadToBroker(leadId: string, brokerId: string) {
  const { data, error } = await db
    .leads()
    .update({ assigned_broker_id: brokerId })
    .eq('id', leadId)
    .select()
    .single();

  return { data, error };
}

/**
 * Add note to lead
 */
export async function addNoteToLead(
  leadId: string,
  noteText: string,
  userId: string,
  noteType: 'call' | 'email' | 'meeting' | 'other' = 'other'
) {
  // First, get the current lead
  const { data: lead, error: fetchError } = await db
    .leads()
    .select('notes')
    .eq('id', leadId)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  // Add new note
  const notes = [
    ...(lead?.notes || []),
    {
      text: noteText,
      created_at: new Date().toISOString(),
      created_by: userId,
      type: noteType,
    },
  ];

  // Update lead with new notes and increment contact count
  const { data, error } = await db
    .leads()
    .update({
      notes,
      last_contacted_at: new Date().toISOString(),
      contact_count: (lead?.notes?.length || 0) + 1,
    })
    .eq('id', leadId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update lead status with note
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  note?: string,
  userId?: string
) {
  const updates: any = { status };

  if (note && userId) {
    // Get current notes
    const { data: lead } = await db.leads().select('notes').eq('id', leadId).single();

    updates.notes = [
      ...(lead?.notes || []),
      {
        text: note,
        created_at: new Date().toISOString(),
        created_by: userId,
        type: 'other',
      },
    ];
  }

  const { data, error } = await db
    .leads()
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get qualified buyer leads for a listing
 */
export async function getQualifiedBuyersForListing(
  listingId: string,
  verticalId: VerticalSlug
) {
  const { data: listing } = await db
    .listings()
    .select('asking_price, category, state')
    .eq('id', listingId)
    .single();

  if (!listing) return { data: null, error: new Error('Listing not found') };

  const { data, error } = await db
    .leads()
    .select('*')
    .eq('vertical_id', verticalId)
    .eq('type', 'buyer')
    .in('status', ['new', 'contacted', 'qualified'])
    .gte('budget_max', listing.asking_price || 0)
    .order('created_at', { ascending: false });

  return { data, error };
}

// ============================================================================
// DEAL QUERIES
// ============================================================================

/**
 * Create a new deal
 */
export async function createDeal(deal: DealInsert) {
  const { data, error } = await db
    .deals()
    .insert(deal)
    .select()
    .single();

  return { data, error };
}

/**
 * Get deals by vertical with all related data
 */
export async function getDealsByVertical(verticalId: VerticalSlug) {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      listing:listings(
        id,
        title,
        slug,
        asking_price
      ),
      buyer_lead:buyer_lead_id(
        id,
        first_name,
        last_name,
        email
      ),
      seller_lead:seller_lead_id(
        id,
        first_name,
        last_name,
        email
      ),
      broker:brokers(
        id,
        name,
        email
      )
    `)
    .eq('vertical_id', verticalId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Update deal status and track timeline
 */
export async function updateDealStatus(
  dealId: string,
  status: string,
  note?: string,
  userId?: string
) {
  const updates: any = { status };

  // Track dates based on status
  const now = new Date().toISOString();
  if (status === 'due_diligence' && !updates.acceptance_date) {
    updates.acceptance_date = now;
  } else if (status === 'closed') {
    updates.actual_close_date = now;
  }

  // Add note if provided
  if (note && userId) {
    const { data: deal } = await db.deals().select('notes').eq('id', dealId).single();

    updates.notes = [
      ...(deal?.notes || []),
      {
        text: note,
        created_at: now,
        created_by: userId,
        type: 'milestone',
      },
    ];
  }

  const { data, error } = await db
    .deals()
    .update(updates)
    .eq('id', dealId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get broker's deal performance
 */
export async function getBrokerDealPerformance(brokerId: string) {
  const { data, error } = await db
    .deals()
    .select('*')
    .eq('broker_id', brokerId);

  if (error) return { data: null, error };

  // Calculate performance metrics
  const metrics = {
    total_deals: data.length,
    closed_deals: data.filter((d) => d.status === 'closed').length,
    total_value: data
      .filter((d) => d.status === 'closed')
      .reduce((sum, d) => sum + (d.final_price || 0), 0),
    total_commission: data
      .filter((d) => d.status === 'closed')
      .reduce((sum, d) => sum + (d.commission_amount || 0), 0),
    avg_deal_size:
      data.filter((d) => d.status === 'closed' && d.final_price).length > 0
        ? data
            .filter((d) => d.status === 'closed')
            .reduce((sum, d) => sum + (d.final_price || 0), 0) /
          data.filter((d) => d.status === 'closed' && d.final_price).length
        : 0,
    pipeline_value: data
      .filter((d) => d.status !== 'closed' && d.status !== 'cancelled')
      .reduce((sum, d) => sum + (d.offered_price || 0), 0),
  };

  return { data, metrics, error: null };
}

// ============================================================================
// SCRAPER QUERIES
// ============================================================================

/**
 * Create a new scraper run
 */
export async function createScraperRun(
  verticalId: VerticalSlug,
  sourceName: string,
  sourceUrl: string,
  metadata?: Record<string, any>
) {
  const { data, error } = await db
    .scraperRuns()
    .insert({
      vertical_id: verticalId,
      source_name: sourceName,
      source_url: sourceUrl,
      status: 'pending',
      run_metadata: metadata,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update scraper run status
 */
export async function updateScraperRun(
  runId: string,
  updates: {
    status?: string;
    started_at?: string;
    completed_at?: string;
    listings_found?: number;
    listings_created?: number;
    listings_updated?: number;
    listings_skipped?: number;
    error_message?: string;
  }
) {
  // Calculate duration if completed
  if (updates.completed_at && updates.started_at) {
    const start = new Date(updates.started_at).getTime();
    const end = new Date(updates.completed_at).getTime();
    updates['duration_seconds'] = Math.floor((end - start) / 1000);
  }

  const { data, error } = await db
    .scraperRuns()
    .update(updates)
    .eq('id', runId)
    .select()
    .single();

  return { data, error };
}

/**
 * Add log entry to scraper run
 */
export async function addScraperLog(
  runId: string,
  level: 'info' | 'warning' | 'error',
  message: string,
  details?: Record<string, any>
) {
  const { data, error } = await db
    .scraperLogs()
    .insert({
      scraper_run_id: runId,
      log_level: level,
      message,
      details,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Get scraper runs for a vertical
 */
export async function getScraperRuns(
  verticalId: VerticalSlug,
  limit: number = 20
) {
  const { data, error } = await db
    .scraperRuns()
    .select('*')
    .eq('vertical_id', verticalId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
}

/**
 * Get logs for a scraper run
 */
export async function getScraperLogs(runId: string) {
  const { data, error } = await db
    .scraperLogs()
    .select('*')
    .eq('scraper_run_id', runId)
    .order('created_at', { ascending: true });

  return { data, error };
}

// ============================================================================
// ANALYTICS & REPORTING QUERIES
// ============================================================================

/**
 * Get vertical dashboard metrics
 */
export async function getVerticalDashboardMetrics(verticalId: VerticalSlug) {
  // Active listings count
  const { data: activeListingsCount } = await functions.getActiveListingsCount(verticalId);

  // Lead pipeline
  const { data: leadPipeline } = await views
    .leadPipeline()
    .select('*')
    .eq('vertical_id', verticalId);

  // Deal metrics
  const { data: dealMetrics } = await views
    .dealMetrics()
    .select('*')
    .eq('vertical_id', verticalId);

  // Conversion rate
  const { data: conversionRate } = await functions.getConversionRate(verticalId);

  return {
    activeListingsCount,
    leadPipeline,
    dealMetrics,
    conversionRate,
  };
}

/**
 * Get monthly revenue projection
 */
export async function getMonthlyRevenueProjection(verticalId: VerticalSlug) {
  const { data: deals, error } = await db
    .deals()
    .select('*')
    .eq('vertical_id', verticalId)
    .in('status', ['negotiating', 'due_diligence', 'financing', 'closing'])
    .not('expected_close_date', 'is', null);

  if (error) return { data: null, error };

  // Group by month
  const monthlyProjections = deals.reduce((acc: any, deal) => {
    const month = deal.expected_close_date!.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = {
        month,
        deal_count: 0,
        projected_value: 0,
        projected_commission: 0,
      };
    }
    acc[month].deal_count++;
    acc[month].projected_value += deal.offered_price || 0;
    acc[month].projected_commission += deal.commission_amount || 0;
    return acc;
  }, {});

  return { data: Object.values(monthlyProjections), error: null };
}

/**
 * Get top performing brokers
 */
export async function getTopBrokers(verticalId: VerticalSlug, limit: number = 10) {
  const { data: brokers, error } = await supabase
    .from('broker_verticals')
    .select(`
      broker:brokers(*)
    `)
    .eq('vertical_id', verticalId);

  if (error || !brokers) return { data: null, error };

  // Get deal performance for each broker
  const brokersWithMetrics = await Promise.all(
    brokers.map(async (bv: any) => {
      const { metrics } = await getBrokerDealPerformance(bv.broker.id);
      return {
        ...bv.broker,
        ...metrics,
      };
    })
  );

  // Sort by total commission
  const sorted = brokersWithMetrics
    .sort((a, b) => (b.total_commission || 0) - (a.total_commission || 0))
    .slice(0, limit);

  return { data: sorted, error: null };
}
