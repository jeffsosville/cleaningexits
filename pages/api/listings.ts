import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const base = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key  = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!base || !key) return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });

  const variant = (req.query.variant as string) || "daily"; // "daily" | "index"
  const limit   = Math.min(Number(req.query.limit ?? (variant === "index" ? 1000 : 50)) || (variant === "index" ? 1000 : 50), 5000);

  // Source table/view per variant
  const source = variant === "index" ? "cleaning_exits" : "daily_listings_with_broker_urls";

  // Select only the columns we need
  const selectCols =
    variant === "index"
      ? ["header", "location", "region", "price", "cashflow", "description"].join(",")
      : ["listnumber", "header", "city", "state", "price", "cashflow", "description"].join(",");

  const order =
    variant === "index"
      ? "region.asc,location.asc,header.asc"
      : "price.desc";

  const params = new URLSearchParams({ select: selectCols, order, limit: String(limit) });
  const restUrl = `${base}/rest/v1/${source}?${params.toString()}`;

  try {
    const r = await fetch(restUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        Prefer: "return=representation",
      },
      cache: "no-store",
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: text || r.statusText });

    let data = JSON.parse(text) as any[];

    // Filter + normalize index data
    if (variant === "index") {
      data = data
        .filter((row) => row.header && row.header.trim() !== "")
        .map((row) => ({
          header: row.header,
          city: row.location,
          state: row.region,
          price: row.price ? Number(row.price.replace(/[^\d.]/g, "")) : null,
          cashFlow: row.cashflow ? Number(row.cashflow.replace(/[^\d.]/g, "")) : null,
          description: row.description,
        }));
    }

    return res.status(200).json({ data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
