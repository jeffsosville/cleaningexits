// pages/api/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const base = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key  = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!base || !key) {
    return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
  }

  const restUrl = `${base}/rest/v1/daily_listings` +
    `?select=listNumber,header,location,price,cashFlow,ebitda,description,brokerContactFullName,brokerCompany,externalUrl` +
    `&order=price.desc&limit=50`; // <- 50 items

  try {
    const r = await fetch(restUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        Prefer: "return=representation",
      },
      credentials: "omit",
      cache: "no-store",
    });

    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: text || r.statusText });

    const data = JSON.parse(text);
    return res.status(200).json({ data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
