// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useState, useCallback } from "react";
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
  price: number | null; // mapped from asking_price
  revenue: number | null;
  cashflow: number | null;
  ebitda: number | null;
  url: string | null;
  picked_on: string | null;
  notes: string | null;
};

type KPI =
  | {
      month_label: string;
      total_listed: number;
      verified_real: number;
      junk_pct: number;
      last_updated: string;
    }
  | null;

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

// Helper to base64-encode the external URL for the gated route
function toB64(u: string) {
  try {
    // Node (SSR)
    // eslint-disable-next-line no-undef
    return Buffer.from(u, "utf8").toString("base64");
  } catch {
    // Browser fallback
    try {
      return btoa(unescape(encodeURIComponent(u)));
    } catch {
      return "";
    }
  }
}

export async function getServerSideProps() {
  // Last 90 days
  const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
  const days90agoISO = new Date(Date.now() - DAYS_90_MS).toISOString();

  // Filters
  const includeOr = "header.ilike.%cleaning%,header.ilike.%janitorial%";
  const EXCLUDES = [
    "%dry%",
    "%insurance%",
    "%franchise%",
    "%restaurant%",
    "%pharmacy%",
    "%convenience%",
    "%grocery%",
    "%bakery%",
  ];

  // Query
  let q = supabase
    .from("daily_listings")
    .select(
      "header, location, price, cashFlow, ebitda, description, externalUrl, img, brokerCompany, brokerContactFullName, scraped_at"
    )
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
  const toNumLocal = (v: any) => {
    if (!v) return null;
    const n = Number(v.toString().replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const top10 = (data ?? []).map((r: any) => {
    // Split "City, ST" into city + state
    let city: string | null = null,
      state: string | null = null;
    if (r.location && r.location.includes(",")) {
      const [c, s] = r.location.split(",").map((s: string) => s.trim());
      city = c || null;
      state = s || null;
    } else {
      state = r.location ?? null;
    }

    return {
      header: r.header ?? null,
      city,
      state,
      price: toNumLocal(r.price),
      revenue: null,
      cashflow: toNumLocal(r.cashFlow),
      ebitda: toNumLocal(r.ebitda),
      url: r.externalUrl ?? null,
      picked_on: null,
      notes: r.description ?? null,
    };
  });

  return {
    props: {
      top10,
      kpis: null as KPI,
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
  // HERO email subscribe state/handler
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleHeroSubscribe = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      setSubmitting(true);
      try {
        const { error } = await supabase
          .from("email_subscriptions")
          .upsert(
            [{ email, source: "hero", created_at: new Date().toISOString() }],
            { onConflict: "email" }
          );
        if (error) throw error;
        setSubscribed(true);
      } catch (err) {
        console.error(err);
        alert("Sorry—couldn’t save your email. Try again?");
      } finally {
        setSubmitting(false);
      }
    },
    [email]
  );

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
            Find real, actionable cleaning & related service listings. Weekly
            curated Top 10 + a monthly audited Cleaning Index.
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

          {/* Big email signup */}
          <div className="mt-8 max-w-xl mx-auto">
            {subscribed ? (
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 text-center">
                ✓ You’re in! We’ll send new cleaning businesses weekly.
              </div>
            ) : (
              <form onSubmit={handleHeroSubscribe} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
            )}
            <p className="text-sm text-gray-500 mt-2 text-center">
              Get new cleaning businesses in your inbox weekly. ✓ No spam ·
              Unsubscribe anytime
            </p>
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

          <ol classNam
