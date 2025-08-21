import { GetServerSideProps } from "next";

type Listing = {
  listNumber: number;
  header: string | null;
  location: string | null;
  price: number | null;
  cashFlow: number | string | null;
  ebitda: number | string | null;
  description: string | null;
  brokerContactFullName: string | null;
  brokerCompany: string | null;
  externalUrl: string | null;
};

type Props = {
  listings: Listing[];
  error?: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  try {
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://${req.headers.host}`;

    const r = await fetch(`${baseUrl}/api/listings`, { cache: "no-store" });
    const json = await r.json();

    if (!r.ok) {
      return { props: { listings: [], error: json?.error || `HTTP ${r.status}` } };
    }

    return { props: { listings: (json?.data ?? []) as Listing[] } };
  } catch (e: any) {
    return { props: { listings: [], error: e?.message || String(e) } };
  }
};

export default function DailyCleaning({ listings, error }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-5xl font-black mb-6">🧽 Daily Verified Cleaning Listings</h1>

      {error && <p className="text-red-600 text-xl">Error: {error}</p>}
      {!error && listings.length === 0 && (
        <p className="text-gray-500">No listings yet.</p>
      )}

      <ul className="space-y-6">
        {listings.map((l) => (
          <li key={l.listNumber} className="border rounded-xl p-5 shadow-sm">
            <h2 className="text-xl font-semibold">
              {l.externalUrl ? (
                <a
                  href={l.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {l.header ?? "Untitled Listing"}
                </a>
              ) : (
                l.header ?? "Untitled Listing"
              )}
            </h2>

            <p className="text-gray-600">{l.location ?? "Unknown location"}</p>

            <div className="mt-2 space-y-1 text-sm">
              {l.price != null && <p>💰 Asking Price: ${Number(l.price).toLocaleString()}</p>}
              {l.cashFlow && !Number.isNaN(Number(l.cashFlow)) && (
                <p>💵 Cash Flow: ${Number(l.cashFlow).toLocaleString()}</p>
              )}
              {l.ebitda && !Number.isNaN(Number(l.ebitda)) && (
                <p>📈 EBITDA: ${Number(l.ebitda).toLocaleString()}</p>
              )}
            </div>

            {(l.brokerContactFullName || l.brokerCompany) && (
              <p className="mt-3 text-sm text-gray-700">
                Broker:{" "}
                <strong>
                  {l.brokerContactFullName ?? "Unknown"}
                  {l.brokerCompany ? ` (${l.brokerCompany})` : ""}
                </strong>
              </p>
            )}

            {l.description && <p className="mt-3 text-sm text-gray-700">{l.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
