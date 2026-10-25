// lib/cityIndex.ts
// Which city pages exist, counted once. The sitemap, the city page's
// getStaticPaths and the /for-sale/{state} "Browse by city" block all read
// from here, so they can't disagree about which city pages are indexable.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  toStateCode,
  slugifyCity,
  canonicalCitySlug,
  cityNameFromSlug,
  CITY_INDEX_MIN,
  STATE_INDEX_MIN,
  STATE_REDIRECT_MIN
} from './geo';

export type CityCount = {
  state: string; // lowercase two-letter code
  slug: string; // canonical slug
  name: string;
  count: number;
  updated: string | null; // newest listing's first-seen date, YYYY-MM-DD
};

type LocationRow = { state: string; city: string; first_seen: string | null };

// Created on first use so importing this file never throws on a deploy that
// lacks the DealLedger env vars.
let client: SupabaseClient | null = null;
const db = () =>
  (client ||= createClient(
    process.env.DEALLEDGER_SUPABASE_URL as string,
    process.env.DEALLEDGER_SUPABASE_SERVICE_KEY as string
  ));

// PostgREST caps a response at 1,000 rows. The view is ~830 today; page
// through it so city counts don't silently truncate once it grows past that.
const PAGE = 1000;

export async function fetchLocations(): Promise<LocationRow[]> {
  const rows: LocationRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db()
      .from('cleaning_listings_direct')
      .select('state, city, first_seen')
      .not('state', 'is', null)
      .not('city', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data as LocationRow[]) || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function getCityCounts(): Promise<CityCount[]> {
  const byKey = new Map<string, CityCount>();
  for (const r of await fetchLocations()) {
    const code = toStateCode(r.state);
    const raw = slugifyCity(r.city || '');
    if (!code || !raw) continue;
    const state = code.toLowerCase();
    const slug = canonicalCitySlug(state, raw);
    const key = `${state}/${slug}`;
    const hit = byKey.get(key);
    const seen = r.first_seen ? String(r.first_seen).slice(0, 10) : null;
    if (hit) {
      hit.count++;
      if (seen && (!hit.updated || seen > hit.updated)) hit.updated = seen;
    } else {
      byKey.set(key, { state, slug, name: cityNameFromSlug(slug), count: 1, updated: seen });
    }
  }
  return Array.from(byKey.values());
}

/** Newest first-seen date per state code (uppercase), for sitemap lastmod. */
export async function getStateUpdated(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const r of await fetchLocations()) {
    const code = toStateCode(r.state);
    const seen = r.first_seen ? String(r.first_seen).slice(0, 10) : null;
    if (!code || !seen) continue;
    if (!out.has(code) || seen > (out.get(code) as string)) out.set(code, seen);
  }
  return out;
}

/** City pages at or above CITY_INDEX_MIN, optionally for one state, most listings first. */
export async function getIndexableCities(stateCode?: string): Promise<CityCount[]> {
  const st = stateCode?.toLowerCase();
  return (await getCityCounts())
    .filter(c => c.count >= CITY_INDEX_MIN && (!st || c.state === st))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Old-template state pages (/cleaning-businesses-for-sale/{st}) that should be
 * indexed: at least STATE_INDEX_MIN priced listings, and not big enough to
 * have redirected to /for-sale/{st}. Texas and North Carolina were ranking on
 * page one or two before a blanket noindex hid them.
 */
export async function getIndexableStatePages(): Promise<Array<{ state: string; count: number }>> {
  const counts = new Map<string, number>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db()
      .from('cleaning_listings_direct')
      .select('state')
      .not('state', 'is', null)
      .not('price', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of (data as Array<{ state: string }>) || []) {
      const code = toStateCode(r.state);
      if (code) counts.set(code, (counts.get(code) || 0) + 1);
    }
    if (!data || data.length < PAGE) break;
  }
  const { data: gated } = await db()
    .from('market_stats_state')
    .select('state_norm')
    .eq('vertical', 'cleaning')
    .gte('active_count', STATE_REDIRECT_MIN);
  const redirected = new Set((gated || []).map((r: { state_norm: string }) => r.state_norm));
  return Array.from(counts.entries())
    .filter(([code, n]) => n >= STATE_INDEX_MIN && !redirected.has(code))
    .map(([code, n]) => ({ state: code.toLowerCase(), count: n }))
    .sort((a, b) => b.count - a.count);
}
