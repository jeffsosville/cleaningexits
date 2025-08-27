// pages/api/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const rawBase =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  const base = rawBase.trim().replace(/\/+$/, "");
  if (!base || !key) {
    return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
  }

  // pick view based on query param, fallback to daily
  const view = (req.query.view as string) || "daily_listings_with_broker_urls";

  const params = new URLSearchParams({
    select: [
      "listnumber",
      "header",
      "location",
      "price",
      "cashflow",
      "ebitda",
      "description",
    ].join(","),
    order: "price.desc",
  });

  // only limit for daily, not for index
  if (view === "daily_listings_with_broker_urls") {
    params.set("limit", "50");
  }

  const restUrl = `${base}/rest/v1/${view}?${params.toString()}`;

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
    if (!r.ok) {
      return res.status(r.status).json({ error: text || r.statusText });
    }

    return res.status(200).json({ data: JSON.parse(text) });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
