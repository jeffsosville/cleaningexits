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
  CITY_INDEX_MIN
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
