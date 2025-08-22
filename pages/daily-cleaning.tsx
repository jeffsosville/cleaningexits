// pages/daily-cleaning.tsx
import { GetServerSideProps } from "next";

type Listing = {
  listnumber: number | null;
  header: string | null;
  location: string | null;
  price: number | null;
  cashflow: number | string | null;
  ebitda: number | string | null;
  description: string | null;
  broker_contact_fullname: string | null;
  broker_company: string | null;
  externalurl: string | null;
  listings_url: string | null;
  best_url: string | null;
};

type Props = { listings: Listing[]; error?: string | null };

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  try {
    const host = req.headers.host as string;
    const origin =
      process.env.NODE_ENV === "production" ? `https://${host}` : `http://${host}`;
    const r = await fetch(`${origin}/api/listings`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) return { props: { listings: [], error: j?.error || `HTTP ${r.status}` } };
    return { props: { listings: (j?.data ?? []) as Listing[] } };
  } catch (e: any) {
    return { props: { listings: [], error: e?.message || String(e) } };
  }
};

export default function DailyCleaning({ listings, error }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-6">🧽 Daily Verified Cleaning Listings</h1>

      {error && <p className="text-red-600">Error: {error}</p>}
      {!error && listings.length === 0 && <p className="text-gray-500">No listings yet.</p>}

      <ul className="space-y-6">
        {listings.map((l, idx) => {
          const key = `${l.listnumber ?? idx}-${l.header ?? ""}`;
          const href = l.best_url ?? undefined;
          const badge = l.externalurl ? "Direct" : l.listings_url ? "Broker Page" : "Search";

          return (
            <li key={key} className="border rounded-xl p-5 shadow-sm">
              <h2 className="text-xl font-semibold">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {l.header ?? "Untitled Listing"}
                  </a>
                ) : (
                  l.header ?? "Untitled Listing"
                )}
                <span className="ml-2 text-xs rounded bg-gray-100 px-2 py-0.5">{badge}</span>
              </h2>

              <p className="text-gray-600">
                {l.location ?? "Unknown location"}
                {l.price != null && (
                  <span className="ml-2 font-semibold">
                    • ${Number(l.price).toLocaleString()}
                  </span>
                )}
              </p>

              <div className="mt-2 space-y-1 text-sm">
                {l.cashflow && !Number.isNaN(Number(l.cashflow)) && (
                  <p>💵 Cash Flow: ${Number(l.cashflow).toLocaleString()}</p>
                )}
                {l.ebitda && !Number.isNaN(Number(l.ebitda)) && (
                  <p>📈 EBITDA: ${Number(l.ebitda).toLocaleString()}</p>
                )}
              </div>

              {(l.broker_contact_fullname || l.broker_company) && (
                <p className="mt-3 text-sm text-gray-700">
                  Broker:{" "}
                  <strong>
                    {l.broker_contact_fullname ?? "Unknown"}
                    {l.broker_company ? ` (${l.broker_company})` : ""}
                  </strong>
                </p>
              )}

              {l.description && (
                <p className="mt-3 text-sm text-gray-700">{l.description}</p>
              )}

              <div className="mt-2 text-xs text-gray-500 space-x-3">
                {l.externalurl && (
                  <a href={l.externalurl} target="_blank" rel="noopener noreferrer">
                    Direct
                  </a>
                )}
                {l.listings_url && (
                  <a href={l.listings_url} target="_blank" rel="noopener noreferrer">
                    Broker Page
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
