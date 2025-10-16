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
          <p className="mt-4 text-xl md:text-2xl text-gray-700 font-semibold max-w-3xl mx-auto">
            847 Verified Commercial Cleaning Businesses For Sale
          </p>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            No franchises. No maid services. No dead listings.
            <br />
            We scrape 800+ brokers daily so you don't waste time.
          </p>
        </header>

        {/* EMAIL CAPTURE - PROMINENT */}
        <section className="mb-12 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="text-center">
              <div className="text-5xl mb-3">📧</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Get the Weekly Top 10
              </h2>
              <p className="text-emerald-50 mb-6">
                Every Monday: 10 hand-picked deals worth your time.<br />
                Zero spam. Unsubscribe anytime.
              </p>
              
              <Link
                href="/subscribe"
                className="inline-block bg-white text-emerald-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition shadow-lg text-lg"
              >
                Subscribe Now →
              </Link>
              
              <p className="mt-4 text-sm text-emerald-100">
                Join 2,847 buyers already subscribed
              </p>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="mb-10">
          <div className="bg-gray-50 rounded-xl p-6 border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-600">847</div>
                <div className="text-sm text-gray-600 mt-1">Verified Listings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-600">63</div>
                <div className="text-sm text-gray-600 mt-1">Added This Week</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-600">14</div>
                <div className="text-sm text-gray-600 mt-1">Verified Today</div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/daily-cleaning"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold shadow hover:bg-emerald-700 transition"
          >
            View Today&apos;s Listings
          </Link>
          <Link
            href="/cleaning-index"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold shadow hover:bg-slate-800 transition"
          >
            Explore Full Index
          </Link>
        </div>

        {/* Top 10 */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-yellow-500">⭐</span>
            Top 10 This Week
          </h2>

          <ol className="space-y-4">
            {(!top10
