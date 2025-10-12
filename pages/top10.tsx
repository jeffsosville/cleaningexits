// pages/top10.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Row = {
  id: string;
  title: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  price: number | null;
  cash_flow: number | null;
  revenue: number | null;
  listing_url: string | null;
  description: string | null;
  broker_account: string | null;
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

  let q = supabase
    .from("listings")
    .select("id, title, city, state, location, price, cash_flow, revenue, description, listing_url, broker_account")
    .or(includeOr)
    .gte("scraped_at", days90agoISO)
    .eq("is_active", true);

  for (const x of EXCLUDES) {
    q = q.not("title", "ilike", x);
  }

  const { data, error } = await q
    .order("cash_flow", { ascending: false, nullsFirst: false })
    .order("price", { ascending: false, nullsFirst: false })
    .limit(10);

  const rows = (data ?? []).map((r) => ({
    id: r.id,
    title: r.title ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    location: r.location ?? null,
    price: r.price ?? null,
    cash_flow: r.cash_flow ?? null,
    revenue: r.revenue ?? null,
    listing_url: r.listing_url ?? null,
    description: r.description ?? null,
    broker_account: r.broker_account ?? null,
  }));

  return { 
    props: { 
      rows, 
      hadError: !!error,
      errMsg: error?.message ?? null 
    } 
  };
};

export default function Top10({ 
  rows, 
  hadError,
  errMsg 
}: { 
  rows: Row[]; 
  hadError: boolean;
  errMsg?: string | null;
}) {
  return (
    <>
      <Head>
        <title>Cleaning Exits — Top 10</title>
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Top 10 Cleaning Businesses</h1>
          <p className="text-gray-600">
            Curated cleaning businesses from the past 90 days, ranked by cash flow.
          </p>
          <div className="mt-2">
            <Link href="/" className="underline text-emerald-700">
              ← Back to Home
            </Link>
          </div>
          {hadError && (
            <p className="mt-3 text-sm text-red-600">
              Couldn't load from Supabase. {errMsg ?? "Check env vars & permissions."}
            </p>
          )}
        </header>

        <ol className="space-y-4">
          {rows.map((r, i) => (
            <li key={r.id} className="rounded-2xl border p-4 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <a
                    href={r.listing_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-lg hover:underline"
                  >
                    {r.title ?? "Untitled listing"}
                  </a>
                  <div className="text-sm text-gray-500">
                    {r.city && r.state 
                      ? `${r.city}, ${r.state}`
                      : r.location ?? "—"}
                  </div>
                  <div className="text-sm text-gray-700 mt-1 flex flex-wrap gap-3">
                    <span>Price {money(r.price)}</span>
                    {r.cash_flow && <span>Cash Flow {money(r.cash_flow)}</span>}
                    {r.revenue && <span>Revenue {money(r.revenue)}</span>}
                  </div>
                  {r.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                  {r.broker_account && (
                    <div className="text-xs text-gray-500 mt-1">
                      Broker: {r.broker_account}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {rows.length === 0 && (
          <p className="mt-8 text-center text-gray-500">
            No qualifying listings in the past 90 days.
          </p>
        )}

        <p className="mt-8 text-sm text-gray-500 text-center">
          Want to see all listings?{" "}
          <Link href="/cleaning-index" className="underline text-emerald-700">
            Browse the full index
          </Link>
          .
        </p>
      </main>
    </>
  );
}
