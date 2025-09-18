// pages/top10.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { supabase } from "../lib/supabaseClient";

type Row = {
  id: number | null;
  title: string | null;
  location: string | null;
  region: string | null;
  price: number | null;
  cashflow: number | null;
  ebitda: number | null;
  broker: string | null;
  url: string | null;
  description: string | null;
};

const $ = (n?: number | null) =>
  !n ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, error } = await supabase
    .from("cleaning_top10_auto")
    .select("id, title, location, region, price, cashflow, ebitda, broker, url, description");

  return { props: { rows: (data ?? []) as Row[], hadError: !!error } };
};

export default function Top10({ rows, hadError }: { rows: Row[]; hadError: boolean }) {
  return (
    <>
      <Head><title>Cleaning Exits — Auto Top 10</title></Head>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Top 10</h1>
          <p className="text-gray-600">Highest-priced listings with cash flow or EBITDA and a listed broker.</p>
          <div className="mt-2">
            <Link href="/" className="underline text-emerald-700">← Back to Home</Link>
          </div>
          {hadError && (
            <p className="mt-3 text-sm text-red-600">Couldn’t load from Supabase. Check env vars & grants.</p>
          )}
        </header>

        <ol className="space-y-4">
          {rows.map((r, i) => (
            <li key={r.id ?? i} className="rounded-2xl border p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">{i + 1}</div>
                <div className="flex-1">
                  <a href={r.url ?? "#"} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                    {r.title ?? "Untitled listing"}
                  </a>
                  <div className="text-sm text-gray-500">{r.location || r.region || "—"}</div>
                  <div className="text-sm text-gray-700 mt-1 flex flex-wrap gap-3">
                    <span>Price {$((r.price as any) as number)}</span>
                    {r.cashflow ? <span>Cash Flow {$((r.cashflow as any) as number)}</span> : null}
                    {r.ebitda ? <span>EBITDA {$((r.ebitda as any) as number)}</span> : null}
                    <span>Broker: {r.broker ?? "—"}</span>
                  </div>
                  {r.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{r.description}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {rows.length === 0 && (
          <p className="mt-8 text-center text-gray-500">No qualifying listings yet.</p>
        )}

        <p className="mt-8 text-sm text-gray-500 text-center">
          Want hand-picked deals? <Link href="/" className="underline text-emerald-700">See the curated Top 10</Link>.
        </p>
      </main>
    </>
  );
}
