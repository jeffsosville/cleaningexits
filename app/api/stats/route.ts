// app/api/stats/route.ts
// Returns listing counts, median DOM, and pct over 365 days per category
// Queries DealLedger Supabase (sxtbarqkwdagnnbjcueo) — table: listings
//
// Requires in .env.local / Vercel:
//   DEALLEDGER_SUPABASE_URL=https://sxtbarqkwdagnnbjcueo.supabase.co
//   DEALLEDGER_SUPABASE_SERVICE_KEY=<service role key>

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

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get('category') || 'commercial_cleaning';
    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'commercial_cleaning';

    // 1. Count active listings for selected category
    const { count: totalVerified, error: countErr } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('category', category)
      .eq('is_active', true);
    if (countErr) throw countErr;

    // 2. Pull DOM values for median + pctOver365
    const { data: domRows, error: domErr } = await supabase
      .from('listings')
      .select('days_on_market')
      .eq('category', category)
      .eq('is_active', true)
      .not('days_on_market', 'is', null)
      .limit(2000);
    if (domErr) throw domErr;

    const domValues = (domRows ?? [])
      .map((r) => r.days_on_market)
      .filter((v): v is number => typeof v === 'number' && v >= 0);

    const medianDom = median(domValues);
    const pctOver365 = domValues.length
      ? Math.round((domValues.filter((d) => d > 365).length / domValues.length) * 100)
      : null;

    // 3. Category counts for filter badges (parallel)
    const categoryCountEntries = await Promise.all(
      VALID_CATEGORIES.map(async (cat) => {
        const { count, error } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('category', cat)
          .eq('is_active', true);
        return [cat, error ? 0 : (count ?? 0)] as [string, number];
      })
    );

    return NextResponse.json(
      {
        totalVerified: totalVerified ?? 0,
        medianDom,
        pctOver365,
        categoryCounts: Object.fromEntries(categoryCountEntries),
        category,
        source: 'dealledger',
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err: any) {
    console.error('Stats API error:', err);
    return NextResponse.json(
      { totalVerified: 0, medianDom: null, pctOver365: null, categoryCounts: {}, error: err.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
