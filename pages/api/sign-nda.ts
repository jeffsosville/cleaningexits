// pages/api/sign-nda.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Env: set this in .env.local (fallback provided for convenience)
 * NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
 */
const FN_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") +
  "/functions/v1/nda-sign-v2";

type SignNDARequest = {
  tenant_id: string;
  listing_id: string;
  signer_name: string;
  signer_email: string;
};

type SignNDASuccess = {
  ok: true;
  version?: string;
  nda_id: string;
  sha256: string;
  deal_link: string;
  expires_at: string;
  pdf_url?: string | null;
};

type SignNDAError = {
  error: string;
  code?: string | number;
  status?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignNDASuccess | SignNDAError>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: 405 });
  }

  if (!FN_URL || !FN_URL.startsWith("https://")) {
    return res.status(500).json({
      error:
        "Supabase function URL is not configured. Set NEXT_PUBLIC_SUPABASE_URL in .env.local",
      code: "MISSING_FN_URL",
    });
  }

  // Basic payload validation (keep it simple)
  const body = (req.body || {}) as Partial<SignNDARequest>;
  const missing = ["tenant_id", "listing_id", "signer_name", "signer_email"].filter(
    (k) => !(body as any)[k]
  );
  if (missing.length) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(", ")}`,
      code: "BAD_REQUEST",
    });
  }

  try {
    const r = await fetch(FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Pass through exactly what we got (already validated)
      body: JSON.stringify(body),
    });

    // Try JSON first; if not JSON, capture raw text
    let data: any;
    let raw = "";
    try {
      data = await r.json();
    } catch {
      raw = await r.text();
      data = { error: raw || "Non-JSON error from Supabase Function" };
    }

    if (!r.ok) {
      // Normalize error into a simple string
      const msg =
        typeof data?.error === "string" ? data.error : JSON.stringify(data);
      return res.status(r.status).json({
        error: msg,
        code: data?.code ?? "FN_ERROR",
        status: r.status,
      });
    }

    // Success: forward the function response as-is
    return res.status(200).json(data as SignNDASuccess);
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : String(err);
    return res.status(500).json({ error: msg, code: "PROXY_ERROR" });
  }
}
