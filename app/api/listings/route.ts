// app/api/listings/route.ts
// SINGLE SOURCE OF TRUTH: DealLedger `listings` table.
// All `listings_direct` merge logic removed — DealLedger is canonical.
// Now selects + returns: relisted, direct_broker_url (in addition to existing fields).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.DEALLEDGER_SUPABASE_URL!,
  process.env.DEALLEDGER_SUPABASE_SERVICE_KEY!
);

const VALID_CATEGORIES = [
  'commercial_cleaning', 'residential_cleaning', 'laundromat',
  'landscaping', 'pool_service', 'pressure_washing',
  'junk_removal', 'dry_cleaner', 'pest_control',
];

const TIER_ORDER: Record<string, number> = {
  'Verified': 0,
  'Likely Real': 1,
  'Unverified': 2,
  'Likely Junk': 3,
};

function domBadge(dom: number | null | undefined): string {
  if (dom == null) return 'unknown';
  if (dom < 30)  return 'green';
  if (dom < 90)  return 'yellow';
  if (dom < 365) return 'orange';
  return 'red';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page         = parseInt(searchParams.get('page')   || '1');
    const limit        = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const search       = searchParams.get('search')   || '';
    const location     = searchParams.get('location') || '';
    const minPrice     = searchParams.get('minPrice');
    const maxPrice     = searchParams.get('maxPrice');
    const maxDom       = searchParams.get('maxDom');
    const hiddenGem    = searchParams.get('hidden_gem')   === 'true';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';

    const rawCategory = searchParams.get('category') || 'commercial_cleaning';
    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'commercial_cleaning';

    const sortAsc = searchParams.get('sortOrder') === 'asc';

    // ── Build query against DealLedger `listings` ────────────────────────────
    let query = supabase
      .from('listings')
      .select(
        `id, listing_number, header, price, cash_flow, state, city,
         category, days_on_market, listing_views, estimated_listed_date,
         first_seen, url, broker_account, contact_name, contact_phone,
         price_reduced, relisted, direct_broker_url, broker_id,
         is_active, quality_score, quality_tier`,
        { count: 'exact' }
      )
      .eq('is_active', true);

    if (category !== 'all') query = query.eq('category', category);
    if (search)             query = query.or(`header.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`);
    if (location)           query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%`);
    if (minPrice)           query = query.gte('price', parseInt(minPrice));
    if (maxPrice)           query = query.lte('price', parseInt(maxPrice));
    if (maxDom)             query = query.lte('days_on_market', parseInt(maxDom));
    if (hiddenGem)          query = query.lt('days_on_market', 30).lt('listing_views', 50);
    if (verifiedOnly)       query = query.eq('quality_tier', 'Verified');

    query = query.order('days_on_market', { ascending: sortAsc, nullsFirst: false });

    // Paginate through everything to allow client-side quality_tier sort below.
    let raw: any[] = [];
    let offset = 0;
    while (true) {
      const { data: batch, error } = await query.range(offset, offset + 999);
      if (error) throw error;
      if (!batch || batch.length === 0) break;
      raw = raw.concat(batch);
      if (batch.length < 1000) break;
      offset += 1000;
    }

    const mapped = raw.map(r => ({
      id:                    r.id,
      listing_number:        r.listing_number,
      header:                r.header,
      price:                 r.price,
      cash_flow:             r.cash_flow,
      state:                 r.state,
      city:                  r.city,
      category:              r.category,
      days_on_market:        r.days_on_market,
      listing_views:         r.listing_views,
      estimated_listed_date: r.estimated_listed_date,
      first_seen:            r.first_seen,
      url:                   r.url,
      broker_account:        r.broker_account,
      broker_id:             r.broker_id,
      contact_name:          r.contact_name,
      contact_phone:         r.contact_phone,
      price_reduced:         !!r.price_reduced,
      relisted:              !!r.relisted,
      direct_broker_url:     r.direct_broker_url,
      quality_tier:          r.quality_tier   || 'Unverified',
      quality_score:         r.quality_score  || 0,
      dom_badge:             domBadge(r.days_on_market),
    }));

    // Sort by quality tier (Verified first), preserving DOM order within tier.
    const sorted = mapped.sort((a, b) => {
      const aTier = TIER_ORDER[a.quality_tier] ?? 2;
      const bTier = TIER_ORDER[b.quality_tier] ?? 2;
      return aTier - bTier;
    });

    const total      = sorted.length;
    const startIdx   = (page - 1) * limit;
    const paginated  = sorted.slice(startIdx, startIdx + limit);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        listings: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        source: 'dealledger',
        verified_count: sorted.filter(l => l.quality_tier === 'Verified').length,
      },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } }
    );

  } catch (error: any) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      { listings: [], pagination: null, error: error?.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
