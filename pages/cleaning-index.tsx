// pages/cleaning-index.tsx
// UPDATED: Now pulls from /api/listings (DealLedger) instead of cleaning_listings_merge
// DealLedger is the single source of truth for all listing data

import { useState, useEffect, useCallback } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useRouter } from 'next/router';
import { CategoryFilter, CategorySlug, CATEGORIES } from '../components/CategoryFilter';

type Listing = {
  id: number;
  listing_number: number | null;
  header: string | null;
  price: number | null;
  cash_flow: number | null;
  state: string | null;
  city: string | null;
  category: string | null;
  days_on_market: number | null;
  listing_views: number | null;
  estimated_listed_date: string | null;
  first_seen: string | null;
  url: string | null;
  broker_account: string | null;
  contact_name: string | null;
  price_reduced: boolean;
  dom_badge: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const categoryLabels: Record<string, string> = {
  all:                  'All Listings',
  commercial_cleaning:  'Commercial Cleaning',
  residential_cleaning: 'Residential Cleaning',
  laundromat:           'Laundromat',
  landscaping:          'Landscaping',
  pool_service:         'Pool Service',
  pressure_washing:     'Pressure Washing',
  junk_removal:         'Junk Removal',
  dry_cleaner:          'Dry Cleaners',
  pest_control:         'Pest Control',
};

const money = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const domColor = (dom: number | null) => {
  if (dom == null) return 'text-gray-400';
  if (dom <= 14)  return 'text-emerald-600';
  if (dom <= 90)  return 'text-gray-500';
  if (dom <= 180) return 'text-amber-600';
  return 'text-red-500';
};

const domLabel = (dom: number | null) => {
  if (dom == null) return null;
  if (dom <= 14)  return `🟢 ${dom}d on market`;
  if (dom <= 90)  return `${dom}d on market`;
  if (dom <= 180) return `⏳ ${dom}d on market`;
  return `🔴 ${dom}d on market`;
};

export default function CleaningIndex() {
  const router = useRouter();

  const categoryParam = router.query.category as string | undefined;
  const validSlugs = CATEGORIES.map((c: { slug: string }) => c.slug);
  const initialCategory: CategorySlug = categoryParam && validSlugs.includes(categoryParam as CategorySlug)
    ? (categoryParam as CategorySlug)
    : 'laundromat';

  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>(initialCategory);
  const [listings, setListings]                 = useState<Listing[]>([]);
  const [pagination, setPagination]             = useState<Pagination | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [page, setPage]                         = useState(1);
  const [search, setSearch]                     = useState('');
  const [searchInput, setSearchInput]           = useState('');

  // Sync category from URL
  useEffect(() => {
    if (categoryParam && validSlugs.includes(categoryParam)) {
      setSelectedCategory(categoryParam as CategorySlug);
      setPage(1);
    }
  }, [categoryParam]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category:  selectedCategory,
        sortBy:    'days_on_market',
        sortOrder: 'asc',
        limit:     '50',
        page:      String(page),
      });
      if (search) params.set('search', search);

      const res  = await fetch(`/api/listings?${params}`);
      const data = await res.json();
      setListings(data.listings || []);
      setPagination(data.pagination || null);
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, page, search]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleCategoryChange = (category: CategorySlug) => {
    setSelectedCategory(category);
    setPage(1);
    const url = category === 'all' ? '/cleaning-index' : `/cleaning-index?category=${category}`;
    router.push(url, undefined, { shallow: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const label = categoryLabels[selectedCategory] ?? 'Cleaning Business';
  const total = pagination?.total ?? 0;

  return (
    <>
      <Head>
        <title>{label} Businesses For Sale | {total} Listings | CleaningExits</title>
        <meta name="description" content={`Find ${label.toLowerCase()} businesses for sale. ${total} listings sorted by days on market. Updated daily from DealLedger.`} />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <header className="mb-6">
          <Link href="/" className="text-emerald-600 hover:underline mb-3 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            {selectedCategory === 'all' ? 'The Cleaning Index' : label}
          </h1>
          {!loading && (
            <p className="text-gray-600 text-lg">
              {total.toLocaleString()} listings — sorted by days on market
            </p>
          )}
        </header>

        {/* Category Filter */}
        <section className="mb-5">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categoryCounts={{
              all: 0,
              commercial_cleaning: 0,
              residential_cleaning: 0,
              laundromat: 0,
              landscaping: 0,
              pool_service: 0,
              pressure_washing: 0,
              junk_removal: 0,
              dry_cleaner: 0,
              pest_control: 0,
            }}
            loading={loading}
          />
        </section>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search listings..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && listings.length === 0 && (
          <div className="rounded-2xl border p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-600">No listings found.</p>
            <button onClick={() => handleCategoryChange('all')} className="mt-4 text-emerald-600 hover:underline font-medium">
              View all listings →
            </button>
          </div>
        )}

        {/* Listings */}
        {!loading && listings.length > 0 && (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div key={listing.id} className="rounded-2xl border p-4 hover:shadow-sm transition">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <a
                      href={listing.url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lg font-semibold hover:underline text-emerald-700"
                    >
                      {listing.header ?? "Untitled"}
                    </a>
                    {(listing.city || listing.state) && (
                      <span className="text-gray-500">
                        • {listing.city ? `${listing.city}, ` : ""}{listing.state ?? ""}
                      </span>
                    )}
                    {listing.price_reduced && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Price Reduced
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                    <span>Price {money(listing.price)}</span>
                    {listing.cash_flow && <span>Cash flow {money(listing.cash_flow)}</span>}
                    {listing.broker_account && (
                      <span className="text-gray-400">via {listing.broker_account}</span>
                    )}
                    {listing.days_on_market !== null && (
                      <span className={`font-medium ${domColor(listing.days_on_market)}`}>
                        {domLabel(listing.days_on_market)}
                      </span>
                    )}
                    {listing.listing_views != null && listing.listing_views > 0 && (
                      <span className="text-gray-400">{listing.listing_views} views</span>
                    )}
                    <a
                      href={listing.url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      View original →
                    </a>
                  </div>

                  {listing.first_seen && (
                    <div className="mt-1 text-xs text-gray-400">
                      Added {new Date(listing.first_seen).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Next →
            </button>
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Data sourced from <a href="https://dealledger.org" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">DealLedger</a> — updated daily</p>
          <Link href="/" className="text-emerald-600 hover:underline mt-1 inline-block">Back to Home</Link>
        </footer>

      </main>
    </>
  );
}
