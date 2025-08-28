// pages/cleaning-index.tsx
import { GetServerSideProps } from "next";

type Listing = {
  header: string | null;
  city: string | null;
  state: string | null;
  price: number | string | null;
  revenue: number | string | null;
  cashflow: number | string | null;
  broker_name: string | null;
  source_url: string | null;
  pulled_at: string | null;
};

type Props = {
  listings: Listing[];
  error?: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  try {
    const host = req.headers.host as string;
    const origin =
      process.env.NODE_ENV === "production" ? `https://${host}` : `http://${host}`;

    const resp = await fetch(
      `${origin}/api/listings?view=cleaning_filtered&order=pulled_at.desc&limit=200`,
      { cache: "no-store" }
    );
    const json = await resp.json();

    if (!resp.ok) {
      return {
        props: { listings: [], error: json?.error || `HTTP ${resp.status}` },
      };
    }

    return { props: { listings: (json?.data ?? []) as Listing[] } };
  } catch (e: any) {
    return { props: { listings: [], error: e?.message || String(e) } };
  }
};

export default function CleaningIndex({ listings, error }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-5xl font-black mb-2">🧼 The Cleaning Index</h1>
      <p className="mb-6 text-gray-700">
        The curated, simplified view of cleaning & related service listings.
      </p>

      {error && <p className="text-red-600 text-xl">Error: {error}</p>}
      {!error && listings.length === 0 && (
        <p className="text-gray-500">No listings available.</p>
      )}

      <ul className="space-y-6">
        {listings
          .filter((l) => l.header)
          .map((l, idx) => (
            <li
              key={`${l.source_url ?? "x"}-${l.header ?? "h"}-${idx}`}
              className="border rounded-xl p-5 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{l.header}</h2>
              <p className="text-gray-600">
                {[l.city, l.state].filter(Boolean).join(", ") || "Unknown location"}
              </p>

              <div className="mt-2 space-y-1 text-sm">
                {n(l.price) !== null && <p>💰 Asking Price: {fmt(n(l.price))}</p>}
                {n(l.revenue) !== null && <p>📦 Revenue: {fmt(n(l.revenue))}</p>}
                {n(l.cashflow) !== null && n(l.cashflow)! > 0 && (
                  <p>💵 Cash Flow: {fmt(n(l.cashflow))}</p>
                )}
              </div>

              <div className="mt-3 text-sm text-gray-700 flex flex-wrap gap-3">
                {l.broker_name && <span>🤝 {l.broker_name}</span>}
                {l.source_url && (
                  <a
                    href={l.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    original
                  </a>
                )}
                {l.pulled_at && (
                  <span>🗓️ {new Date(l.pulled_at).toLocaleDateString()}</span>
                )}
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

function n(v: any): number | null {
  if (v === null || v === undefined) return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
}
function fmt(num: number | null) {
  if (num === null) return "—";
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
