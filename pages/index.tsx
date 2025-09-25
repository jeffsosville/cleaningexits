// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Supabase client (server-side; anon key okay if RLS grants SELECT on the view)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Top10 = {
  header: string | null;
  city: string | null;
  state: string | null;
  price: number | null;     // mapped from asking_price
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
} | null;

const money = (n?: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

function toNum(v: any): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getServerSideProps() {
  // Last 90 days
  const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
  const days90agoISO = new Date(Date.now() - DAYS_90_MS).toISOString();

  // Filters
  const includeOr = "header.ilike.%cleaning%,header.ilike.%janitorial%";
  const EXCLUDES = [
    "%dry%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%",
    "%convenience%", "%grocery%", "%bakery%"
  ];

  // Query
  let q = supabase
    .from("daily_listings")
    .select("header, location, price, cashFlow, ebitda, description, externalUrl, img, brokerCompany, brokerContactFullName, scraped_at")
    .or(includeOr)
    .gte("scraped_at", days90agoISO);

  for (const x of EXCLUDES) q = q.not("header", "ilike", x);

  const { data, error } = await q
    .order("cashFlow", { ascending: false, nullsFirst: false })
    .order("ebitda", { ascending: false, nullsFirst: false })
    .order("price", { ascending: false, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .limit(10);

  // Map into your Top10 type
  const toNum = (v: any) => {
    if (!v) return null;
    const n = Number(v.toString().replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const top10 = (data ?? []).map((r: any) => {
    // Split "City, ST" into city + state
    let city: string | null = null, state: string | null = null;
    if (r.location && r.location.includes(",")) {
      const [c, s] = r.location.split(",").map((s: string) => s.trim());
      city = c || null; state = s || null;
    } else {
      state = r.location ?? null;
    }

    return {
      header: r.header ?? null,
      city,
      state,
      price: toNum(r.price),
      revenue: null,
      cashflow: toNum(r.cashFlow),
      ebitda: toNum(r.ebitda),
      url: r.externalUrl ?? null,
      picked_on: null,
      notes: r.description ?? null,
    };
  });

  return {
    props: {
      top10,
      kpis: null,
      errorAuto: error?.message || null,
    },
  };
}





export default function Home({
  top10,
  kpis,
  errorAuto,
}: {
  top10: Top10[];
  kpis: KPI;
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
                {errorAuto ? (
                  <>Couldn’t load Top 10 (AUTO view). {errorAuto}</>
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
                        href={d.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg font-semibold hover:underline"
                      >
                        {d.header ?? "Untitled"}
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
                      {d.cashflow ? (
                        <span>Cash flow {money(d.cashflow)}</span>
                      ) : d.ebitda ? (
                        <span>EBITDA {money(d.ebitda as any)}</span>
                      ) : null}
                      {d.revenue ? (
                        <span>Revenue {money(d.revenue)}</span>
                      ) : null}
                    </div>
                    {d.notes && (
                      <p className="mt-2 text-sm text-gray-700">{d.notes}</p>
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
            {kpis ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {kpis.verified_real.toLocaleString()} real /{" "}
                  {kpis.total_listed.toLocaleString()} listed
                </div>
                <div className="text-sm text-gray-600">
                  {kpis.month_label} • {kpis.junk_pct}% junk (duplicates,
                  franchise ads, expired)
                </div>
                <Link
                  href="/cleaning-index"
                  className="inline-block mt-2 text-emerald-700 hover:text-emerald-800 underline"
                >
                  View full report →
                </Link>
              </div>
            ) : (
              <p className="text-gray-600">
                Monthly market audit. See which listings are real and where to
                find the originals.
              </p>
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
