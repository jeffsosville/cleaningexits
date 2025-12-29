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
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

export default function Home() {
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>('all');
  const [stats, setStats] = useState({
    totalVerified: 292,
    addedThisWeek: 0,
    verifiedToday: 0,
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<CategorySlug, number>>({} as Record<CategorySlug, number>);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Listings state
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // Fetch stats
  const fetchStats = useCallback(async (category: CategorySlug) => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') {
        params.set('category', category);
      }
      const res = await fetch(`/api/stats?${params}`);
      const data = await res.json();
      setStats({
        totalVerified: data.totalVerified,
        addedThisWeek: data.addedThisWeek,
        verifiedToday: data.verifiedToday,
      });
      setCategoryCounts(data.categoryCounts);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch listings
  const fetchListings = useCallback(async (category: CategorySlug) => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '12',
        sortBy: 'cash_flow',
        sortOrder: 'desc',
      });
      if (category !== 'all') {
        params.set('category', category);
      }
      const res = await fetch(`/api/listings?${params}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setListingsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats('all');
    fetchListings('all');
  }, [fetchStats, fetchListings]);

  // Handle category change
  const handleCategoryChange = (category: CategorySlug) => {
    setSelectedCategory(category);
    fetchStats(category);
    fetchListings(category);
  };

  // Category display names
  const categoryLabels: Record<CategorySlug, string> = {
    all: 'All',
    commercial_cleaning: 'Commercial Cleaning',
    residential_cleaning: 'Residential Cleaning',
    laundromat: 'Laundromat',
    dry_cleaner: 'Dry Cleaning',
    pest_control: 'Pest Control',
    landscaping: 'Landscaping',
    pool_service: 'Pool Service',
    pressure_washing: 'Pressure Washing',
    junk_removal: 'Junk Removal',
    other: 'Other',
  };

  return (
    <>
      <Head>
        <title>Cleaning Business For Sale | {stats.totalVerified} Verified Listings</title>
        <meta name="description" content={`Find verified cleaning businesses for sale. ${stats.totalVerified} manually verified commercial cleaning companies. No franchises, no spam. Updated daily.`} />
      </Head>

      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <header className="text-center mb-10">
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Cleaning Business For Sale
          </h1>
          <p className="text-lg text-gray-500 mt-2 font-medium">by CleaningExits</p>
          <p className="mt-4 text-xl md:text-2xl text-gray-800 font-semibold max-w-3xl mx-auto">
            {stats.totalVerified} Verified {selectedCategory === 'all' ? 'Businesses' : categoryLabels[selectedCategory] + ' Businesses'}
          </p>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto text-lg">
            Manually verified. No franchise spam. No dead listings.
          </p>
        </header>

        {/* EMAIL CAPTURE - COMPACT */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-3 text-white shadow-md max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Weekly Top 10</h2>
                <p className="text-xs text-emerald-50">Every Monday. Zero spam.</p>
              </div>
              
              <Link
                href="/subscribe"
                className="bg-white text-emerald-600 font-semibold px-5 py-2 rounded-lg hover:bg-gray-50 transition text-sm whitespace-nowrap"
              >
                Subscribe →
              </Link>
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <section className="mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categoryCounts={categoryCounts}
            loading={statsLoading}
          />
        </section>

        {/* Stats Bar */}
        <section className="mb-10">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={`text-3xl md:text-4xl font-bold text-emerald-600 transition-opacity ${statsLoading ? 'opacity-50' : ''}`}>
                  {stats.totalVerified}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedCategory === 'all' ? 'Verified Listings' : 'In Category'}
                </div>
              </div>
              <div>
                <div className={`text-3xl md:text-4xl font-bold text-emerald-600 transition-opacity ${statsLoading ? 'opacity-50' : ''}`}>
                  {stats.addedThisWeek}
                </div>
                <div className="text-sm text-gray-600 mt-1">Added This Week</div>
              </div>
              <div>
                <div className={`text-3xl md:text-4xl font-bold text-emerald-600 transition-opacity ${statsLoading ? 'opacity-50' : ''}`}>
                  {stats.verifiedToday}
                </div>
                <div className="text-sm text-gray-600 mt-1">Verified Today</div>
              </div>
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              {selectedCategory === 'all' ? 'Top Listings' : categoryLabels[selectedCategory]}
            </h2>
            <Link
              href={selectedCategory === 'all' ? '/cleaning-index' : `/cleaning-index?category=${selectedCategory}`}
              className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
            >
              View All {stats.totalVerified} →
            </Link>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-600">No listings in this category yet.</p>
              <p className="text-gray-500 text-sm mt-1">Check back soon or browse all listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-emerald-300 transition group"
                >
                  <h3 className="font-bold text-lg mb-2 group-hover:text-emerald-600 transition line-clamp-2">
                    {listing.header}
                  </h3>
                  
                  {(listing.city || listing.state) && (
                    <p className="text-gray-500 text-sm mb-3">
                      📍 {listing.city}{listing.city && listing.state ? ', ' : ''}{listing.state}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Price</span>{' '}
                      <span className="font-semibold text-gray-900">{money(listing.price)}</span>
                    </div>
                    {listing.cash_flow && (
                      <div>
                        <span className="text-gray-500">CF</span>{' '}
                        <span className="font-semibold text-emerald-600">{money(listing.cash_flow)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* View All Button */}
          {listings.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                href={selectedCategory === 'all' ? '/cleaning-index' : `/cleaning-index?category=${selectedCategory}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-white font-semibold shadow-lg hover:bg-emerald-700 transition"
              >
                Browse All {stats.totalVerified} {selectedCategory === 'all' ? 'Listings' : categoryLabels[selectedCategory]} →
              </Link>
            </div>
          )}
        </section>

        {/* Trust Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 p-6 bg-white">
            <h3 className="font-bold text-lg mb-2">Complete Buying Guide</h3>
            <p className="text-gray-600 mb-4">
              Learn what to look for when buying a cleaning business, valuation tips, financing options, and more.
            </p>
            <Link
              href="/cleaning-business-for-sale"
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Read the guide →
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6 bg-white">
            <h3 className="font-bold text-lg mb-2">Why Trust CleaningExits?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Every listing manually verified</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>72.5% of BizBuySell removed as spam</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Human-curated Top 10 each week</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Direct broker contact info</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
