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
};

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

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
  });
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const includeOr = `
    title.ilike.%cleaning%,
    title.ilike.%janitorial%,
    title.ilike.%maid%,
    title.ilike.%carpet%,
    title.ilike.%window%
  `;

  const excludes = [
    "%dry%",
    "%insurance%",
    "%franchise%",
    "%restaurant%",
    "%pharmacy%",
    "%convenience%",
    "%grocery%",
    "%bakery%",
  ];

  let q = supabase
    .from("listings")
    .select(
      "id, title, city, state, price, cash_flow, revenue, description, listing_url, image_url, scraped_at",
      { count: "exact" }
    )
    .or(includeOr);

  for (const x of excludes) {
    q = q.not("title", "ilike", x);
  }

  const { data, error } = await q
    .order("scraped_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return {
      props: {
        listings: [],
        hadError: true,
        errMsg: error?.message ?? "Query failed",
      },
    };
  }

  const listings: Card[] = data.map((r: any) => ({
    id: r.id,
    header: r.title,
    city: r.city,
    state: r.state,
    price: r.price,
    cash_flow: r.cash_flow,
    revenue: r.revenue,
    notes: r.description,
    url: r.listing_url,
    image_url: r.image_url,
    scraped_at: r.scraped_at,
    recently_added: null,
    recently_updated: null,
  }));

  return { props: { listings, hadError: false } };
};

export default function CleaningIndex({ listings, hadError, errMsg }: Props) {
  return (
    <>
      <Head>
        <title>Cleaning Exits — The Cleaning Index</title>
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            The Cleaning Index
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">
              {listings.length}
            </span>
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Our audited feed of real cleaning & related service listings. We
            dedupe, filter out franchise funnels, and prefer verified sources
            over marketplace noise.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="text-emerald-700 hover:text-emerald-800 underline"
            >
              ← Back to Top 10
            </Link>
          </div>
          {hadError && (
            <p className="mt-3 text-sm text-red-600">
              Couldn’t load from Supabase. {errMsg ?? ""}
            </p>
          )}
        </header>

        {listings.length === 0 ? (
          <div className="rounded-2xl border p-6 text-gray-600">
            No index cards yet. If you just created the view, give it a moment,
            then refresh.
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings.map((l, idx) => {
              const cityState =
                l.city && l.state
                  ? `${l.city}, ${l.state}`
                  : l.city ?? l.state ?? "—";
              const href = l.url ? `/listing/${toB64Url(l.url)}?from=index` : "#";

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
                      <Link
                        href={href}
                        className="font-semibold text-lg hover:underline"
                      >
                        {l.header ?? "Untitled listing"}
                      </Link>
                      <div className="text-sm text-gray-500">{cityState}</div>
                      <div className="text-sm mt-1 text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Price {money(l.price)}</span>
                        {l.cash_flow != null && (
                          <span>Cash Flow {money(l.cash_flow)}</span>
                        )}
                        {l.revenue != null && (
                          <span>Revenue {money(l.revenue)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {l.notes && (
                    <p className="text-sm text-gray-600 mt-3">{l.notes}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(l.scraped_at)}</span>
                  </div>
                </article>
              );
            })}
          </section>
        )}

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
