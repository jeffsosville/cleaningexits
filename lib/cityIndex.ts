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
};

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

async function fetchLocations(): Promise<Array<{ state: string; city: string }>> {
  const rows: Array<{ state: string; city: string }> = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db()
      .from('cleaning_listings_direct')
      .select('state, city')
      .not('state', 'is', null)
      .not('city', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data as Array<{ state: string; city: string }>) || []));
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
    if (hit) hit.count++;
    else byKey.set(key, { state, slug, name: cityNameFromSlug(slug), count: 1 });
  }
  return Array.from(byKey.values());
}

/** City pages at or above CITY_INDEX_MIN, optionally for one state, most listings first. */
export async function getIndexableCities(stateCode?: string): Promise<CityCount[]> {
  const st = stateCode?.toLowerCase();
  return (await getCityCounts())
    .filter(c => c.count >= CITY_INDEX_MIN && (!st || c.state === st))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
