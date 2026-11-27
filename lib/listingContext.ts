// lib/listingContext.ts
// Links a listing page out to the rest of the site: the right state page, the
// city page (only if it's indexable), and a few other active listings in the
// same state. Listing pages used to link only to the index, so crawlers had no
// path from a listing to its state, its city, or its neighbours.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toStateCode, STATE_NAMES, slugifyCity, canonicalCitySlug, stateVariants, STATE_REDIRECT_MIN } from './geo';
import { getIndexableCities } from './cityIndex';

let client: SupabaseClient | null = null;
const db = () =>
  (client ||= createClient(
    process.env.DEALLEDGER_SUPABASE_URL as string,
    process.env.DEALLEDGER_SUPABASE_SERVICE_KEY as string
  ));

export type GeoLink = { name: string; href: string };
export type RelatedListing = { id: string; title: string; price: number | null; city: string | null; state: string | null };

export type ListingContext = {
  state: GeoLink | null;
  city: GeoLink | null;
  related: RelatedListing[];
};

export async function getListingContext(
  rawState: string | null,
  rawCity: string | null,
  excludeId?: string
): Promise<ListingContext> {
  const out: ListingContext = { state: null, city: null, related: [] };
  const code = toStateCode(rawState);
  if (!code) return out;
  const st = code.toLowerCase();

  try {
    // Big states live at /for-sale/{st}; smaller ones on the old template,
    // which itself redirects once a state crosses STATE_REDIRECT_MIN.
    const { data: gated } = await db()
      .from('market_stats_state')
      .select('active_count')
      .eq('vertical', 'cleaning')
      .eq('state_norm', code)
      .maybeSingle();
    const href = gated && Number(gated.active_count) >= STATE_REDIRECT_MIN
      ? `/for-sale/${st}`
      : `/cleaning-businesses-for-sale/${st}`;
    out.state = { name: STATE_NAMES[code] || code, href };

    if (rawCity) {
      const slug = canonicalCitySlug(st, slugifyCity(rawCity));
      const hit = (await getIndexableCities(code)).find((c) => c.slug === slug);
      if (hit) out.city = { name: hit.name, href: `/cleaning-businesses-for-sale/${st}/${hit.slug}` };
    }

    const { data: rows } = await db()
      .from('cleaning_listings_direct')
      .select('id, header, price, city, state')
      .eq('is_active', true)
      .in('state', stateVariants(code))
      .not('price', 'is', null)
      .order('days_on_market', { ascending: true, nullsFirst: false })
      .limit(7);
    out.related = (rows || [])
      .filter((r: any) => String(r.id) !== excludeId)
      .slice(0, 6)
      .map((r: any) => ({ id: String(r.id), title: r.header, price: r.price, city: r.city, state: r.state }));
  } catch (e) {
    // Links are a nice-to-have; never fail the listing page over them.
    console.error('getListingContext error:', e);
  }
  return out;
}
