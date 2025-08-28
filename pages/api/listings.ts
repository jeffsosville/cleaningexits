// pages/api/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_VIEW = "cleaning_filtered";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const rawBase =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  const base = rawBase.trim().replace(/\/+$/, "");
  if (!base || !key) {
    return res
      .status(500)
      .json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
  }

  const view = ((req.query.view as string) || DEFAULT_VIEW).trim();

  // Build PostgREST params. We request "*" to avoid column-mismatch errors.
  const params = new URLSearchParams();
  params.set("select", "*");

  // Optional: client can pass ?order=col.desc — we’ll pass it through.
  const orderParam = (req.query.order as string) || "";
  if (orderParam) params.set("order", orderParam);

  // Optional limit (default 200)
  const limit = Number(req.query.limit ?? 200);
  if (Number.isFinite(limit) && limit > 0) params.set("limit", String(limit));

  // Optional: today filter if your view has pulled_at; if it doesn't, PostgREST will 42703.
  // To stay defensive, only add this if caller explicitly opts in with &today=1&has_pulled_at=1.
  if (req.query.today === "1" && req.query.has_pulled_at === "1") {
    const today = new Date().toISOString().slice(0, 10);
    params.set("pulled_at", `gte.${today}T00:00:00Z`);
    params.append("pulled_at", `lte.${today}T23:59:59Z`);
  }

  // Optional: free-text search on header/city/state if the columns exist.
  // We can't detect existence cheaply here, so we expose a passthrough OR
  // filter via ?or=header.ilike.*carpet*,city.ilike.*carpet*,state.ilike.*carpet*
  const or = (req.query.or as string) || "";
  if (or) params.set("or", or);

  const restUrl = `${base}/rest/v1/${encodeURIComponent(view)}?${params.toString()}`;

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

    const data = text ? JSON.parse(text) : [];
    return res.status(200).json({ data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
