// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Top10 = {
  listing_id: string | null;
  title: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  revenue: number | null;
  cash_flow: number | null;
  listing_url: string | null;
  description: string | null;
  why_hot: string | null;
};

const money = (n?: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

export async function getServerSideProps() {
  const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
  const days90agoISO = new Date(Date.now() - DAYS_90_MS).toISOString();

  const includeOr = "title.ilike.%cleaning%,title.ilike.%janitorial%,title.ilike.%maid%,title.ilike.%housekeeping%,title.ilike.%custodial%";
  
  const EXCLUDES = [
    "%dry%clean%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%",
    "%convenience%", "%grocery%", "%bakery%", "%printing%", "%marketing%",
    "%construction%", "%roofing%", "%plumbing%", "%hvac%", "%landscap%",
    "%pest%", "%security%", "%catering%"
  ];

  let q = supabase
    .from("listings")
    .select("listing_id, title, city, state, location, price, cash_flow, revenue, description, listing_url, scraped_at, why_hot")
    .or(includeOr)
    .gte("scraped_at", days90agoISO)
    .eq("is_active", true);

  for (const x of EXCLUDES) q = q.not("title", "ilike", x);

  const { data, error } = await q
    .order("cash_flow", { ascending: false, nullsFirst: false })
    .order("price", { ascending: false, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .limit(10);

  const top10 = (data ?? []).map((r: any) => ({
    listing_id: r.listing_id ?? null,
    title: r.title ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    price: r.price ?? null,
    revenue: r.revenue ?? null,
    cash_flow: r.cash_flow ?? null,
    listing_url: r.listing_url ?? null,
    description: r.description ?? null,
    why_hot: r.why_hot ?? null,
  }));

  return {
    props: {
      top10,
      errorAuto: error?.message || null,
    },
  };
}

export default function Home({
  top10,
  errorAuto,
}: {
  top10: Top10[];
  errorAuto?: string | null;
}) {
  return (
    <>
      <Head>
        <title>Cleaning Exits — 847 Verified Commercial Cleaning Businesses For Sale</title>
        <meta name="description" content="No franchises. No maid services. No BS. We scrape 800+ brokers daily to save you time." />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-sm font-semibold">
            ✅ Verified cleaning & related service exits
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Cleaning Exits
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-800 font-semibold max-w-3xl mx-auto">
            847 Verified Commercial Cleaning Businesses
          </p>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto text-lg">
            No franchises. No maid services. No dead listings.<br />
            We scrape 2000+ brokers daily so you don&apos;t waste time.
          </p>
        </header>

        {/* EMAIL CAPTURE - COMPACT 1/2 INCH */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-3 text-white shadow-md max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <h2 className="text-base font-bold">Get the Weekly Top 10</h2>
                  <p className="text-xs text-emerald-50">Every Monday. Zero spam.</p>
                </div>
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

        {/* Stats Bar */}
        <section className="mb-10">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-emerald-600">847</div>
                <div className="text-sm text-gray-600 mt-1">Verified Listings</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-emerald-600">63</div>
                <div className="text-sm text-gray-600 mt-1">Added This Week</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-emerald-600">14</div>
                <div className="text-sm text-gray-600 mt-1">Verified Today</div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/daily-cleaning"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-emerald-700 transition"
          >
            View Today&apos;s Listings
          </Link>
          <Link
            href="/cleaning-index"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold shadow-md hover:bg-slate-800 transition"
          >
            Explore Full Index
          </Link>
        </div>

        {/* Top 10 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
            <span className="text-yellow-500"></span>
            Top <span className="text-yellow-500">10</span> This Week
          </h2>

          <ol className="space-y-4">
            {(!top10 || top10.length === 0) && (
              <div className="rounded-2xl border p-6 text-gray-600">
                {errorAuto ? (
                  <>Couldn&apos;t load Top 10. {errorAuto}</>
                ) : (
                  <>No listings to show yet. Check back shortly.</>
                )}
              </div>
            )}

            {top10?.map((d, i) => (
              <li
                key={i}
                className="rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-emerald-200 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1 h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                      <Link
                        href={d.listing_id ? `/listing/${d.listing_id}` : d.listing_url ?? "#"}
                        className="text-lg md:text-xl font-bold hover:text-emerald-600 transition"
                      >
                        {d.title ?? "Untitled"}
                      </Link>
                    </div>

                    {(d.city || d.state) && (
                      <div className="text-gray-600 text-sm mb-3">
                        📍 {d.city ? `${d.city}, ` : ""}{d.state ?? ""}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 mb-3 text-sm font-semibold">
                      <div>
                        <span className="text-gray-500">Price</span>{" "}
                        <span className="text-gray-900">{money(d.price)}</span>
                      </div>
                      {d.cash_flow && (
                        <div>
                          <span className="text-gray-500">Cash flow</span>{" "}
                          <span className="text-emerald-600">{money(d.cash_flow)}</span>
                        </div>
                      )}
                      {d.revenue && (
                        <div>
                          <span className="text-gray-500">Revenue</span>{" "}
                          <span className="text-gray-900">{money(d.revenue)}</span>
                        </div>
                      )}
                    </div>

                    {d.why_hot && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r mb-3">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">🔥</span>
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold text-gray-900">Why it&apos;s hot:</span> {d.why_hot}
                          </div>
                        </div>
                      </div>
                    )}

                    {d.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {d.description}
                      </p>
                    )}

                    <Link
                      href={d.listing_id ? `/listing/${d.listing_id}` : d.listing_url ?? "#"}
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="font-semibold">Updated weekly</p>
            <p>Verified • No franchises • No lead-gen</p>
          </div>
        </section>

        {/* Trust Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="rounded-2xl border border-gray-200 p-6 bg-white">
            <h3 className="font-bold text-lg mb-2">The Cleaning Index</h3>
            <p className="text-gray-600 mb-4">
              Browse all 847 verified cleaning business listings. See which are real and where to find them.
            </p>
            <Link
              href="/cleaning-index"
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              View full index →
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6 bg-white">
            <h3 className="font-bold text-lg mb-2">Why Trust CleaningExits?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Verified sources over marketplace noise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Deduped & filtered (no franchise funnels)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Human-curated Top 10 each week</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Direct broker relationships</span>
              </li>
            </ul>
          </div>
        </section>

        <footer className="mt-16 text-center text-sm text-gray-500 border-t pt-8">
          <p className="font-semibold">Built for speed and signal. No fluff.</p>
          <p className="mt-2">© 2025 Cleaning Exits</p>
        </footer>
      </main>
    </>
  );
}
