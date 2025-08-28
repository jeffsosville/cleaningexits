// pages/api/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AllowedView = "cleaning_filtered";
const DEFAULT_VIEW: AllowedView = "cleaning_filtered";

const SELECT_BY_VIEW: Record<string, string> = {
  cleaning_filtered: [
    // no "id" here on purpose
    "header",
    "city",
    "state",
    "price",
    "revenue",
    "cashflow",
    "broker_name",
    "source_url",
    "pulled_at",
  ].join(","),
};

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

  const view = ((req.query.view as string) || DEFAULT_VIEW) as AllowedView;

  const params = new URLSearchParams();
  params.set("select", SELECT_BY_VIEW[view] || "*");

  const orderParam =
    (req.query.order as string) || (view === "cleaning_filtered" ? "pulled_at.desc" : "");
  if (orderParam) params.set("order", orderParam);

  const limit = Number(req.query.limit ?? 200);
  if (Number.isFinite(limit) && limit > 0) params.set("limit", String(limit));

  // today filter (only for cleaning_filtered)
  if (req.query.today === "1" && view === "cleaning_filtered") {
    const today = new Date().toISOString().slice(0, 10);
    params.set("pulled_at", `gte.${today}T00:00:00Z`);
    params.append("pulled_at", `lte.${today}T23:59:59Z`);
  }

  // simple free-text filter on header/city/state
  const q = (req.query.q as string)?.trim();
  if (q && view === "cleaning_filtered") {
    params.set("or", `header.ilike.*${q}*,city.ilike.*${q}*,state.ilike.*${q}*`);
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

    const data = text ? JSON.parse(text) : [];
    return res.status(200).json({ data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
