import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNum(v: any): number | null {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function splitCityState(location?: string | null): { city: string | null; state: string | null } {
  if (!location || typeof location !== "string") return { city: null, state: null };
  const m = location.match(/^([^,]+)\s*,\s*([A-Za-z.\s-]{2,})\s*$/);
  return m ? { city: m[1], state: m[2] } : { city: location, state: null };
}

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

  const source = variant === "index"
  ? "cleaning_exits_clean_only"  // ✅ use the view instead of raw table
  : "daily_listings_with_broker_urls";


  // Select only columns that actually exist per source
  const selectCols =
    variant === "index"
      ? ["header","location","region","price","cashflow","description"].join(",")
      : ["listnumber","header","location","price","cashflow","description"].join(",");

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

    const raw = JSON.parse(text) as any[];

    // Normalize to a uniform shape for the React pages
    let data = raw
      .filter((row) => typeof row?.header === "string" && row.header.trim() !== "")
      .map((row) => {
        if (variant === "index") {
          // cleaning_exits rows: region ~ state, location ~ city/area
          const city = row.location ?? null;
          const state = row.region ?? null;
          return {
            header: row.header as string,
            city,
            state,
            price: toNum(row.price),
            cashFlow: toNum(row.cashflow),
            description: typeof row.description === "string" ? row.description : null,
          };
        } else {
          // daily_listings_with_broker_urls rows: only 'location' (e.g., "Denver, CO")
          const { city, state } = splitCityState(row.location ?? null);
          return {
            header: row.header as string,
            city,
            state,
            price: toNum(row.price),
            cashFlow: toNum(row.cashflow),
            description: typeof row.description === "string" ? row.description : null,
          };
        }
      });

    // For the index, keep ones with some finance signal and dedupe a bit
    if (variant === "index") {
      const seen = new Set<string>();
      data = data
        .filter((x) => x.price != null || x.cashFlow != null)
        .filter((x) => {
          const k = `${(x.header || "").toLowerCase()}|${(x.city || "").toLowerCase()}|${(x.state || "").toLowerCase()}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
    }

    // Enforce limit after normalization
    data = data.slice(0, limit);

    return res.status(200).json({ data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
