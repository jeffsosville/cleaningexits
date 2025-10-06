// pages/daily-cleaning.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { supabase } from "../lib/supabaseClient";

type Row = {
  id: string | null;
  header: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  cash_flow: number | null;
  revenue: number | null;
  notes: string | null;
  url: string | null;
  image_url: string | null;
  scraped_at: string | null;
};

type Props = {
  rows: Row[];
  hadError: boolean;
  errMsg?: string | null;
};

const money = (n?: number | null) =>
  !n
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

// ---------- Time helpers (America/New_York) ----------
function toET(d: Date) {
  return new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, error } = await supabase
    .from("daily_listings_today")
    .select(
      "id, header, city, state, price, cash_flow, revenue, notes, url, image_url, scraped_at"
    )
    .order("scraped_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return {
      props: {
        rows: [],
        hadError: true,
        errMsg: error?.message ?? "Query failed",
      },
    };
  }

  return { props: { rows: data, hadError: false, errMsg: null } };
};

export default function DailyCleaning({ rows, hadError, errMsg }: Props) {
  const todayET = toET(new Date()).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
  });

  return (
    <>
      <Head>
        <title>Cleaning Exits — Today’s Listings</title>
        <meta
          name="description"
          content="Fresh, verified cleaning business listings added today. No franchises, no lead-gen noise."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Today’s Listings
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">
              {rows.length}
            </span>
          </h1>
          <p className="text-gray-600">
            Fresh additions for <strong>{todayET}</strong>. Strict cleaning-only filters applied.
          </p>
          <div className="mt-2">
            <Link href="/" className="underline text-emerald-700">
              ← Back to Home
            </Link>
          </div>
          {hadError && (
            <p className="mt-3 text-sm text-red-600">
              Couldn’t load from Supabase. {errMsg ?? "Check anon key, RLS policy, and env vars."}
            </p>
          )}
        </header>

        {/* Body */}
        {rows.length === 0 ? (
          <p className="text-gray-600">
            No new cleaning listings yet today. Try again later — or check the{" "}
            <Link href="/cleaning-index" className="underline text-emerald-700">
              Cleaning Index
            </Link>{" "}
            for recent deals.
          </p>
        ) : (
          <ul className="space-y-4">
            {rows.map((l) => (
              <li
                key={l.url ?? l.id ?? Math.random()}
                className="rounded-2xl border p-4 hover:shadow-sm transition"
              >
                <div className="flex gap-4">
                  <img
                    src={l.image_url ?? "/default-listing.jpg"}
                    alt={l.header ?? ""}
                    className="w-24 h-24 rounded-lg object-cover bg-gray-100"
                  />
                  <div className="flex-1">
                    <Link
                      href={l.url ? `/listing/${encodeURIComponent(btoa(l.url))}` : "#"}
                      className="font-semibold text-lg hover:underline"
                    >
                      {l.header ?? "Untitled listing"}
                    </Link>
                    <div className="text-sm text-gray-500">
                      {l.city && l.state ? `${l.city}, ${l.state}` : l.city ?? l.state ?? "—"}
                    </div>
                    <div className="text-sm mt-1 text-gray-700 flex flex-wrap gap-3">
                      <span>Price {money(l.price)}</span>
                      {l.cash_flow ? <span>Cash Flow {money(l.cash_flow)}</span> : null}
                      {l.revenue ? <span>Revenue {money(l.revenue)}</span> : null}
                      <span className="text-gray-500">
                        Added{" "}
                        {l.scraped_at
                          ? toET(new Date(l.scraped_at)).toLocaleTimeString("en-US", {
                              timeZone: "America/New_York",
                            })
                          : ""}
                      </span>
                    </div>
                    {l.notes && <p className="text-sm text-gray-600 mt-2">{l.notes}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
