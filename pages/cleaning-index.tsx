// pages/cleaning-index.tsx
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { GetServerSideProps } from "next";

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
};

type Props = {
  listings: Listing[];
  totalCount: number;
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

export const getServerSideProps: GetServerSideProps = async () => {
  // Get total count
  const { count } = await supabase
    .from("cleaning_listings_merge")
    .select("id", { count: "exact", head: true });

  // Get all listings
  const { data, error } = await supabase
    .from("cleaning_listings_merge")
    .select("id, header, city, state, location, price, cash_flow, revenue, notes, url, direct_broker_url, broker_account, scraped_at")
    .order("scraped_at", { ascending: false })
    .limit(1000);

  if (error || !data) {
    return { 
      props: { 
        listings: [], 
        totalCount: 0,
        hadError: true, 
        errMsg: error?.message ?? "Query failed" 
      } 
    };
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
  }));

  return { 
    props: { 
      listings, 
      totalCount: count ?? 0,
      hadError: false, 
      errMsg: null 
    } 
  };
};

export default function CleaningIndex({ listings, totalCount, hadError, errMsg }: Props) {
  return (
    <>
      <Head>
        <title>Cleaning Index — All Listings | Cleaning Exits</title>
        <meta
          name="description"
          content="Complete index of cleaning business listings. Browse all verified cleaning service businesses for sale."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="text-emerald-600 hover:underline mb-3 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            The Cleaning Index
          </h1>
          <p className="text-gray-600 text-lg">
            Complete database of {totalCount.toLocaleString()} verified cleaning business listings
          </p>
        </header>

        {/* Error state */}
        {hadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <strong>Error loading listings:</strong> {errMsg}
          </div>
        )}

        {/* Listings */}
        {!hadError && listings.length === 0 && (
          <div className="rounded-2xl border p-6 text-gray-600">
            No listings found. Check back soon!
          </div>
        )}

        {!hadError && listings.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {listings.length.toLocaleString()} of {totalCount.toLocaleString()} listings
              {listings.length < totalCount && " (pagination coming soon)"}
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
