// pages/cleaning-index.tsx
import { useState } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useRouter } from 'next/router';
import { createClient } from "@supabase/supabase-js";
import type { GetServerSideProps } from "next";
import { CategoryFilter, CategorySlug, CATEGORIES } from '../components/CategoryFilter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Listing = {
  listing_id: string | null;
  title: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  price: number | null;
  cash_flow: number | null;
  revenue: number | null;
  description: string | null;
  listing_url: string | null;
  broker_account: string | null;
  scraped_at: string | null;
  category: string | null;
};

type Props = {
  listings: Listing[];
  totalCount: number;
  categoryCounts: Record<CategorySlug, number>;
  initialCategory: CategorySlug;
  hadError: boolean;
  errMsg: string | null;
};

const money = (n?: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

// Category display names
const categoryLabels: Record<CategorySlug, string> = {
  all: 'All Listings',
  laundromat: 'Laundromat',
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  // Get category from URL query param
  const categoryParam = query.category as string | undefined;
  const validCategories = CATEGORIES.map(c => c.slug);
  const initialCategory: CategorySlug = categoryParam && validCategories.includes(categoryParam as CategorySlug) 
    ? (categoryParam as CategorySlug) 
    : 'all';

  // Build the base query for listings
  let listingsQuery = supabase
    .from("cleaning_listings_merge")
    .select("id, header, city, state, location, price, cash_flow, revenue, notes, url, direct_broker_url, broker_account, scraped_at, category")
    .eq("is_verified", true)
    .order("scraped_at", { ascending: false })
    .limit(1000);

  // Apply category filter if not 'all'
  if (initialCategory !== 'all') {
    listingsQuery = listingsQuery.eq('category', initialCategory);
  }

  // Get listings
  const { data, error } = await listingsQuery;

  if (error || !data) {
    return { 
      props: { 
        listings: [], 
        totalCount: 0,
        categoryCounts: {},
        initialCategory,
        hadError: true, 
        errMsg: error?.message ?? "Query failed" 
      } 
    };
  }

  // Get category counts for the filter badges
  const { data: countData } = await supabase
    .from("cleaning_listings_merge")
    .select("category")
    .eq("is_verified", true);

  const categoryCounts: Record<string, number> = { all: 0 };
  if (countData) {
    countData.forEach((row) => {
      const cat = row.category || 'other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      categoryCounts.all++;
    });
  }

  const listings = data.map((r) => ({
    listing_id: r.id ?? null,
    title: r.header ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    location: r.location ?? null,
    price: r.price ?? null,
    cash_flow: r.cash_flow ?? null,
    revenue: r.revenue ?? null,
    description: r.notes ?? null,
    listing_url: r.direct_broker_url ?? r.url ?? null,
    broker_account: r.broker_account ?? null,
    scraped_at: r.scraped_at ?? null,
    category: r.category ?? null,
  }));

  return { 
    props: { 
      listings, 
      totalCount: listings.length,
      categoryCounts,
      initialCategory,
      hadError: false, 
      errMsg: null 
    } 
  };
};

export default function CleaningIndex({ listings, totalCount, categoryCounts, initialCategory, hadError, errMsg }: Props) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>(initialCategory);

  // Handle category change - update URL
  const handleCategoryChange = (category: CategorySlug) => {
    setSelectedCategory(category);
    
    // Update URL without full page reload for better UX
    const url = category === 'all' 
      ? '/cleaning-index' 
      : `/cleaning-index?category=${category}`;
    
    router.push(url, undefined, { shallow: false });
  };

  const pageTitle = selectedCategory === 'all' 
    ? `All Cleaning Businesses For Sale | ${totalCount} Verified Listings`
    : `${categoryLabels[selectedCategory]} Businesses For Sale | ${totalCount} Listings`;

  const pageDescription = selectedCategory === 'all'
    ? `Find cleaning businesses for sale - ${totalCount} verified listings across commercial cleaning, laundromats, landscaping, and more. Updated daily.`
    : `Find ${categoryLabels[selectedCategory].toLowerCase()} businesses for sale - ${totalCount} verified listings. No franchises, no spam. Updated daily.`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <Link href="/" className="text-emerald-600 hover:underline mb-3 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            {selectedCategory === 'all' ? 'The Cleaning Index' : categoryLabels[selectedCategory]}
          </h1>
          <p className="text-gray-600 text-lg">
            {totalCount.toLocaleString()} verified {selectedCategory === 'all' ? 'business' : categoryLabels[selectedCategory].toLowerCase()} listings
          </p>
        </header>

        {/* Category Filters */}
        <section className="mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categoryCounts={categoryCounts}
            loading={false}
          />
        </section>

        {/* Error state */}
        {hadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <strong>Error loading listings:</strong> {errMsg}
          </div>
        )}

        {/* Listings */}
        {!hadError && listings.length === 0 && (
          <div className="rounded-2xl border p-6 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-600">No listings in this category yet.</p>
            <p className="text-gray-500 text-sm mt-1">Check back soon or browse all listings.</p>
            <button
              onClick={() => handleCategoryChange('all')}
              className="mt-4 text-emerald-600 hover:underline font-medium"
            >
              View all listings →
            </button>
          </div>
        )}

        {!hadError && listings.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {listings.length.toLocaleString()} listings
            </div>

            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.listing_id}
                  className="rounded-2xl border p-4 hover:shadow-sm transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link
                          href={listing.listing_id ? `/listing/${listing.listing_id}` : listing.listing_url ?? "#"}
                          className="text-lg font-semibold hover:underline text-emerald-700"
                        >
                          {listing.title ?? "Untitled"}
                        </Link>
                        {(listing.city || listing.state) && (
                          <span className="text-gray-500">
                            • {listing.city ? `${listing.city}, ` : ""}
                            {listing.state ?? ""}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                        <span>Price {money(listing.price)}</span>
                        {listing.cash_flow && (
                          <span>Cash flow {money(listing.cash_flow)}</span>
                        )}
                        {listing.revenue && (
                          <span>Revenue {money(listing.revenue)}</span>
                        )}
                        {listing.broker_account && (
                          <span className="text-gray-400">
                            via {listing.broker_account}
                          </span>
                        )}
                        {listing.listing_url && (
                          <a
                            href={listing.listing_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:underline"
                          >
                            View original →
                          </a>
                        )}
                      </div>

                      {listing.description && (
                        <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                          {listing.description}
                        </p>
                      )}

                      {listing.scraped_at && (
                        <div className="mt-2 text-xs text-gray-400">
                          Added {new Date(listing.scraped_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          <Link href="/" className="text-emerald-600 hover:underline">
            Back to Home
          </Link>
        </footer>
      </main>
    </>
  );
}

