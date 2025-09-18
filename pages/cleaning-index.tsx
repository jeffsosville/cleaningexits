// pages/cleaning-index.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { supabase } from "../lib/supabaseClient";

type Card = {
  id: number | null;
  title: string | null;
  city_state: string | null;
  asking_price: number | null;
  cash_flow: number | null;
  ebitda: number | null;
  summary: string | null;
  url: string | null;
  image_url: string | null;
  broker: string | null;
  broker_contact: string | null;
  recentlyAdded: boolean | null;
  recentlyUpdated: boolean | null;
};

function fmtMoney(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export const getServerSideProps: GetServerSideProps = async () => {
  // Pull 50 cards from the simplified public view
  const { data, error } = await supabase
    .from("cleaning_listings_cards")
    .select(
      "id, title, city_state, asking_price, cash_flow, ebitda, summary, url, image_url, broker, broker_contact, recentlyAdded, recentlyUpdated"
    )
    .limit(50);

  // Graceful fallback if the view isn't ready yet
  const listings: Card[] =
    error || !data
      ? [
          {
            id: 0,
            title: "Example Cleaning Co. (placeholder)",
            city_state: "Austin, TX",
            asking_price: 425000,
            cash_flow: 152000,
            ebitda: null,
            summary:
              "Residential & light commercial; 120 recurring clients; owner transitioning. (This is a placeholder card until your Supabase view is wired.)",
            url: "#",
            image_url: "/default-listing.jpg",
            broker: "—",
            broker_contact: "—",
            recentlyAdded: true,
            recentlyUpdated: null,
          },
        ]
      : (data as Card[]);

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
            Our audited feed of **real** cleaning & related service listings. We
            dedupe, filter out franchise funnels, and prefer verified sources over
            marketplace noise.
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

        {/* Cards grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings.map((l, idx) => (
            <article
              key={`${l.id ?? "demo"}-${idx}`}
              className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex gap-4">
                <img
                  src={l.image_url ?? "/default-listing.jpg"}
                  alt={l.title ?? ""}
                  className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                />
                <div className="flex-1">
                  <a
                    href={l.url ?? "#"}
                    target={l.url ? "_blank" : "_self"}
                    rel="noreferrer"
                    className="font-semibold text-lg hover:underline"
                  >
                    {l.title ?? "Untitled listing"}
                  </a>
                  <div className="text-sm text-gray-500">{l.city_state ?? "—"}</div>
                  <div className="text-sm mt-1 text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Price {fmtMoney(l.asking_price)}</span>
                    {l.cash_flow && <span>Cash Flow {fmtMoney(l.cash_flow)}</span>}
                    {l.ebitda && <span>EBITDA {fmtMoney(Number(l.ebitda))}</span>}
                  </div>
                </div>
              </div>

              {l.summary && (
                <p className="text-sm text-gray-600 mt-3">{l.summary}</p>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Broker: {l.broker_contact || l.broker || "—"}</span>
                <span>
                  {l.recentlyAdded ? "New" : l.recentlyUpdated ? "Updated" : ""}
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* Footer note */}
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
