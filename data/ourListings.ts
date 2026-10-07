// data/ourListings.ts
//
// In-house (CleaningExits-brokered) listings.
//
// WAS: a hardcoded array in this file. Adding a listing meant editing code and
// redeploying, which stops working the moment anyone other than a developer
// needs to add one.
//
// NOW: reads `inhouse_listings` from the ATM CRM project, filtered to this
// site's vertical. Adding a listing is a row.
//
// The exported names and return shapes are unchanged, with one exception:
// getOurListings() and getOurListingById() are now async. Callers must await.

import { createClient } from '@supabase/supabase-js';

export const VERTICAL = 'cleaning';

export type OurListingFinancial = {
  label: string;
  value: string;
  note?: string;
};

export type OurListing = {
  /** URL slug - this is what /listing/[id] resolves on */
  id: string;
  listing_id: string;
  source: 'inhouse';
  status: 'active' | 'under_loi' | 'sold';
  is_active: boolean;

  /** ListingCard reads `header`; detail page reads `title`. Keep both. */
  header: string;
  title: string;

  price: number | null;
  /** ListingCard reads camelCase; detail page reads snake_case. Keep both. */
  cashFlow: number | null;
  cash_flow: number | null;

  city: string | null;
  state: string | null;
  location: string | null;
  category: string | null;

  summary: string;
  highlights: string[];
  financials: OurListingFinancial[];
  equipment: string[];

  machineCount: number | null;
  locationTypes: string | null;
  hoursPerWeek: string | null;

  listedOn: string;
  first_seen: string;
  listing_url: string;

  ctaHref: string;
  ctaLabel: string;

  /** atm_deals.id - what the Deal Hub resolves against after an NDA. */
  crmDealId: string | null;

  broker: {
    name: string;
    firm: string;
    email: string;
    phone: string;
  };
};

/**
 * The CRM project, not DealLedger. NEXT_PUBLIC_SUPABASE_URL on this site points
 * at the read-only warehouse; our own listings live in the application DB.
 */
function crm() {
  const url = process.env.CRM_SUPABASE_URL;
  const key =
    process.env.CRM_SUPABASE_SERVICE_KEY ?? process.env.CRM_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Missing CRM_SUPABASE_URL / CRM_SUPABASE_SERVICE_KEY');
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function money(n: number | null): string {
  return n == null ? '' : `$${n.toLocaleString('en-US')}`;
}

/** Row -> the shape every existing caller already expects. */
function toListing(r: any): OurListing {
  const location = [r.city, r.state].filter(Boolean).join(', ') || null;

  // Fall back to generated rows if `financials` was left empty on the row.
  const financials: OurListingFinancial[] =
    Array.isArray(r.financials) && r.financials.length
      ? r.financials
      : ([
          r.price ? { label: 'Asking price', value: money(r.price) } : null,
          r.monthly_cash_flow
            ? { label: 'Monthly net cash flow', value: money(r.monthly_cash_flow) }
            : null,
          r.cash_flow
            ? { label: 'Annual net cash flow', value: money(r.cash_flow) }
            : null,
        ].filter(Boolean) as OurListingFinancial[]);

  return {
    id: r.slug,
    listing_id: r.slug,
    source: 'inhouse',
    status: r.status,
    is_active: r.is_active,

    header: r.title,
    title: r.title,

    price: r.price,
    cashFlow: r.cash_flow,
    cash_flow: r.cash_flow,

    city: r.city,
    state: r.state,
    location,
    category: r.category,

    summary: r.summary ?? '',
    highlights: r.highlights ?? [],
    financials,
    equipment: r.equipment ?? [],

    machineCount: r.unit_count,
    locationTypes: r.location_types,
    hoursPerWeek: r.hours_per_week,

    listedOn: r.listed_on,
    first_seen: r.listed_on,
    listing_url: `/listing/${r.slug}`,

    ctaHref: r.cta_href ?? `/nda?listing=${r.slug}`,
    ctaLabel: r.cta_label ?? 'Sign NDA & Get Access >',

    crmDealId: r.crm_deal_id,

    broker: {
      name: r.broker_name ?? 'John Sosville',
      firm: r.broker_firm ?? 'CleaningExits',
      email: r.broker_email ?? 'hello@cleaningexits.com',
      phone: r.broker_phone ?? '888-430-5535',
    },
  };
}

const SELECT = `slug, vertical, status, is_active, title, summary, category,
  price, cash_flow, monthly_cash_flow, city, state, highlights, equipment,
  financials, unit_count, unit_label, location_types, hours_per_week,
  crm_deal_id, cta_href, cta_label, broker_name, broker_firm, broker_email,
  broker_phone, listed_on`;

/** All active in-house listings for this vertical, newest first. */
export async function getOurListings(): Promise<OurListing[]> {
  const supabase = crm();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('inhouse_listings')
    .select(SELECT)
    .eq('vertical', VERTICAL)
    .eq('is_active', true)
    .neq('status', 'sold')
    .order('listed_on', { ascending: false });

  if (error) {
    // Never take the page down because the listings table is unreachable.
    console.error('getOurListings error:', error.message);
    return [];
  }
  return (data ?? []).map(toListing);
}

export async function getOurListingById(id: string): Promise<OurListing | null> {
  const supabase = crm();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('inhouse_listings')
    .select(SELECT)
    .eq('slug', id)
    .eq('vertical', VERTICAL)
    .maybeSingle();

  if (error) {
    console.error('getOurListingById error:', error.message);
    return null;
  }
  return data ? toListing(data) : null;
}

/**
 * Apply the same filters the API applies to warehouse rows, so an in-house
 * listing disappears from the grid when it doesn't match the active search -
 * rather than sitting there pinned and looking broken.
 */
export function filterOurListings(
  listings: OurListing[],
  opts: {
    search?: string | null;
    minPrice?: string | null;
    maxPrice?: string | null;
    location?: string | null;
  }
): OurListing[] {
  return listings.filter((l) => {
    if (opts.search) {
      const q = opts.search.toLowerCase();
      const hay =
        `${l.title} ${l.location ?? ''} ${l.city ?? ''} ${l.state ?? ''} ${l.category ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (opts.minPrice && (l.price ?? 0) < parseInt(opts.minPrice, 10)) return false;
    if (opts.maxPrice && (l.price ?? 0) > parseInt(opts.maxPrice, 10)) return false;
    if (opts.location) {
      const loc = (l.location ?? '').toLowerCase();
      if (!loc.includes(opts.location.toLowerCase())) return false;
    }
    return true;
  });
}
