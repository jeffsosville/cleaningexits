import { GetServerSideProps } from "next";

type Listing = {
  listNumber: number;
  header: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  cashFlow: number | null;
  description: string | null;
};

function normalizeRow(row: any): Listing {
  const header = (row?.header ?? null) as string | null;

  let city: string | null = row?.city ?? null;
  let state: string | null = row?.state ?? null;
  if ((!city || !state) && typeof row?.location === "string") {
    const m = row.location.match(/^([^,]+)\s*,\s*([A-Za-z.\s-]{2,})\s*$/);
    if (m) {
      city = city ?? m[1];
      state = state ?? m[2];
    }
  }

  const listNumber = Number(row?.listNumber ?? row?.listnumber ?? 0) || 0;
  const price = row?.price != null ? Number(row.price) : null;
  const cashFlow =
    row?.cashFlow != null
      ? Number(row.cashFlow)
      : row?.cashflow != null
      ? Number(row.cashflow)
      : null;

  const description =
    typeof row?.description === "string" ? row.description : null;

  return { listNumber, header, city, state, price, cashFlow, description };
}

type Props = {
  listings: Listing[];
  hiddenCount: number;
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
      return { props: { listings: [], hiddenCount: 0, error: `HTTP ${resp.status} ${resp.statusText} — ${snippet}` } };
    }

    if (!resp.ok) {
      return { props: { listings: [], hiddenCount: 0, error: json?.error || `HTTP ${resp.status}` } };
    }

    const raw = Array.isArray(json?.data) ? json.data : [];
    const normalized: Listing[] = raw.map(normalizeRow);

    const visible = normalized.filter((l) => l.header && l.header.trim() !== "");
    const hiddenCount = normalized.length - visible.length;

    return { props: { listings: visible, hiddenCount } };
  } catch (e: any) {
    return { props: { listings: [], hiddenCount: 0, error: e?.message || String(e) } };
  }
};

export default function CleaningIndex({ listings, hiddenCount, error }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-1">🧼 The Cleaning Index</h1>
      <p className="text-gray-600 mb-4">
        The curated, simplified view of cleaning & related service listings.
      </p>

      {hiddenCount > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          {hiddenCount} listing{hiddenCount === 1 ? "" : "s"} hidden (missing header).
        </p>
      )}

      {error && <p className="text-red-600 text-lg">Error: {error}</p>}
      {!error && listings.length === 0 && <p className="text-gray-500">No listings yet.</p>}

      <ul className="space-y-6">
        {listings.map((l) => (
          <li
            key={`${l.listNumber}-${l.header}-${l.city ?? ""}-${l.state ?? ""}`}
            className="border rounded-xl p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold">{l.header}</h2>

            <p className="text-gray-600">
              {l.city ?? "Unknown city"}
              {", "}
              {l.state ?? "Unknown state"}
            </p>

            <div className="mt-2 space-y-1 text-sm">
              {l.price != null && <p>💰 Asking Price: ${Number(l.price).toLocaleString()}</p>}
              {l.cashFlow != null && !Number.isNaN(Number(l.cashFlow)) && (
                <p>💵 Cash Flow: ${Number(l.cashFlow).toLocaleString()}</p>
              )}
            </div>

            {l.description && <p className="mt-3 text-sm text-gray-700">{l.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
