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

function money(n?: number | null) {
  return !n
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
}

// SSR-safe Base64URL encoder
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

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, error } = await supabase
    .from("cleaning_listings_cards")
    .select(
      "id, header, city, state, price, cash_flow, revenue, notes, url, image_url, scraped_at, recently_added, recently_updated"
    )
    .limit(50);

  const listings: Card[] = error || !data ? [] : (data as Card[]);
  return { props: { listings } };
};

export default function CleaningIndex({ listings }: { listings: Card[] }) {
  return (
    <>
      <Head>
        <title>Cleaning Exits — The Cleaning Index</title>
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            The Cleaning Index
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
        </header>

        {/* Empty state */}
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
                        {l.cash_flow && (
                          <span>Cash Flow {money(l.cash_flow)}</span>
                        )}
                        {l.revenue && <span>Revenue {money(l.revenue)}</span>}
                      </div>
                    </div>
                  </div>

                  {l.notes && (
                    <p className="text-sm text-gray-600 mt-3">{l.notes}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {l.scraped_at
                        ? new Date(l.scraped_at).toLocaleDateString()
                        : "—"}
                    </span>
                    <span>
                      {l.recently_added
                        ? "New"
                        : l.recently_updated
                        ? "Updated"
                        : ""}
                    </span>
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
