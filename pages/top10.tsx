// pages/top-10.tsx
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
  why_hot: string | null;
  quality_score: number | null;
  established_year: number | null;
  employees: number | null;
};

type Props = {
  listings: Listing[];
  hadError: boolean;
  errMsg?: string | null;
};

const money = (n?: number | null) =>
  !n
    ? "N/A"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

export const getServerSideProps: GetServerSideProps = async () => {
  // Same include/exclude logic as your index page
  const includeOr = "title.ilike.%cleaning%,title.ilike.%janitorial%,title.ilike.%maid%,title.ilike.%housekeeping%,title.ilike.%custodial%,title.ilike.%window cleaning%,title.ilike.%carpet cleaning%,title.ilike.%pressure wash%,title.ilike.%power wash%";
  
  const EXCLUDES = [
    "%dry%clean%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%",
    "%convenience%", "%grocery%", "%bakery%", "%printing%", "%marketing%",
    "%construction%", "%contractor%", "%roofing%", "%plumbing%", "%hvac%", 
    "%landscap%", "%pest%", "%security%", "%catering%", "%lawn%", "%painting%",
    "%glass%", "%electrical%"
  ];

  let q = supabase
    .from("listings")
    .select("id, listing_id, title, city, state, location, price, cash_flow, revenue, description, listing_url, broker_account, why_hot, quality_score, established_year, employees")
    .or(includeOr)
    .eq("is_active", true)
    .gt("price", 0);

  for (const x of EXCLUDES) {
    q = q.not("title", "ilike", x);
  }

  const { data, error } = await q
    .order("quality_score", { ascending: false, nullsFirst: false })
    .order("revenue", { ascending: false, nullsFirst: false })
    .order("price", { ascending: false })
    .limit(10);

  if (error || !data) {
    return { 
      props: { 
        listings: [], 
        hadError: true, 
        errMsg: error?.message ?? "Query failed" 
      } 
    };
  }

  const listings = data.map((r) => ({
    id: r.id,
    listing_id: r.listing_id ?? null,
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
    why_hot: r.why_hot ?? null,
    quality_score: r.quality_score ?? null,
    established_year: r.established_year ?? null,
    employees: r.employees ?? null,
  }));

  return { 
    props: { 
      listings, 
      hadError: false, 
      errMsg: null 
    } 
  };
};

export default function Top10({ listings, hadError, errMsg }: Props) {
  const calculateMultiple = (price: number | null, revenue: number | null) => {
    if (!price || !revenue) return null;
    return (price / revenue).toFixed(2);
  };

  return (
    <>
      <Head>
        <title>Top 10 Cleaning Businesses For Sale | CleaningExits</title>
        <meta
          name="description"
          content="Top 10 commercial cleaning businesses for sale. Hand-picked and analyzed. Updated weekly."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  CleaningExits
                </Link>
                <p className="text-sm text-gray-600 mt-1">Top 10 Commercial Cleaning Businesses</p>
              </div>
              <Link href="/cleaning-index" className="text-blue-600 hover:text-blue-700 font-medium">
                View All Listings →
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
              Top 10 Cleaning Businesses For Sale
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hand-picked and analyzed. The best deals on the market right now.
            </p>
            <p className="text-sm text-gray-500 mt-2">Updated weekly</p>
          </div>

          {hadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">
                Couldn't load Top 10. {errMsg ?? "Check connection."}
              </p>
            </div>
          )}

          {/* Listings */}
          <div className="space-y-6">
            {listings.map((listing, index) => {
              const multiple = calculateMultiple(listing.price, listing.revenue);
              
              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Rank Badge */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-center md:w-24">
                      <div className="text-center">
                        <div className="text-4xl font-bold">#{index + 1}</div>
                        {listing.quality_score && (
                          <div className="text-xs mt-1 opacity-90">Score: {listing.quality_score}</div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {listing.title || 'Commercial Cleaning Business'}
                          </h2>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              📍 {listing.location || (listing.city && listing.state ? `${listing.city}, ${listing.state}` : 'Location TBD')}
                            </span>
                            {listing.established_year && (
                              <span>Est. {listing.established_year}</span>
                            )}
                            {listing.employees && (
                              <span>{listing.employees} employees</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Asking Price</div>
                          <div className="text-lg font-bold text-blue-600">
                            {money(listing.price)}
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Revenue</div>
                          <div className="text-lg font-bold text-green-600">
                            {money(listing.revenue)}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Cash Flow</div>
                          <div className="text-lg font-bold text-purple-600">
                            {money(listing.cash_flow)}
                          </div>
                        </div>
                        {multiple && (
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">Multiple</div>
                            <div className="text-lg font-bold text-orange-600">
                              {multiple}x
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Why Hot */}
                      {listing.why_hot && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                          <div className="flex items-start">
                            <span className="text-2xl mr-2">🔥</span>
                            <div>
                              <div className="text-sm font-semibold text-yellow-800 mb-1">Why This Deal</div>
                              <p className="text-sm text-yellow-900">{listing.why_hot}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Description Preview */}
                      {listing.description && (
                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {listing.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        {listing.listing_id ? (
                          <Link
                            href={`/listing/${listing.listing_id}`}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                          >
                            View Full Analysis →
                          </Link>
                        ) : (
                          <div className="flex-1 bg-gray-300 text-gray-600 px-6 py-3 rounded-lg font-semibold text-center cursor-not-allowed">
                            Analysis Coming Soon
                          </div>
                        )}
                        {listing.listing_url && (
                          <a
                            href={listing.listing_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                          >
                            Original Listing
                          </a>
                        )}
                      </div>

                      {listing.broker_account && (
                        <div className="mt-3 text-xs text-gray-500">
                          Listed by: {listing.broker_account}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Want alerts for new top deals?
            </h2>
            <p className="text-gray-600 mb-6">
              Subscribe to get weekly updates when we refresh the Top 10
            </p>
            <div className="max-w-md mx-auto flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
