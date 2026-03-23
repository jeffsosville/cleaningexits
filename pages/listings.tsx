// pages/api/listings.ts
// Fetches listings directly from DealLedger Supabase (sxtbarqkwdagnnbjcueo)
// Table: listings
// Columns used: id, listing_number, header, price, cash_flow, state, city,
//               category, days_on_market, listing_views, estimated_listed_date,
//               url, broker_account, is_active
//
// Add to .env.local:
//   DEALLEDGER_SUPABASE_URL=https://sxtbarqkwdagnnbjcueo.supabase.co
//   DEALLEDGER_SUPABASE_SERVICE_KEY=<your service role key>

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const dl = createClient(
  process.env.DEALLEDGER_SUPABASE_URL!,
  process.env.DEALLEDGER_SUPABASE_SERVICE_KEY!
);

const VALID_CATEGORIES = [
  'commercial_cleaning', 'residential_cleaning', 'laundromat',
  'landscaping', 'pool_service', 'pressure_washing',
  'junk_removal', 'dry_cleaner', 'pest_control',
];
const VALID_SORT = ['days_on_market', 'price', 'listing_views', 'estimated_listed_date'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const category  = VALID_CATEGORIES.includes(req.query.category as string)
                      ? (req.query.category as string) : 'commercial_cleaning';
  const state     = (req.query.state as string)?.toUpperCase() || null;
  const minPrice  = req.query.min_price  ? Number(req.query.min_price)  : null;
  const maxPrice  = req.query.max_price  ? Number(req.query.max_price)  : null;
  const maxDom    = req.query.max_dom    ? Number(req.query.max_dom)    : null;
  const sortBy    = VALID_SORT.includes(req.query.sort as string)
                      ? (req.query.sort as string) : 'days_on_market';
  const sortAsc   = req.query.order === 'asc';
  const page      = Math.max(1, Number(req.query.page)  || 1);
  const limit     = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const offset    = (page - 1) * limit;

  // Hidden gem: new to market (DOM < 30) AND low buyer interest (views < 50)
  const hiddenGem = req.query.hidden_gem === 'true';

  try {
    let query = dl
      .from('listings')
      .select(
        `id, listing_number, header, price, cash_flow, state, city,
         category, days_on_market, listing_views, estimated_listed_date,
         url, broker_account, contact_name, price_reduced, is_active`,
        { count: 'exact' }
      )
      .eq('category', category)
      .eq('is_active', true);

    if (state)    query = query.eq('state', state);
    if (minPrice) query = query.gte('price', minPrice);
    if (maxPrice) query = query.lte('price', maxPrice);
    if (maxDom)   query = query.lte('days_on_market', maxDom);

    // Hidden gem quadrant: low DOM + low views
    if (hiddenGem) {
      query = query
        .lt('days_on_market', 30)
        .lt('listing_views', 50);
    }

    query = query
      .order(sortBy, { ascending: sortAsc, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // Shape the response to match CleaningExits frontend expectations
    const listings = (data ?? []).map((r) => ({
      id:                   r.id,
      listing_number:       r.listing_number,
      title:                r.header,           // CleaningExits uses 'title'
      asking_price:         r.price,            // CleaningExits uses 'asking_price'
      cash_flow:            r.cash_flow,
      state:                r.state,
      city:                 r.city,
      category:             r.category,
      days_on_market:       r.days_on_market,
      listing_views:        r.listing_views,
      estimated_listed_date: r.estimated_listed_date,
      listing_url:          r.url,              // CleaningExits uses 'listing_url'
      broker_account:       r.broker_account,
      contact_name:         r.contact_name,
      price_reduced:        r.price_reduced,
      // DOM badge color for frontend
      dom_badge: r.days_on_market == null ? 'unknown'
               : r.days_on_market < 30   ? 'green'
               : r.days_on_market < 90   ? 'yellow'
               : r.days_on_market < 365  ? 'orange'
               : 'red',
    }));

    return res.status(200).json({
      listings,
      total:    count ?? 0,
      page,
      limit,
      pages:    Math.ceil((count ?? 0) / limit),
      category,
      source:   'dealledger',
      filters:  { state, minPrice, maxPrice, maxDom, sortBy, sortAsc, hiddenGem },
    });
  } catch (err: any) {
    console.error('Listings API error:', err);
    return res.status(500).json({
      listings: [], total: 0, error: err.message ?? 'Unknown error',
    });
  }
}

/* ── USAGE EXAMPLES ──────────────────────────────────────────────────────────

GET /api/listings
  → 25 commercial_cleaning listings, sorted by days_on_market desc

GET /api/listings?category=commercial_cleaning&state=FL
  → Florida commercial cleaning listings

GET /api/listings?category=commercial_cleaning&max_price=250000&sort=price&order=asc
  → Under $250K, cheapest first

GET /api/listings?category=commercial_cleaning&hidden_gem=true
  → DOM < 30 days AND views < 50 (the hidden gem quadrant)

GET /api/listings?category=commercial_cleaning&sort=listing_views&order=desc
  → Highest buyer demand first

GET /api/listings?category=laundromat&page=2&limit=25
  → Paginated — reuse for LaundroExits with category=laundromat

GET /api/listings?category=commercial_cleaning&max_dom=90&sort=price&order=asc
  → Fresh listings under 90 days, cheapest first

────────────────────────────────────────────────────────────────────────────── */
