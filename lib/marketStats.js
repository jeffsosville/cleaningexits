// lib/marketStats.js
// Reads the DealLedger stats views. Server-side only (getStaticProps).
//
// Views consumed:
//   market_stats_national        one row per vertical
//   market_stats_state           one row per vertical x state_norm
//   market_multiple_by_sde_band  one row per vertical x SDE band
//
// Env required:
//   NEXT_PUBLIC_DEALLEDGER_URL
//   NEXT_PUBLIC_DEALLEDGER_ANON_KEY

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_DEALLEDGER_URL;
const key = process.env.NEXT_PUBLIC_DEALLEDGER_ANON_KEY;

if (!url || !key) {
  // Fail loudly at build time rather than shipping pages with empty stats.
  throw new Error(
    'marketStats: NEXT_PUBLIC_DEALLEDGER_URL and NEXT_PUBLIC_DEALLEDGER_ANON_KEY must be set'
  );
}

const db = createClient(url, key);

// Minimum observations before a number is publishable. Below this we show
// the sample size and suppress the statistic rather than print a median of 3.
export const MIN_SAMPLE = 8;

export function isPublishable(n) {
  return typeof n === 'number' && n >= MIN_SAMPLE;
}

export async function getNationalStats(vertical) {
  const { data, error } = await db
    .from('market_stats_national')
    .select('*')
    .eq('vertical', vertical)
    .single();
  if (error) throw new Error(`getNationalStats: ${error.message}`);
  return data;
}

export async function getSdeBands(vertical) {
  const { data, error } = await db
    .from('market_multiple_by_sde_band')
    .select('*')
    .eq('vertical', vertical)
    .order('band_order', { ascending: true });
  if (error) throw new Error(`getSdeBands: ${error.message}`);
  return data || [];
}

export async function getStateStats(vertical) {
  const { data, error } = await db
    .from('market_stats_state')
    .select('*')
    .eq('vertical', vertical)
    .order('active_count', { ascending: false });
  if (error) throw new Error(`getStateStats: ${error.message}`);
  return data || [];
}

// States that clear the inventory bar for their own page.
export async function getPublishableStates(vertical, threshold = 15) {
  const rows = await getStateStats(vertical);
  return rows.filter((r) => r.active_count >= threshold);
}

export async function getStateStat(vertical, stateCode) {
  const { data, error } = await db
    .from('market_stats_state')
    .select('*')
    .eq('vertical', vertical)
    .eq('state_norm', stateCode)
    .maybeSingle();
  if (error) throw new Error(`getStateStat: ${error.message}`);
  return data;
}

export async function getListings(vertical, { stateCode = null, status = 'active', limit = 60 } = {}) {
  let q = db
    .from('listings_direct')
    .select(
      'id,title,url,city,state_norm,asking_price,cash_flow,revenue,days_on_market,broker_name,status,first_seen,last_seen'
    )
    .eq('vertical', vertical)
    .eq('status', status)
    .eq('url_is_listing_specific', true)
    .order('last_seen', { ascending: false })
    .limit(limit);
  if (stateCode) q = q.eq('state_norm', stateCode);
  const { data, error } = await q;
  if (error) throw new Error(`getListings: ${error.message}`);
  return data || [];
}

/* ---------- formatting ---------- */

export function money(n, { compact = false } = {}) {
  if (n === null || n === undefined) return null;
  const v = Number(n);
  if (!isFinite(v)) return null;
  if (compact) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  }
  return `$${Math.round(v).toLocaleString('en-US')}`;
}

export function mult(n) {
  if (n === null || n === undefined) return null;
  return `${Number(n).toFixed(2)}\u00d7`;
}

export function asOf(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
  PR: 'Puerto Rico',
};
