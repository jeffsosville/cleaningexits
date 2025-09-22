// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Top10 = {
  header: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  revenue: number | null;
  cashflow: number | null;
  ebitda: number | null;
  url: string | null;
  picked_on: string | null;
  notes: string | null;
};
type KPI = {
  month_label: string;
  total_listed: number;
  verified_real: number;
  junk_pct: number;
  last_updated: string;
};

const money = (n?: number | null) =>
  !n ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export async function getServerSideProps() {
  // 1) Try curated featured
  const { data: featured, error: eFeat } = await supabase
    .from("cleaning_top10_featured")
    .select("header, city, state, price, revenue, cashflow, ebitda, url, picked_on, notes")
    .order("picked_on", { ascending: false })
    .limit(10);

  // If we have curated rows, use them.
  if ((featured?.length ?? 0) > 0 && !eFeat) {
    // Get total count from comprehensive listings for display
    const { count: totalListings } = await supabase
      .from("cleaning_listings")
      .select("*", { count: "exact", head: true });

    // Optionally pull KPIs (non-blocking)
    const { data: kpiRows } = await supabase
      .from("cleaning_index_kpis_v1")
      .select("month_label, total_listed, verified_real, junk_pct, last_updated")
      .order("last_updated", { ascending: false })
      .limit(1);

    return {
      props: {
        top10: featured,
        kpis: (kpiRows && kpiRows[0]) ? kpiRows[0] : null,
        totalListings: totalListings || 0,
      },
    };
  }

  // 2) Fallback to AUTO view (map its columns → homepage shape)
  const { data: auto, error: eAuto } = await supabase
    .from("cleaning_top10_auto")
    .select("id, title, location, region, price, cashflow, ebitda, broker, url, description")
    .limit(10);

  const mapped = (auto ?? []).map((r: any) => {
    // split "City, ST" into parts if present
    let city: string | null = null;
    let state: string | null = null;
    if (r.location && typeof r.location === "string" && r.location.includes(",")) {
      const parts = r.location.split(",").map((s: string) => s.trim());
      city = parts[0] || null;
      state = parts[1] || r.region || null;
    } else {
      state = r.region || null;
    }
    return {
      header: r.title ?? null,
      city,
      state,
      price: r.price ?? null,
      revenue: null,
      cashflow: r.cashflow ?? null,
      ebitda: r.ebitda ?? null,
      url: r.url ?? null,
      picked_on: null,
      notes: r.description ?? null,
    };
  });

  // Get total count from comprehensive listings
  const { count: totalListings } = await supabase
    .from("cleaning_listings")
    .select("*", { count: "exact", head: true });

  // KPIs (optional)
  const { data: kpiRows } = await supabase
    .from("cleaning_index_kpis_v1")
    .select("month_label, total_listed, verified_real, junk_pct, last_updated")
    .order("last_updated", { ascending: false })
    .limit(1);

  return {
    props: {
      top10: mapped,         // ← shows AUTO if featured is empty
      kpis: (kpiRows && kpiRows[0]) ? kpiRows[0] : null,
      totalListings: totalListings || 0,
    },
  };
}

export default function Home({ top10, kpis, totalListings }: { top10: Top10[]; kpis: KPI | null; totalListings: number }) {
  return (
    <>
      <Head><title>Cleaning Exits — Business Opportunities & Exit Strategies</title></Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero + CTAs */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-sm">
            ✅ Verified cleaning & related service exits
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">Cleaning Exits</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Find real, actionable cleaning & related service listings. Weekly curated Top 10 + {totalListings.toLocaleString()}+ comprehensive business opportunities.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/listings" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow hover:bg-emerald-700 transition">
              Browse All {totalListings.toLocaleString()}+ Listings
            </Link>
            <Link href="/top10" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white shadow hover:bg-slate-800 transition">
              View Top 10 Picks
            </Link>
          </div>
          <div className="mt-3">
            <Link href="/subscribe" className="text-sm text-gray-500 hover:text-gray-700 underline">
              Prefer email? Get the weekly Top 10 →
            </Link>
          </div>
        </header>

        {/* TOP 10 FIRST */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Top 10 This Week</h2>
            <Link href="/top10" className="text-sm text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1">
              See details →
            </Link>
          </div>

          <ol className="space-y-3">
            {(!top10 || top10.length === 0) && (
              <div className="rounded-2xl border p-6 text-gray-600">No featured listings yet. Check back shortly.</div>
            )}

            {top10?.map((d, i) => (
              <li key={i} className="rounded-2xl border p-4 hover:shadow-sm transition">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <a href={d.url ?? "#"} target="_blank" rel="noreferrer" className="text-lg font-semibold hover:underline">
                        {d.header}
                      </a>
                      <span className="text-gray-500">• {d.city}, {d.state}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                      <span>Price {money(d.price)}</span>
                      {d.cashflow ? <span>Cash flow {money(d.cashflow)}</span> : d.ebitda ? <span>EBITDA {money(d.ebitda as any)}</span> : null}
                      {d.revenue ? <span>Revenue {money(d.revenue)}</span> : null}
                    </div>
                    {d.notes && <p className="mt-2 text-sm text-gray-700">{d.notes}</p>}
                  </div>
                  <div className="hidden sm:block text-right text-xs text-gray-500">
                    <div>Picked {d.picked_on ? new Date(d.picked_on as any).toLocaleDateString() : ""}</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 text-sm text-gray-500">
            Updated weekly. Verified — no franchises, no lead-gen.
          </div>
        </section>

        {/* INFO BLOCKS MOVED BELOW TOP 10 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Comprehensive Listings */}
          <div className="rounded-2xl border p-5">
            <h3 className="font-semibold mb-1">Comprehensive Business Database</h3>
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {totalListings.toLocaleString()} active listings
              </div>
              <div className="text-sm text-gray-600">
                Search by location, price, cash flow • Updated daily
              </div>
              <Link href="/listings" className="inline-block mt-2 text-emerald-700 hover:text-emerald-800 underline">
                Browse all opportunities →
              </Link>
            </div>
          </div>

          {/* Why trust this */}
          <div className="rounded-2xl border p-5">
            <h3 className="font-semibold mb-1">Why trust this?</h3>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Daily automated data collection from verified sources</li>
              <li>Advanced search & filtering capabilities</li>
              <li>Direct links to original listings</li>
              <li>Human-curated Top 10 weekly picks</li>
            </ul>
          </div>
        </section>

        {/* Index KPIs section (if available) */}
        {kpis && (
          <section className="mt-8 rounded-2xl border p-5 bg-gray-50">
            <h3 className="font-semibold mb-3">Market Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-600">
                  {kpis.verified_real.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Verified Real</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-700">
                  {kpis.total_listed.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Listed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">
                  {kpis.junk_pct}%
                </div>
                <div className="text-sm text-gray-600">Filtered Out</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">
              {kpis.month_label} • Last updated {new Date(kpis.last_updated).toLocaleDateString()}
            </div>
          </section>
        )}

        <footer className="mt-16 text-center text-sm text-gray-500">
          Built for speed and signal. No fluff.
        </footer>
      </main>
    </>
  );
}
