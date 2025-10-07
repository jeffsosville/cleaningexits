// pages/cleaning-index.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { supabase } from "../lib/supabaseClient";

type Card = {
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
  recently_added?: boolean | null;
  recently_updated?: boolean | null;
};

type Props = {
  listings: Card[];
  hadError: boolean;
  errMsg?: string | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const PAGE_SIZE = 50;

// Money formatting (keeps 0 as $0)
function money(n?: number | null) {
  return n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
}

// Base64URL encoder (SSR-safe)
function toB64Url(u: string) {
  try {
    const b64 =
      typeof window === "undefined"
        ? Buffer.from(u, "utf8").toString("base64")
        : btoa(unescape(encodeURIComponent(u)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } catch {
    return "";
  }
}

// ET helpers for consistent display
function toET(d: Date) {
  return new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
}
function formatETDate(iso?: string | null) {
  if (!iso) return "—";
  const dt = toET(new Date(iso));
  return dt.toLocaleDateString("en-US", { timeZone: "America/New_York" });
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const pageParam = Array.isArray(ctx.query.page)
    ? ctx.query.page[0]
    : ctx.query.page;
  const page = Math.max(1, Number(pageParam || 1)) || 1;

  // Prefer the view if you have it; otherwise you can switch this to 'listings' with your filters
  const q = supabase
    .from("cleaning_listings_cards")
    .select(
      "id, header, city, state, price, cash_flow, revenue, notes, url, image_url, scraped_at, recently_added, recently_updated",
      { count: "exact" }
    )
    .order("scraped_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, error, count } = await q;

  if (error || !data) {
    return {
      props: {
        listings: [],
        hadError: true,
        errMsg: error?.message ?? "Query failed",
        page,
        pageSize: PAGE_SIZE,
        hasMore: false,
      },
    };
  }

  const hasMore = count != null ? page * PAGE_SIZE < count : data.length === PAGE_SIZE;

  return {
    props: {
      listings: data as Card[],
      hadError: false,
      errMsg: null,
      page,
      pageSize: PAGE_SIZE,
      hasMore,
    },
  };
};

export default function CleaningIndex({
  listings,
  hadError,
  errMsg,
  page,
  hasMore,
}: Props) {
  const prevHref = page > 1 ? `/cleaning-index?page=${page - 1}` : null;
  const nextHref = hasMore ? `/cleaning-index?page=${page + 1}` : null;

  return (
    <>
      <Head>
        <title>Cleaning Exits — The Cleaning Index</title>
        <meta
          name="description"
          content="Audited feed of verified cleaning & related service listings. Dedupe, remove franchise funnels, prefer original sources."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            The Cleaning Index
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">
              {listings.length}
            </span>
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Our audited feed of real cleaning & related service listings. We
            dedupe, filter out franchise funnels, and link to original sources.
          </p>
          <div className="mt-3">
            <Link href="/" className="text-emerald-700 hover:text-emerald-800 underline">
              ← Back to Top 10
            </Link>
          </div>
          {hadError && (
            <p className="mt-3 text-sm text-red-600">
              Couldn’t load index from Supabase.{" "}
              {errMsg ?? "Check anon key, RLS policy, and env vars."}
            </p>
          )}
        </header>

        {/* Body */}
        {listings.length === 0 ? (
          <div className="rounded-2xl border p-6 text-gray-600">
            No index cards yet. If you just created the view, give it a moment, then refresh.
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings.map((l, idx) => {
              const cityState =
                l.city && l.state ? `${l.city}, ${l.state}` : l.city ?? l.state ?? "—";
              const href = l.url ? `/listing/${toB64Url(l.url)}?from=index` : "#";
              const badge = l.recently_added ? "New" : l.recently_updated ? "Updated" : "";

              return (
                <article
                  key={`${l.id ?? "row"}-${idx}`}
                  className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex gap-4">
                    <img
                      src={l.image_url ?? "/default-listing.jpg"}
                      alt={l.header ?? ""}
                      className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                    />
                    <div className="flex-1">
                      <Link href={href} className="font-semibold text-lg hover:underline">
                        {l.header ?? "Untitled listing"}
                      </Link>
                      <div className="text-sm text-gray-500">{cityState}</div>
                      <div className="text-sm mt-1 text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Price {money(l.price)}</span>
                        {l.cash_flow != null && <span>Cash Flow {money(l.cash_flow)}</span>}
                        {l.revenue != null && <span>Revenue {money(l.revenue)}</span>}
                      </div>
                    </div>
                  </div>

                  {l.notes && <p className="text-sm text-gray-600 mt-3">{l.notes}</p>}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatETDate(l.scraped_at)}</span>
                    <span>{badge}</span>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {prevHref ? (
              <Link
                href={prevHref}
                className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                ← Previous
              </Link>
            ) : (
              <span className="text-sm text-gray-400">← Previous</span>
            )}
          </div>
          <div className="text-sm text-gray-500">Page {page}</div>
          <div>
            {nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Next →
              </Link>
            ) : (
              <span className="text-sm text-gray-400">Next →</span>
            )}
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Verified — no franchises, no lead-gen. Want the curated list?{" "}
          <Link href="/" className="underline text-emerald-700">
            See this week’s Top 10
          </Link>
          .
        </p>
      </main>
    </>
  );
}
