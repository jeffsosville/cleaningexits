// pages/index.tsx
import { useState, useEffect, useCallback } from 'react';
import Head from "next/head";
import Link from "next/link";
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CategoryFilter, CategorySlug } from '../components/CategoryFilter';

type Listing = {
  id: string;
  header: string;
  city: string | null;
  state: string | null;
  price: number | null;
  cash_flow: number | null;
  revenue: string | null;
  url: string | null;
  category: string | null;
};

const money = (n?: number | null) =>
  n == null
    ? '—'
    : n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      });

export default function Home() {
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>('laundromat');
  const [stats, setStats] = useState({
    totalVerified: 390,
    addedThisWeek: 0,
    verifiedToday: 0,
  });
  const [categorycounts, setCategoryCounts] = useState<Record<CategorySlug, number>>({} as Record<CategorySlug, number>);
  const [statsLoading, setStatsLoading] = useState(false);

  // Listings state
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // Fetch stats
  const fetchStats = useCallback(async (category: CategorySlug) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/stats?category=${category}`);
      const data = await res.json();
      setStats({
        totalVerified: data.totalVerified,
        addedThisWeek: data.addedThisWeek,
        verifiedToday: data.verifiedToday,
      });
      setCategoryCounts(data.categoryCounts || {});
    } catch (e) {
      console.error('Stats fetch error', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(selectedCategory);
  }, [selectedCategory, fetchStats]);

  const handleCategoryChange = (cat: CategorySlug) => {
    setSelectedCategory(cat);
  };

  const categoryLabels: Record<CategorySlug, string> = {
    all: 'All',
    laundromat: 'Laundromat',
  };

  return (
    <>
      <Head>
        <title>Laundromats For Sale | {stats.totalVerified} Verified Listings</title>
        <meta name="description" content={`Find verified laundromat businesses for sale. ${stats.totalVerified} listings updated daily. No franchises, no spam.`} />
        <meta property="og:title" content={`Laundromats For Sale | ${stats.totalVerified} Verified Listings`} />
        <meta property="og:description" content="Every laundromat for sale in the US. Updated daily." />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-white">
        <Header />

        <main className="max-w-5xl mx-auto px-4 py-12">

          {/* Hero */}
          <section className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
              Laundromats For Sale
            </h1>
            <p className="text-gray-500 mb-1">by CleaningExits</p>
            <p className="text-xl font-semibold text-gray-800 mb-2">
              {stats.totalVerified} Verified Laundromat Businesses
            </p>
            <p className="text-gray-500">
              Every laundromat for sale in the US. Updated daily.
            </p>
          </section>

          {/* Weekly Top 10 Banner */}
          <section className="mb-8">
            <div className="bg-emerald-600 rounded-xl px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Weekly Top 10</div>
                <div className="text-emerald-100 text-sm">Every Monday. Zero spam.</div>
              </div>
              <Link
                href="/subscribe"
                className="bg-white text-emerald-700 font-semibold px-5 py-2 rounded-lg hover:bg-emerald-50 transition text-sm"
              >
                Subscribe →
              </Link>
            </div>
          </section>

          {/* Category Filter */}
          <section className="mb-6">
            <CategoryFilter
              selected={selectedCategory}
              onChange={handleCategoryChange}
              counts={categoryounts}
            />
          </section>

          {/* Stats */}
          <section className="mb-10">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-3xl md:text-4xl font-bold text-emerald-600 transition-opacity ${statsLoading ? 'opacity-50' : ''}`}>
                    {stats.totalVerified}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Active Listings</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-emerald-600">50</div>
                  <div className="text-sm text-gray-600 mt-1">States Covered</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-emerald-600">Daily</div>
                  <div className="text-sm text-gray-600 mt-1">Updated</div>
                </div>
              </div>
            </div>
          </section>

          {/* Browse CTA */}
          <section className="mb-12">
            <div className="text-center py-12">
              <Link
                href="/cleaning-index?category=laundromat"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-10 py-5 text-white font-bold text-xl shadow-lg hover:bg-emerald-700 transition"
              >
                Browse All {stats.totalVerified} Laundromats →
              </Link>
              <p className="text-gray-500 text-sm mt-4">Filter by state, price, and cash flow</p>
            </div>
          </section>

          {/* Trust Sections */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 p-6 bg-white">
              <h3 className="font-bold text-lg mb-2">Complete Buying Guide</h3>
              <p className="text-gray-600 mb-4">
                Learn what to look for when buying a laundromat, valuation tips, financing options, and more.
              </p>
              <Link
                href="/cleaning-business-for-sale"
                className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
              >
                Read the guide →
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6 bg-white">
              <h3 className="font-bold text-lg mb-2">Sell Your Laundromat</h3>
              <p className="text-gray-600 mb-4">
                Get your laundromat in front of serious buyers. Free listing, no commission.
              </p>
              <Link
                href="/sell"
                className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
              >
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
