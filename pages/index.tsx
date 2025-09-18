// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

/** Read-only client for server-side data fetching */
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
  junk_pct: number;      // e.g. 88
  last_updated: string;  // ISO
};

function fmtMoney(n?: number | null) {
  if (n == null) return "—";
  try {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  } catch {
    return `$${n}`;
  }
}

export async function getServerSideProps() {
  const [{ data: top10, error: e1 }, { data: kpiRows, error: e2 }] =
    await Promise.all([
      supabase
        .from("cleaning_top10_featured")
        .select(
          "header, city, state, price, revenue, cashflow, ebitda, url, picked_on, notes"
        )
        .order("picked_on", { ascending: false })
        .limit(10),
      supabase
        .from("cleaning_index_kpis_v1")
        .select("month_label, total_listed, verified_real, junk_pct, last_updated")
        .order("last_updated", { ascending: false })
        .limit(1),
    ]);

  return {
    props: {
      top10: top10 ?? [],
      kpis: (kpiRows && kpiRows[0]) ?? null,
      err: (e1?.message || e2?.message) ?? null,
    },
  };
}

export default function Home({
  top10,
  kpis,
}: {
  top10: Top10[];
  kpis: KPI | null;
}) {
  return (
    <>
      <Head>
        <title>Cleaning Exits — Top 10 & Cleaning Index</title>
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-sm">
            ✅ Verified cleaning & related service exits
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            Cleaning Exits
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Find real, actionable cleaning & related service listings. Weekly curated
            Top 10 + a monthly audited Cleaning Index.
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

        {/* Two-column: Top 10 + Index teaser */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Top 10 leaderboard */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Top 10 This Week</h2>
              <Link
                href="/top10"
                className="text-sm text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                See details →
              </Link>
            </div>

            <ol className="space-y-3">
              {(!top10 || top10.length === 0) && (
                <div className="rounded-2xl border p-6 text-gray-600">
                  No featured listings yet. Check back shortly.
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
                          href={d.url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-lg font-semibold hover:underline"
                        >
                          {d.header}
                        </a>
                        <span className="text-gray-500">
                          • {d.city}, {d.state}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                        <span>Price {fmtMoney(d.price)}</span>
                        {d.cashflow ? (
                          <span>Cash flow {fmtMoney(d.cashflow)}</span>
                        ) : d.ebitda ? (
                          <span>EBITDA {fmtMoney(d.ebitda)}</span>
                        ) : null}
                        {d.revenue ? <span>Revenue {fmtMoney(d.revenue)}</span> : null}
                      </div>
                      {d.notes && (
                        <p className="mt-2 text-sm text-gray-700">{d.notes}</p>
                      )}
                    </div>
                    <div className="hidden sm:block text-right text-xs text-gray-500">
                      <div>
                        Picked{" "}
                        {d.picked_on
                          ? new Date(d.picked_on as any).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 text-sm text-gray-500">
              Updated weekly. Verified — no franchises, no lead-gen.
            </div>
          </div>

          {/* Right: Index teaser */}
          <aside>
            <div className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">The Cleaning Index</span>
              </div>

              {kpis ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {kpis.verified_real.toLocaleString()} real /{" "}
                    {kpis.total_listed.toLocaleString()} listed
                  </div>
                  <div className="text-sm text-gray-600">
                    {kpis.month_label} • {kpis.junk_pct}% junk (duplicates, franchise
                    ads, expired)
                  </div>
                  <Link
                    href="/cleaning-index"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 mt-2"
                  >
                    View full report →
                  </Link>
                </div>
              ) : (
                <p className="text-gray-600">
                  Monthly market audit. See which listings are real, which have
                  financials, and where to find the originals.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-2xl border p-5">
              <h4 className="font-semibold mb-1">Why trust this?</h4>
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Verified sources over marketplace noise</li>
                <li>Deduped & filtered (no franchise funnels)</li>
                <li>Human-curated Top 10 each week</li>
              </ul>
            </div>
          </aside>
        </section>

        <footer className="mt-16 text-center text-sm text-gray-500">
          Built for speed and signal. No fluff.
        </footer>
      </main>
    </>
  );
}
