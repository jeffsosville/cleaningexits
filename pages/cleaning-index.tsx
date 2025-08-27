import { GetServerSideProps } from "next";

type Listing = {
  listnumber: string | null;
  header: string | null;
  location: string | null;
  price: string | null;
  cashflow: string | null;
  ebitda: string | null;
  description: string | null;
};

type Props = {
  listings: Listing[];
  error?: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  try {
    const host = req.headers.host as string;
    const origin =
      process.env.NODE_ENV === "production"
        ? `https://${host}`
        : `http://${host}`;

    const resp = await fetch(
      `${origin}/api/listings?view=cleaning_exits_with_financials`,
      { cache: "no-store" }
    );
    const json = await resp.json();

    if (!resp.ok) {
      return { props: { listings: [], error: json?.error || `HTTP ${resp.status}` } };
    }

    const data = (json?.data ?? []) as Listing[];
    return { props: { listings: data } };
  } catch (e: any) {
    return { props: { listings: [], error: e?.message || String(e) } };
  }
};

export default function CleaningIndex({ listings, error }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-5xl font-black mb-6">🧼 The Cleaning Index</h1>
      <p className="mb-6 text-gray-700">
        The curated, simplified view of cleaning & related service listings.
      </p>

      {error && <p className="text-red-600 text-xl">Error: {error}</p>}
      {!error && listings.length === 0 && (
        <p className="text-gray-500">No listings available.</p>
      )}

      <ul className="space-y-6">
        {listings
          .filter((l) => l.header) // hide null headers
          .map((l, idx) => (
            <li
              key={`${l.listnumber ?? idx}-${l.header}`}
              className="border rounded-xl p-5 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{l.header}</h2>
              <p className="text-gray-600">{l.location ?? "Unknown location"}</p>

              <div className="mt-2 space-y-1 text-sm">
                {l.price && !Number.isNaN(Number(l.price)) && (
                  <p>💰 Asking Price: ${Number(l.price).toLocaleString()}</p>
                )}
                {l.cashflow &&
                  !Number.isNaN(Number(l.cashflow)) &&
                  Number(l.cashflow) > 0 && (
                    <p>💵 Cash Flow: ${Number(l.cashflow).toLocaleString()}</p>
                  )}
                {l.ebitda &&
                  !Number.isNaN(Number(l.ebitda)) &&
                  Number(l.ebitda) > 0 && (
                    <p>📈 EBITDA: ${Number(l.ebitda).toLocaleString()}</p>
                  )}
              </div>

              {l.description && (
                <p className="mt-3 text-sm text-gray-700">{l.description}</p>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
