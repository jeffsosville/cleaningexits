// pages/cleaning-index.tsx
import { GetServerSideProps } from "next";

type AnyRow = Record<string, any>;

type Props = {
  listings: AnyRow[];
  error?: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  try {
    const host = req.headers.host as string;
    const origin =
      process.env.NODE_ENV === "production" ? `https://${host}` : `http://${host}`;

    // No order by default (it can fail if the column doesn't exist).
    // You can pass ?order=pulled_at.desc in the URL later if your view supports it.
    const resp = await fetch(
      `${origin}/api/listings?view=cleaning_filtered&limit=200`,
      { cache: "no-store" }
    );
    const json = await resp.json();

    if (!resp.ok) {
      return { props: { listings: [], error: json?.error || `HTTP ${resp.status}` } };
    }

    return { props: { listings: (json?.data ?? []) as AnyRow[] } };
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
          .filter((l) => truthy(get(l, ["header", "title", "name"])))
          .map((l, idx) => {
            const header =
              firstVal(l, ["header", "title", "name"]) ?? "Untitled listing";
            const location =
              buildLocation(l) || "Unknown location";

            const price = firstNum(l, ["price", "asking_price", "listprice", "amount"]);
            const revenue = firstNum(l, ["revenue", "sales", "gross_revenue"]);
            const cashflow = firstNum(l, ["cashflow", "cash_flow", "sde", "seller_discretionary_earnings"]);
            const broker = firstVal(l, ["broker_name", "broker", "agent", "company_name"]);
            const source = firstVal(l, ["source_url", "url", "link"]);
            const pulledAt = firstDate(l, ["pulled_at", "created_at", "updated_at"]);

            return (
              <li
                key={`${source ?? "x"}-${header}-${idx}`}
                className="border rounded-xl p-5 shadow-sm"
              >
                <h2 className="text-xl font-semibold">{header}</h2>
                <p className="text-gray-600">{location}</p>

                <div className="mt-2 space-y-1 text-sm">
                  {price !== null && <p>💰 Asking Price: {fmt(price)}</p>}
                  {revenue !== null && <p>📦 Revenue: {fmt(revenue)}</p>}
                  {cashflow !== null && cashflow > 0 && (
                    <p>💵 Cash Flow: {fmt(cashflow)}</p>
                  )}
                </div>

                <div className="mt-3 text-sm text-gray-700 flex flex-wrap gap-3">
                  {broker && <span>🤝 {broker}</span>}
                  {source && (
                    <a
                      href={source}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      original
                    </a>
                  )}
                  {pulledAt && (
                    <span>🗓️ {new Date(pulledAt).toLocaleDateString()}</span>
                  )}
                </div>

                {truthy(get(l, ["description", "summary", "notes"])) && (
                  <p className="mt-3 text-sm text-gray-700">
                    {firstVal(l, ["description", "summary", "notes"])}
                  </p>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

/* ---------- helpers (schema-agnostic) ---------- */

function get(obj: any, keys: string[]) {
  for (const k of keys) if (k in obj && obj[k] != null) return obj[k];
  return null;
}
function truthy(v: any) {
  return !(v === null || v === undefined || v === "" || (typeof v === "number" && !Number.isFinite(v)));
}
function firstVal(obj: any, keys: string[]) {
  const v = get(obj, keys);
  return typeof v === "string" ? v : (typeof v === "number" ? String(v) : v);
}
function firstNum(obj: any, keys: string[]): number | null {
  const v = get(obj, keys);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function firstDate(obj: any, keys: string[]): string | null {
  const v = get(obj, keys);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
function fmt(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function buildLocation(row: AnyRow): string {
  // Prefer city, state if present
  const city = firstVal(row, ["city", "town"]);
  const state = firstVal(row, ["state", "region_code", "state_code"]);
  const combo = [city, state].filter(Boolean).join(", ");
  if (combo) return combo;

  // Fallbacks
  return (
    firstVal(row, ["location"]) ||
    [firstVal(row, ["region"]), firstVal(row, ["country_code", "country"])].filter(Boolean).join(", ") ||
    ""
  );
}
