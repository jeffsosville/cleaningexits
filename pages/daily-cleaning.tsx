// pages/daily-cleaning.tsx
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
  ingested_at: string | null;
};

const $ = (n?: number | null) =>
  !n ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, error } = await supabase
    .from("cleaning_listings_today")
    .select(
      "id, title, city_state, asking_price, cash_flow, ebitda, summary, url, image_url, broker, broker_contact, ingested_at"
    );

  return { props: { rows: (data ?? []) as Card[], hadError: !!error } };
};

export default function DailyCleaning({ rows, hadError }: { rows: Card[]; hadError: boolean }) {
  const today = new Date().toLocaleDateString();
  return (
    <>
      <Head><title>Cleaning Exits — Today’s Listings</title></Head>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Today’s Listings</h1>
          <p className="text-gray-600">Fresh additions from {today}. Verified filters applied.</p>
          <div className="mt-2">
            <Link href="/" className="underline text-emerald-700">← Back to Home</Link>
          </div>
          {hadError && <p className="mt-3 text-sm text-red-600">Couldn’t load from Supabase. Check grants/RLS.</p>}
        </header>

        {rows.length === 0 ? (
          <p className="text-gray-600">No new listings yet today. Check back later.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((l) => (
              <li key={l.id ?? Math.random()} className="rounded-2xl border p-4 hover:shadow-sm transition">
                <div className="flex gap-4">
                  <img src={l.image_url ?? "/default-listing.jpg"} alt={l.title ?? ""} className="w-24 h-24 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1">
                    <a href={l.url ?? "#"} target={l.url ? "_blank" : "_self"} rel="noreferrer" className="font-semibold text-lg hover:underline">
                      {l.title ?? "Untitled listing"}
                    </a>
                    <div className="text-sm text-gray-500">{l.city_state ?? "—"}</div>
                    <div className="text-sm mt-1 text-gray-700 flex flex-wrap gap-3">
                      <span>Price {$(l.asking_price)}</span>
                      {l.cash_flow && <span>Cash Flow {$(l.cash_flow)}</span>}
                      {l.ebitda && <span>EBITDA {$(Number(l.ebitda))}</span>}
                      <span className="text-gray-500">Added {l.ingested_at ? new Date(l.ingested_at).toLocaleTimeString() : ""}</span>
                    </div>
                    {l.summary && <p className="text-sm text-gray-600 mt-2">{l.summary}</p>}
                    <div className="text-xs text-gray-500 mt-2">Broker: {l.broker_contact || l.broker || "—"}</div>
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
