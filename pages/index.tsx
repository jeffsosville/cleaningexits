// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Top10 = {
  title: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  revenue: number | null;
  cash_flow: number | null;
  listing_url: string | null;
  description: string | null;
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
  // Last 90 days
  const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
  const days90agoISO = new Date(Date.now() - DAYS_90_MS).toISOString();

  // Include cleaning-related terms
  const includeOr = "title.ilike.%cleaning%,title.ilike.%janitorial%,title.ilike.%maid%,title.ilike.%housekeeping%,title.ilike.%custodial%";
  
  // Exclude non-cleaning businesses
  const EXCLUDES = [
    "%dry%clean%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%",
    "%convenience%", "%grocery%", "%bakery%", "%printing%", "%marketing%",
    "%construction%", "%roofing%", "%plumbing%", "%hvac%", "%landscap%",
    "%pest%", "%security%", "%catering%"
  ];

  // Query from actual listings table
  let q = supabase
    .from("listings")
    .select("title, city, state, location, price, cash_flow, revenue, description, listing_url, scraped_at")
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
    title: r.title ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    price: r.price ?? null,
    revenue: r.revenue ?? null,
    cash_flow: r.cash_flow ?? null,
    listing_url: r.listing_url ?? null,
    description: r.description ?? null,
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
        <title>Cleaning Exits — Top 10 & Index</title>
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-sm">
            ✅ Verified cleaning & related service exits
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            Cleaning Exits
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Find real, actionable cleaning & related service listings. Weekly curated Top 10 + a monthly audited Cleaning Index.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/daily-cleaning"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow hover:bg-emerald-700 transition"
            >
              View Today&apos;s Listings
            </Link>
            <Link
              href="/cleaning-index"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white shadow hover:bg-slate-800 transition"
            >
              Explore the Index
            </Link>
          </div>
          <div className="mt-3">
            <Link
              href="/subscribe"
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Prefer email? Get the weekly Top 10 →
            </Link>
          </div>
        </header>

        {/* Top 10 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Top 10 This Week</h2>

          <ol className="space-y-3">
            {(!top10 || top10.length === 0) && (
              <div className="rounded-2xl border p-6 text-gray-600">
                {errorAuto ? (
                  <>Couldn't load Top 10. {errorAuto}</>
                ) : (
                  <>No listings to show yet. Check back shortly.</>
                )}
              </div>
            )}

            {top10?.map((d, i) => (
              <li
                key={i}
                className="rounded-2xl border p-4 hover:shadow-sm transition"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <a
                        href={d.listing_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg font-semibold hover:underline"
                      >
                        {d.title ?? "Untitled"}
                      </a>
                      {(d.city || d.state) && (
                        <span className="text-gray-500">
                          • {d.city ? `${d.city}, ` : ""}
                          {d.state ?? ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                      <span>Price {money(d.price)}</span>
                      {d.cash_flow && <span>Cash flow {money(d.cash_flow)}</span>}
                      {d.revenue && <span>Revenue {money(d.revenue)}</span>}
                    </div>
                    {d.description && (
                      <p className="mt-2 text-sm text-gray-700">{d.description}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 text-sm text-gray-500">
            Updated weekly. Verified — no franchises, no lead-gen.
          </div>
        </section>

        {/* Index teaser */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="rounded-2xl border p-5">
            <h3 className="font-semibold mb-1">The Cleaning Index</h3>
            <p className="text-gray-600">
              Browse all cleaning business listings. See which listings are real and where to find them.
            </p>
            <Link
              href="/cleaning-index"
              className="inline-block mt-2 text-emerald-700 hover:text-emerald-800 underline"
            >
              View full index →
            </Link>
          </div>

          <div className="rounded-2xl border p-5">
            <h3 className="font-semibold mb-1">Why trust this?</h3>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Verified sources over marketplace noise</li>
              <li>Deduped & filtered (no franchise funnels)</li>
              <li>Human-curated Top 10 each week</li>
            </ul>
          </div>
        </section>

        <footer className="mt-16 text-center text-sm text-gray-500">
          Built for speed and signal. No fluff.
        </footer>
      </main>
    </>
  );
}
