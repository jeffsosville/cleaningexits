import { GetServerSideProps } from "next";

type Listing = {
  listNumber: number;
  header: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  cashFlow: number | string | null;
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
      process.env.NODE_ENV === "production" ? `https://${host}` : `http://${host}`;

    const resp = await fetch(`${origin}/api/listings`, { cache: "no-store" });
    const text = await resp.text();

    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      const snippet = text.trim().slice(0, 120);
      return { props: { listings: [], error: `HTTP ${resp.status} ${resp.statusText} — ${snippet}` } };
    }

    if (!resp.ok) {
      return { props: { listings: [], error: json?.error || `HTTP ${resp.status}` } };
    }

    const data = (json?.data ?? []) as Listing[];
    return { props: { listings: data } };
  } catch (e: any) {
    return { props: { listings: [], error: e?.message || String(e) } };
  }
};

export default function DailyCleaning({ listings, error }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-5xl font-black mb-6">🧽 Daily Verified Cleaning Listings</h1>

      {error && <p className="text-red-600 text-xl">Error: {error}</p>}
      {!error && listings.length === 0 && <p className="text-gray-500">No listings yet.</p>}

      <ul className="space-y-6">
        {listings.map((l) => (
          <li
            key={`${l.listNumber}-${l.header ?? ""}-${l.city ?? ""}-${l.state ?? ""}`}
            className="border rounded-xl p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold">
              {l.header ?? "Untitled Listing"}
            </h2>

            <p className="text-gray-600">
              {l.city ?? "Unknown city"}, {l.state ?? "Unknown state"}
            </p>

            <div className="mt-2 space-y-1 text-sm">
              {l.price != null && (
                <p>💰 Asking Price: ${Number(l.price).toLocaleString()}</p>
              )}
              {l.cashFlow && !Number.isNaN(Number(l.cashFlow)) && (
                <p>💵 Cash Flow: ${Number(l.cashFlow).toLocaleString()}</p>
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
