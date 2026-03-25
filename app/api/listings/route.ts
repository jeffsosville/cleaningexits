// app/api/listings/route.ts
// UPDATED: Merges listings_broker (direct broker URLs) with listings (BizBuySell)
// Direct broker listings show first — BizBuySell is the fallback
// Trust tiers: direct > matched > marketplace
// Quality tiers: Verified > Likely Real > Unverified > Likely Junk

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

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  commercial_cleaning:  ['commercial clean', 'janitorial', 'office clean', 'cleaning service', 'cleaning business', 'cleaning company', 'maid', 'custodial'],
  residential_cleaning: ['residential clean', 'house clean', 'home clean', 'maid service'],
  laundromat:           ['laundromat', 'laundry', 'coin laundry', 'coin-op', 'wash'],
  landscaping:          ['landscap', 'lawn', 'lawn care', 'grounds', 'tree service', 'irrigation'],
  pool_service:         ['pool service', 'pool clean', 'pool maintenance', 'swimming pool'],
  pressure_washing:     ['pressure wash', 'power wash', 'soft wash'],
  junk_removal:         ['junk removal', 'junk hauling', 'debris removal', 'trash removal'],
  dry_cleaner:          ['dry clean', 'dry-clean', 'garment care'],
  pest_control:         ['pest control', 'pest management', 'exterminator', 'termite'],
};

function titleMatchesCategory(title: string, category: string): boolean {
  if (category === 'all') return true;
  const t = (title || '').toLowerCase();
  const keywords = CATEGORY_KEYWORDS[category] || [];
  return keywords.some(k => t.includes(k));
}

const RE_KEYWORDS = ['real estate', 'realty', 'property management', 'mortgage', 'apartment', 'condo'];
function isRealEstate(title: string): boolean {
  const t = (title || '').toLowerCase();
  return RE_KEYWORDS.some(k => t.includes(k));
}

const TIER_ORDER: Record<string, number> = {
  'Verified': 0,
  'Likely Real': 1,
  'Unverified': 2,
  'Likely Junk': 3,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page         = parseInt(searchParams.get('page')   || '1');
    const limit        = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset       = (page - 1) * limit;
    const search       = searchParams.get('search')   || '';
    const location     = searchParams.get('location') || '';
    const minPrice     = searchParams.get('minPrice');
    const maxPrice     = searchParams.get('maxPrice');
    const maxDom       = searchParams.get('maxDom');
    const hiddenGem    = searchParams.get('hidden_gem') === 'true';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';

    const rawCategory = searchParams.get('category') || 'commercial_cleaning';
    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'commercial_cleaning';

    const sortAsc = searchParams.get('sortOrder') === 'asc';

    // ── 1. Fetch direct broker listings ──────────────────────────────────────
    let directRaw: any[] = [];
    let dOffset = 0;
    while (true) {
      const { data: batch } = await supabase
        .from('listings_broker')
        .select('id, broker_name, listing_url, title, price, cash_flow, revenue, location_city, location_state, location_raw, description, scraped_at, is_active, quality_score, quality_tier')
        .eq('is_active', true)
        .not('title', 'is', null)
        .range(dOffset, dOffset + 999);
      if (!batch || batch.length === 0) break;
      directRaw = directRaw.concat(batch);
      if (batch.length < 1000) break;
      dOffset += 1000;
    }

    const directFiltered = (directRaw || []).filter(r => {
      if (isRealEstate(r.title || '')) return false;
      if (!titleMatchesCategory(r.title || '', category)) return false;
      if (search && !(r.title || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (location && !((r.location_city || '') + ' ' + (r.location_state || '')).toLowerCase().includes(location.toLowerCase())) return false;
      if (minPrice && (!r.price || r.price < parseInt(minPrice))) return false;
      if (maxPrice && (!r.price || r.price > parseInt(maxPrice))) return false;
      if (verifiedOnly && r.quality_tier !== 'Verified') return false;
      return true;
    });

    const directListings = directFiltered.map(r => ({
      id:                    `broker_${r.id}`,
      listing_number:        null,
      header:                r.title,
      price:                 r.price,
      cash_flow:             r.cash_flow,
      state:                 r.location_state,
      city:                  r.location_city,
      category,
      days_on_market:        null,
      listing_views:         null,
      estimated_listed_date: null,
      first_seen:            r.scraped_at,
      url:                   r.listing_url,
      broker_account:        r.broker_name,
      contact_name:          null,
      price_reduced:         false,
      trust_tier:            'direct',
      quality_tier:          r.quality_tier || 'Unverified',
      quality_score:         r.quality_score || 0,
      dom_badge:             'direct',
    }));

    // ── 2. Fetch BizBuySell listings ──────────────────────────────────────────
    let bbsQuery = supabase
      .from('listings')
      .select(
        `id, listing_number, header, price, cash_flow, state, city,
         category, days_on_market, listing_views, estimated_listed_date,
         first_seen, url, broker_account, contact_name, price_reduced,
         is_active, quality_score, quality_tier`,
        { count: 'exact' }
      )
      .eq('is_active', true);

    if (category !== 'all') bbsQuery = bbsQuery.eq('category', category);
    if (search)        bbsQuery = bbsQuery.or(`header.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`);
    if (location)      bbsQuery = bbsQuery.or(`city.ilike.%${location}%,state.ilike.%${location}%`);
    if (minPrice)      bbsQuery = bbsQuery.gte('price', parseInt(minPrice));
    if (maxPrice)      bbsQuery = bbsQuery.lte('price', parseInt(maxPrice));
    if (maxDom)        bbsQuery = bbsQuery.lte('days_on_market', parseInt(maxDom));
    if (hiddenGem)     bbsQuery = bbsQuery.lt('days_on_market', 30).lt('listing_views', 50);
    if (verifiedOnly)  bbsQuery = bbsQuery.eq('quality_tier', 'Verified');

    bbsQuery = bbsQuery
      .order('days_on_market', { ascending: sortAsc, nullsFirst: false })
      .range(0, 500);

    const { data: bbsRaw, count } = await bbsQuery;

    const directTitles = directListings.map(l => (l.header || '').toLowerCase().trim());

    const bbsListings = (bbsRaw || [])
      .filter(r => {
        const t = (r.header || '').toLowerCase().trim();
        for (let i = 0; i < directTitles.length; i++) {
          const dt = directTitles[i];
          if (dt.length > 10 && t.length > 10 && dt === t) return false;
        }
        return true;
      })
      .map(r => ({
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
        contact_name:          r.contact_name,
        price_reduced:         r.price_reduced,
        trust_tier:            'marketplace',
        quality_tier:          r.quality_tier || 'Unverified',
        quality_score:         r.quality_score || 0,
        dom_badge: r.days_on_market == null ? 'unknown'
                 : r.days_on_market < 30    ? 'green'
                 : r.days_on_market < 90    ? 'yellow'
                 : r.days_on_market < 365   ? 'orange'
                 : 'red',
      }));

    // ── 3. Merge: direct first, then BBS, sort by quality tier ───────────────
    const allListings = [...directListings, ...bbsListings].sort((a, b) => {
      const aTier = TIER_ORDER[a.quality_tier] ?? 2;
      const bTier = TIER_ORDER[b.quality_tier] ?? 2;
      return aTier - bTier;
    });

    const total      = allListings.length;
    const paginated  = allListings.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        listings: paginated,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        source: 'dealledger_merged',
        direct_count: directListings.length,
        bbs_count:    bbsListings.length,
        verified_count: allListings.filter(l => l.quality_tier === 'Verified').length,
      },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } }
    );

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
