// pages/index.tsx
// CHANGES FROM PREVIOUS VERSION:
// 1. Default category → 'commercial_cleaning'
// 2. Hero copy is dynamic per selected category
// 3. Stats bar: Active Listings (from DealLedger). No days-on-market figures.
// 4. Meta tags updated for commercial cleaning
// 5. Browse CTA links to correct category

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GetStaticProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import Head from "next/head";
import Link from "next/link";
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CategoryFilter, CategorySlug } from '../components/CategoryFilter';
import FeaturedListings from '../components/FeaturedListings';

const CATEGORY_LABELS: Record<string, string> = {
  commercial_cleaning:  'Commercial Cleaning',
  residential_cleaning: 'Residential Cleaning',
  laundromat:           'Laundromat',
  landscaping:          'Landscaping',
  pool_service:         'Pool Service',
  pressure_washing:     'Pressure Washing',
  junk_removal:         'Junk Removal',
  dry_cleaner:          'Dry Cleaner',
  pest_control:         'Pest Control',
};

interface Stats {
  totalVerified: number;
  medianDom:    number | null;
  pctOver365:   number | null;
}

// Server-rendered numbers for the default category. ChatGPT and search
// crawlers read the HTML without running the page's JavaScript; before this
// the HTML said "— Active Listings" and nothing else, so there was nothing
// on the page to quote. The client still refetches when the category changes.
type Initial = {
  category: CategorySlug;
  total: number;
  medianPrice: number | null;
  medianCashFlow: number | null;
  withPrice: number;
  states: number;
  categoryCounts: Record<string, number>;
  asOf: string;
} | null;

const HOME_CATEGORIES = Object.keys(CATEGORY_LABELS);

function medianOf(values: number[]): number | null {
  if (!values.length) return null;
  const v = [...values].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2);
}

export const getStaticProps: GetStaticProps<{ initial: Initial }> = async () => {
  const url = process.env.DEALLEDGER_SUPABASE_URL;
  const key = process.env.DEALLEDGER_SUPABASE_SERVICE_KEY;
  if (!url || !key) return { props: { initial: null }, revalidate: 600 };
  try {
    const db = createClient(url, key);
    const category: CategorySlug = 'commercial_cleaning';
    // Same table and filters as /api/stats, so the server and client agree.
    const [{ data: rows, error }, counts] = await Promise.all([
      db.from('listings').select('price, cash_flow, state').eq('category', category).eq('is_active', true).limit(5000),
      Promise.all(HOME_CATEGORIES.map(async (c) => {
        const { count } = await db.from('listings').select('*', { count: 'exact', head: true })
          .eq('category', c).eq('is_active', true);
        return [c, count ?? 0] as [string, number];
      })),
    ]);
    if (error || !rows) return { props: { initial: null }, revalidate: 600 };
    const prices = rows.map((r: any) => Number(r.price)).filter((n) => n > 0);
    const flows = rows.map((r: any) => Number(r.cash_flow)).filter((n) => n > 0);
    const states = new Set(rows.map((r: any) => String(r.state || '').trim().toUpperCase()).filter((s) => /^[A-Z]{2}$/.test(s)));
    return {
      props: {
        initial: {
          category,
          total: rows.length,
          medianPrice: medianOf(prices),
          medianCashFlow: medianOf(flows),
          withPrice: prices.length,
          states: states.size,
          categoryCounts: Object.fromEntries(counts),
          asOf: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }),
        },
      },
      revalidate: 3600,
    };
  } catch {
    return { props: { initial: null }, revalidate: 600 };
  }
};

const fmtK = (n: number | null) =>
  n == null ? null : n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

export default function Home({ initial }: { initial: Initial }) {
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>('commercial_cleaning');
  const [stats, setStats]                       = useState<Stats>({ totalVerified: initial?.total ?? 0, medianDom: null, pctOver365: null });
  const [categoryCounts, setCategoryCounts]     = useState<Record<CategorySlug, number>>((initial?.categoryCounts ?? {}) as Record<CategorySlug, number>);
  // With server numbers there is nothing to wait for on first paint.
  const [statsLoading, setStatsLoading]         = useState(!initial);
  const firstFetch = useRef(true);

  const fetchStats = useCallback(async (category: CategorySlug) => {
    setStatsLoading(true);
    try {
      const res  = await fetch(`/api/stats?category=${category}`);
      const data = await res.json();
      setStats({
        totalVerified: data.totalVerified ?? 0,
        medianDom:     data.medianDom     ?? null,
        pctOver365:    data.pctOver365    ?? null,
      });
      setCategoryCounts(data.categoryCounts || {});
    } catch (e) {
      console.error('Stats fetch error', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Skip the first fetch when the server already rendered this category.
    if (firstFetch.current && initial && selectedCategory === initial.category) { firstFetch.current = false; return; }
    firstFetch.current = false;
    fetchStats(selectedCategory);
  }, [selectedCategory, fetchStats, initial]);

  // A plain sentence with the numbers, for the default category only (the
  // medians are computed server-side for that category).
  const summary = initial && selectedCategory === initial.category && !statsLoading
    ? `${initial.total.toLocaleString()} commercial cleaning businesses are for sale across ${initial.states} states` +
      (initial.medianPrice ? `, with a median asking price of ${fmtK(initial.medianPrice)}` : '') +
      (initial.medianCashFlow ? ` and median seller cash flow of ${fmtK(initial.medianCashFlow)}` : '') +
      `. Listings are gathered from business brokers nationwide and updated daily. Data as of ${initial.asOf}.`
    : null;

  const label = CATEGORY_LABELS[selectedCategory] ?? 'Cleaning Business';

  return (
    <>
      <Head>
        {/* One string: JSX with mixed text and {label} renders a literal
            "<!-- -->" inside <title>, which Google shows as-is. */}
        <title>{`${label} Businesses For Sale | CleaningExits`}</title>
        <meta name="description" content={
          initial && selectedCategory === initial.category
            ? `${initial.total} commercial cleaning businesses for sale across the US` +
              (initial.medianPrice ? `, median asking ${fmtK(initial.medianPrice)}` : '') +
              `. Gathered from business brokers and updated daily. Filter by state and price.`
            : `${label} businesses for sale across the US, gathered from business brokers ` +
              `and updated daily. Filter by state and price.`
        } />
        <link rel="canonical" href="https://cleaningexits.com/" />
        <meta property="og:title"       content={`${label} Businesses For Sale | CleaningExits`} />
        <meta property="og:description" content={`Every ${label.toLowerCase()} business for sale in the US, updated daily.`} />
      </Head>

      <div className="min-h-screen bg-white">
        <Header />

        <main className="max-w-5xl mx-auto px-4 py-12">

          {/* Hero */}
          <section className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
              {label} Businesses For Sale
            </h1>
            <p className="text-gray-500 mb-1">by CleaningExits</p>
            <p className="text-xl font-semibold text-gray-800 mb-2">
              {statsLoading ? '—' : stats.totalVerified.toLocaleString()} Active Listings
            </p>
            <p className="text-gray-500">
              Every {label.toLowerCase()} business for sale in the US. Updated daily.
            </p>
            {summary && <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-base">{summary}</p>}
          </section>

          {/* Our own listings, pinned above everything else */}
          <FeaturedListings />

          {/* Weekly Top 10 Banner */}
          <section className="mb-8">
            <div className="bg-emerald-600 rounded-xl px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Weekly Top 10 — {label}</div>
                <div className="text-emerald-100 text-sm">
                  Best new listings, ranked. Every Monday.
                </div>
              </div>
              <Link
                href="/subscribe"
                className="bg-white text-emerald-700 font-semibold px-5 py-2 rounded-lg hover:bg-emerald-50 transition text-sm whitespace-nowrap"
              >
                Subscribe →
              </Link>
            </div>
          </section>

          {/* Category Filter */}
          <section className="mb-6">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryCounts={categoryCounts}
            />
          </section>

          {/* Stats — sourced from DealLedger */}
          <section className="mb-10">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="grid grid-cols-1 gap-4 text-center">
                <div>
                  <div className={`text-3xl md:text-4xl font-bold text-emerald-600 ${statsLoading ? 'opacity-40' : ''}`}>
                    {statsLoading ? '—' : stats.totalVerified.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Active Listings</div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                Data sourced from <a href="https://dealledger.org" className="underline hover:text-gray-600" target="_blank" rel="noopener noreferrer">DealLedger</a> — updated daily
              </p>
            </div>
          </section>

          {/* Browse CTA */}
          <section className="mb-12">
            <div className="text-center py-8">
              <Link
                href={`/cleaning-index?category=${selectedCategory}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-10 py-5 text-white font-bold text-xl shadow-lg hover:bg-emerald-700 transition"
              >
                Browse All {statsLoading ? '' : stats.totalVerified.toLocaleString()} {label} Businesses →
              </Link>
              <p className="text-gray-500 text-sm mt-4">Filter by state and price</p>
            </div>
          </section>

          {/* Trust Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 p-6 bg-white">
              <h3 className="font-bold text-lg mb-2">Complete Buying Guide</h3>
              <p className="text-gray-600 mb-4">
                What to look for when buying a {label.toLowerCase()} business — contracts, equipment, employee retention, and valuation multiples.
              </p>
              <Link href="/cleaning-business-for-sale" className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                Read the guide →
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6 bg-white">
              <h3 className="font-bold text-lg mb-2">Sell Your {label} Business</h3>
              <p className="text-gray-600 mb-4">
                Get in front of serious buyers. Free listing, no commission taken.
              </p>
              <Link href="/sell" className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                List your business →
              </Link>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
}
