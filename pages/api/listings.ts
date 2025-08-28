// pages/api/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AllowedView = "cleaning_filtered" | "cleaning_exits_with_financials";

const DEFAULT_VIEW: AllowedView = "cleaning_filtered";

// Columns to select per view (adjust if your view exposes different names)
const SELECT_BY_VIEW: Record<string, string> = {
  cleaning_filtered: [
    "id",
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
  cleaning_exits_with_financials: [
    "listnumber",
    "header",
    "location",
    "price",
    "cashflow",
    "ebitda",
    "description",
  ].join(","),
};

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
    return res
      .status(500)
      .json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
  }

  // Which view? default to the cleaned one
  const view = (req.query.view as string) as AllowedView || DEFAULT_VIEW;

  // Build query params
  const params = new URLSearchParams();

  // Select
  params.set("select", SELECT_BY_VIEW[view] || "*");

  // Optional: order (default newest first by pulled_at if present)
  const orderParam =
    (req.query.order as string) ||
    (view === "cleaning_filtered" ? "pulled_at.desc" : "price.desc");
  if (orderParam) {
    params.set("order", orderParam);
  }

  // Optional: today filter (only rows pulled today)
  const todayOnly = req.query.today === "1";
  if (todayOnly && view === "cleaning_filtered") {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    params.set("pulled_at", `gte.${today}T00:00:00Z`);
    params.append("pulled_at", `lte.${today}T23:59:59Z`);
  }

  // Optional: free-text header filter (?q=carpet)
  const q = (req.query.q as string)?.trim();
  if (q && view === "cleaning_filtered") {
    // ilike on header and city/state where available
    params.set("or", `header.ilike.*${q}*,city.ilike.*${q}*,state.ilike.*${q}*`);
  }

  // Limit (default 200 for the index; you can change)
  const limit = Number(req.query.limit ?? (view === "cleaning_filtered" ? 200 : 100));
  if (!Number.isNaN(limit) && limit > 0) params.set("limit", String(limit));

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
