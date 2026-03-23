// app/api/listings/route.ts
// CHANGES FROM PREVIOUS VERSION:
// 1. Now queries DealLedger Supabase (sxtbarqkwdagnnbjcueo) instead of cleaning_listings_merge
// 2. Uses DEALLEDGER_SUPABASE_URL + DEALLEDGER_SUPABASE_SERVICE_KEY env vars (server-side only)
// 3. Adds days_on_market, listing_views, estimated_listed_date to response
// 4. Adds dom_badge color to each listing (green/yellow/orange/red)
// 5. Adds hidden_gem filter (DOM < 30 AND views < 50)
// 6. Default category changed to 'commercial_cleaning'
// 7. All existing filters preserved (search, price, location, sort, pagination)
//
// Add to .env.local:
//   DEALLEDGER_SUPABASE_URL=https://sxtbarqkwdagnnbjcueo.supabase.co
//   DEALLEDGER_SUPABASE_SERVICE_KEY=<service role key from supabase dashboard>

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// DealLedger Supabase — server-side only, never exposed to browser
const supabase = createClient(
  process.env.DEALLEDGER_SUPABASE_URL!,
  process.env.DEALLEDGER_SUPABASE_SERVICE_KEY!
);

const VALID_CATEGORIES = [
  'commercial_cleaning', 'residential_cleaning', 'laundromat',
  'landscaping', 'pool_service', 'pressure_washing',
  'junk_removal', 'dry_cleaner', 'pest_control',
];

const VALID_SORT = [
  'days_on_market', 'price', 'listing_views',
  'estimated_listed_date', 'first_seen', 'cash_flow'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page      = parseInt(searchParams.get('page')   || '1');
    const limit     = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset    = (page - 1) * limit;

    const search    = searchParams.get('search')    || '';
    const location  = searchParams.get('location')  || '';
    const minPrice  = searchParams.get('minPrice');
    const maxPrice  = searchParams.get('maxPrice');
    const maxDom    = searchParams.get('maxDom');
    const hiddenGem = searchParams.get('hidden_gem') === 'true';

    const rawCategory = searchParams.get('category') || 'commercial_cleaning';
    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'commercial_cleaning';

    const rawSort   = searchParams.get('sortBy') || 'days_on_market';
    const sortBy    = VALID_SORT.includes(rawSort) ? rawSort : 'days_on_market';
    const sortAsc   = searchParams.get('sortOrder') === 'asc';

    let query = supabase
      .from('listings')
      .select(
        `id, listing_number, header, price, cash_flow, state, city,
         category, days_on_market, listing_views, estimated_listed_date,
         first_seen, url, broker_account, contact_name, price_reduced, is_active`,
        { count: 'exact' }
      )
      .eq('is_active', true);

    // Category filter (skip if 'all')
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    // Search across header, city, state
    if (search) {
      query = query.or(
        `header.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`
      );
    }

    // Location filter
    if (location) {
      query = query.or(
        `city.ilike.%${location}%,state.ilike.%${location}%`
      );
    }

    // Price filters
    if (minPrice) query = query.gte('price', parseInt(minPrice));
    if (maxPrice) query = query.lte('price', parseInt(maxPrice));

    // DOM cap filter
    if (maxDom) query = query.lte('days_on_market', parseInt(maxDom));

    // Hidden gem: fresh AND low interest
    if (hiddenGem) {
      query = query
        .lt('days_on_market', 30)
        .lt('listing_views', 50);
    }

    query = query
      .order(sortBy, { ascending: sortAsc, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Listings API error:', error);
      return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
    }

    // Shape response — map DealLedger column names to CleaningExits frontend expectations
    const listings = (data || []).map((r) => ({
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
      // DOM badge for UI — used by ListingsGrid component
      dom_badge: r.days_on_market == null ? 'unknown'
               : r.days_on_market < 30   ? 'green'
               : r.days_on_market < 90   ? 'yellow'
               : r.days_on_market < 365  ? 'orange'
               : 'red',
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json(
      {
        listings,
        pagination: {
          page,
          limit,
          total:      count || 0,
          totalPages,
          hasNext:    page < totalPages,
          hasPrev:    page > 1,
        },
        source: 'dealledger',
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
