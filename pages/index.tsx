// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (public reads with anon key; ensure RLS permits select on the view)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Top10 = {
  header: string | null;
  city: string | null;
  state: string | null;
  price: number | null;     // from asking_price
  revenue: number | null;   // not in view, keep null for UI
  cashflow: number | null;
  ebitda: number | null;
  url: string | null;
  picked_on: string | null; // unused here; kept for UI shape
  notes: string | null;     // from description
};

type KPI = {
  month_label: string;
  total_listed: number;
  verified_real: number;
  junk_pct: number;
  last_updated: string;
} | null;

const money = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function toNum(v: any): number | null {
  if (v == null) return null;
  // Supabase numeric can arrive as string; coerce safely
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getServerSideProps() {
  // Primary source: cleaning_top10_auto (exact columns per your schema)
  const { data: auto, error: eAuto } = await supabase
    .from("cleaning_top10_auto")
    .select("id, title, location, region, asking_price, cashflow, ebitda, broker, url, description")
    .limit(10);

  // Optional KPIs (best-effort)
  const { data: kpiRows } = await supabase
    .from("cleaning_index_kpis_v1")
    .select("month_label, total_listed, verified_real, junk_pct, last_updated")
    .order("last_updated", { ascending: false })
    .limit(1);

  // Map rows to UI-friendly shape
  const top10: Top10[] = (auto ?? []).map((r: any) => {
    const header: string | null = r?.title ?? null;

    // Split "City, ST" if present in location; else fall back to region as state
    let city: string | null = null;
    let state: string | null = null;
    const loc: string | null = r?.location ?? null;
    if (loc && typeof loc === "string" && loc.includes(",")) {
      const parts = loc.split(",").map((s: string) => s.trim());
      city = parts[0] || null;
      state = parts[1] || (r?.region ?? null);
    } else {
      state = r?.region ?? null;
    }

    return {
      header,
      city,
      state,
      price: toNum(r?.asking_price),  // ← exact column name from your view
      revenue: null,
      cashflow: toNum(r?.cashflow),
      ebitda: toNum(r?.ebitda),
      url: r?.url ?? null,
      picked_on: null,
      notes: r?.description ?? null,
    };
  });

  return {
    props: {
      top10,
      kpis: (kpiRows && kpiRows[0]) ? (kpiRows[0] as KPI) : null,
      errorAuto: eAuto?.message || null,
    },
  };
}

export default function Home({ top10, kpis, errorAuto }: { top10: Top10[]; kpis: KPI; errorAuto?: string | null }) {
  return (
    <>
      <Head><title>Cleaning Exits — Top 10 & Index</title></Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-sm">
            ✅ Verified cleaning & related service exits
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">Cleaning Exits</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Find real, actionable cleaning & related service listings. Weekly curated Top 10 + a monthly audited Cleaning Index.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/daily-cleaning" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow hover:bg-emerald-700 transition">
              View Today&apos;s Listings
            </Link>
            <Link href="/cleaning-index" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white shadow hover:bg-slate-800 transition">
              Explore the Index
            </Link>
          </div>
          <div className="mt-3">
            <Link href="/subscribe" className="text-sm text-gray-500 hover:text-gray-700 underline">
              Prefer email? Get the weekly Top 10 →
            </Link>
          </div>
        </header>

        {/* Top 10 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Top 10 This Week</h2>
            <Link href="/top10" className="text-sm text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1">
              See details →
            </Link>
          </div>

          <ol className="space-y-3">
            {(!top10 || top10.length === 0) && (
              <div className="rounded-2xl border p-6 text-gray-600">
                {errorAuto ? (
                  <>Couldn’t load Top 10 (AUTO view). {errorAuto}</>
                ) : (
                  <>No listings to show yet. Check back shortly.</>
                )}
              </div>
            )}

            {top10?.map((d, i) => (
              <li key={i} className="rounded-2xl border p-4 hover:shadow-sm transition">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <a href={d.url ?? "#"} target="_blank" rel="noreferrer" className="text-lg font-semibold hover:underline">
                        {d.header ?? "Untitled"}
                      </a>
                      {(d.city || d.state) && (
                        <span className="text-gray-500">• {d.city ? `${d.city}, ` : ""}{d.state ?? ""}</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                      <span>Price {money(d.price)}</span>
                      {d.cashflow ? <span>Cash flow {money(d.cashflow)}</span> : d.ebitda ? <span>EBITDA {money(d.ebitda as any)}</span> : null}
                      {d.revenue ? <span>Revenue {money(d.revenue)}</span> : null}
                    </div>
                    {d.notes && <p className="mt-2 text-sm text-gray-700">{d.notes}</p>}
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
            {kpis ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {kpis.verified_real.toLocaleString()} real / {kpis.total_listed.toLocaleString()} listed
                </div>
                <div className="text-sm text-gray-600">
                  {kpis.month_label} • {kpis.junk_pct}% junk (duplicates, franchise ads, expired)
                </div>
                <Link href="/cleaning-index" className="inline-block mt-2 text-emerald-700 hover:text-emerald-800 underline">
                  View full report →
                </Link>
              </div>
            ) : (
              <p className="text-gray-600">Monthly market audit. See which listings are real and where to find the originals.</p>
            )}
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
