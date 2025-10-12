// pages/cleaning-index.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Listing = {
  id: string;
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
  errMsg?: string | null;
};

const money = (n?: number | null) =>
  !n
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

export const getServerSideProps: GetServerSideProps = async () => {
  // Include cleaning-related terms
  const includeOr = "title.ilike.%cleaning%,title.ilike.%janitorial%,title.ilike.%maid%,title.ilike.%housekeeping%,title.ilike.%custodial%,title.ilike.%window cleaning%,title.ilike.%carpet cleaning%,title.ilike.%pressure wash%,title.ilike.%power wash%";
  
  // Exclude non-cleaning businesses
  const EXCLUDES = [
    "%dry%clean%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%",
    "%convenience%", "%grocery%", "%bakery%", "%printing%", "%marketing%",
    "%construction%", "%contractor%", "%roofing%", "%plumbing%", "%hvac%", 
    "%landscap%", "%pest%", "%security%", "%catering%", "%lawn%", "%painting%",
    "%glass%", "%electrical%"
  ];

  // Get count first
  let countQuery = supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .or(includeOr)
    .eq("is_active", true);

  for (const x of EXCLUDES) {
    countQuery = countQuery.not("title", "ilike", x);
  }

  const { count } = await countQuery;

  // Get all listings (we'll add pagination later)
  let q = supabase
    .from("listings")
    .select("id, title, city, state, location, price, cash_flow, revenue, description, listing_url, broker_account, scraped_at")
    .or(includeOr)
    .eq("is_active", true);

  for (const x of EXCLUDES) {
    q = q.not("title", "ilike", x);
  }

  const { data, error } = await q
    .order("scraped_at", { ascending: false })
    .limit(1000); // Start with 1000, we'll add pagination later

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
    id: r.id,
    title: r.title ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    location: r.location ?? null,
    price: r.price ?? null,
    cash_flow: r.cash_flow ?? null,
    revenue: r.revenue ?? null,
    description: r.description ?? null,
    listing_url: r.listing_url ?? null,
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
        <title>Cleaning Index — All Listings</title>
        <meta
          name="description"
          content="Complete index of cleaning business listings. Browse all verified cleaning service businesses for sale."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Cleaning Index
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">
              {totalCount.toLocaleString()} total
            </span>
          </h1>
          <p className="text-gray-600">
            Complete index of all cleaning business listings. Showing {listings.length.toLocaleString()} of {totalCount.toLocaleString()} listings.
          </p>
          <div className="mt-2">
            <Link href="/" className="underline text-emerald-700">
              ← Back to Home
            </Link>
          </div>
          {hadError && (
            <p className="mt-3 text-sm text-red-600">
              Couldn't load listings. {errMsg ?? "Check connection and permissions."}
            </p>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border p-4">
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Listings</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-2xl font-bold">{listings.length.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Showing Now</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-2xl font-bold">
              {listings.filter(l => l.cash_flow && l.cash_flow > 0).length}
            </div>
            <div className="text-sm text-gray-600">With Cash Flow Data</div>
          </div>
        </div>

        {/* Body */}
        {listings.length === 0 ? (
          <p className="text-gray-600">
            No listings found. This might be a filtering or database issue.
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {listings.map((listing) => (
                <li 
                  key={listing.id} 
                  className="rounded-xl border p-4 hover:shadow-sm transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <a
                          href={listing.listing_url ?? "#"}
                          target={listing.listing_url ? "_blank" : "_self"}
                          rel="noreferrer"
                          className="font-semibold text-lg hover:underline"
                        >
                          {listing.title ?? "Untitled listing"}
                        </a>
                        {(listing.city || listing.state || listing.location) && (
                          <span className="text-gray-500 text-sm">
                            • {listing.city && listing.state 
                              ? `${listing.city}, ${listing.state}`
                              : listing.location ?? ""}
                          </span>
                        )}
                      </div>
                      <div className="text-sm mt-1 text-gray-700 flex flex-wrap gap-3">
                        <span>Price {money(listing.price)}</span>
                        {listing.cash_flow && <span>Cash Flow {money(listing.cash_flow)}</span>}
                        {listing.revenue && <span>Revenue {money(listing.revenue)}</span>}
                        {listing.scraped_at && (
                          <span className="text-gray-500">
                            Added {new Date(listing.scraped_at).toLocaleDateString("en-US")}
                          </span>
                        )}
                      </div>
                      {listing.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {listing.description}
                        </p>
                      )}
                      {listing.broker_account && (
                        <div className="text-xs text-gray-500 mt-1">
                          Broker: {listing.broker_account}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {listings.length < totalCount && (
              <div className="mt-6 text-center text-sm text-gray-500 p-4 border rounded-xl">
                Showing {listings.length.toLocaleString()} of {totalCount.toLocaleString()} listings.
                <br />
                Pagination coming soon!
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
