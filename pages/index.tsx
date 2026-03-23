// pages/index.tsx
// CHANGES FROM PREVIOUS VERSION:
// 1. Default category → 'commercial_cleaning'
// 2. Hero copy is dynamic per selected category
// 3. Stats bar: Active Listings + Median DOM (from DealLedger) + % over 1 year
// 4. Meta tags updated for commercial cleaning
// 5. Browse CTA links to correct category

import { useState, useEffect, useCallback } from 'react';
import Head from "next/head";
import Link from "next/link";
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CategoryFilter, CategorySlug } from '../components/CategoryFilter';

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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>('commercial_cleaning');
  const [stats, setStats]                       = useState<Stats>({ totalVerified: 0, medianDom: null, pctOver365: null });
  const [categoryCounts, setCategoryCounts]     = useState<Record<CategorySlug, number>>({} as Record<CategorySlug, number>);
  const [statsLoading, setStatsLoading]         = useState(false);

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

  useEffect(() => { fetchStats(selectedCategory); }, [selectedCategory, fetchStats]);

  const label = CATEGORY_LABELS[selectedCategory] ?? 'Cleaning Business';

  return (
    <>
      <Head>
        <title>{label} Businesses For Sale | CleaningExits</title>
        <meta name="description" content={
          `Find verified ${label.toLowerCase()} businesses for sale. ` +
          `${stats.totalVerified} active listings updated daily. ` +
          `Filter by state, price, and days on market.`
        } />
        <meta property="og:title"       content={`${label} Businesses For Sale | CleaningExits`} />
        <meta property="og:description" content={`The only marketplace that shows days on market and buyer view counts for ${label.toLowerCase()} businesses.`} />
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
              {statsLoading ? '—' : stats.totalVerified.toLocaleString()} Verified Listings
            </p>
            <p className="text-gray-500">
              Every {label.toLowerCase()} business for sale in the US. Updated daily.
            </p>
          </section>

          {/* Weekly Top 10 Banner */}
          <section className="mb-8">
            <div className="bg-emerald-600 rounded-xl px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Weekly Top 10 — {label}</div>
                <div className="text-emerald-100 text-sm">
                  Best new listings ranked by DOM + buyer demand. Every Monday.
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
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-3xl md:text-4xl font-bold text-emerald-600 ${statsLoading ? 'opacity-40' : ''}`}>
                    {statsLoading ? '—' : stats.totalVerified.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Active Listings</div>
                </div>
                <div>
                  <div className={`text-3xl md:text-4xl font-bold text-emerald-600 ${statsLoading ? 'opacity-40' : ''}`}>
                    {statsLoading ? '—' : stats.medianDom !== null ? `${stats.medianDom}d` : '—'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Median Days on Market</div>
                </div>
                <div>
                  <div className={`text-3xl md:text-4xl font-bold text-emerald-600 ${statsLoading ? 'opacity-40' : ''}`}>
                    {statsLoading ? '—' : stats.pctOver365 !== null ? `${stats.pctOver365}%` : '—'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Listed Over 1 Year</div>
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
              <p className="text-gray-500 text-sm mt-4">Filter by state, price, and days on market</p>
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
