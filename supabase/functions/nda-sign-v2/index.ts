// supabase/functions/nda-sign-v2/index.ts
// Ultra-minimal NDA + HARD DEBUG (no PDF, no storage)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const VERSION = "nda-sign-v2-dbg-min-01";

const PROJECT_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const DEAL_BASE = (Deno.env.get("PUBLIC_DEAL_BASE") ?? "https://deals.example.com/deal-v2").replace(/\/$/, "");

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

function J(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
function E(stage: string, e: unknown, status = 500) {
  const msg = typeof (e as any)?.message === "string" ? (e as any).message : String(e);
  const code = (e as any)?.code ?? (e as any)?.name ?? "unknown";
  return J({ error: msg, code, stage, version: VERSION }, status);
}

Deno.serve(async (req) => {
  try {
    // A) Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return E("A_PARSE_BODY", e, 400);
    }
    const { tenant_id, listing_id, signer_name, signer_email } = body ?? {};
    if (!tenant_id || !listing_id || !signer_name || !signer_email) {
      return E("A_VALIDATE", new Error("Missing required fields: tenant_id, listing_id, signer_name, signer_email"), 400);
    }

    // B) Insert bare NDA row
    try {
      const { data, error } = await supabase
        .from("ndas_v2")
        .insert({ tenant_id, listing_id, template_version: "v0", sha256: "skip" })
        .select("id")
        .single();
      {result.error ? (
  <p style={{ color: "red", whiteSpace: "pre-wrap" }}>
    <strong>Error Details:</strong><br/>
    {JSON.stringify(result, null, 2)}
  </p>
) : (

    // C) Insert signature metadata
    try {
      const ip = req.headers.get("x-forwarded-for") ?? "";
      const ua = req.headers.get("user-agent") ?? "";
      const { error } = await supabase.from("nda_signatures_v2").insert({
        tenant_id,
        nda_id: body.nda_id,
        signer_name,
        signer_email,
        ip,
        user_agent: ua,
      });
      if (error) throw error;
    } catch (e) {
      return E("C_INSERT_SIGNATURE", e);
    }

    // D) Create 24h token
    let token = "";
    let expires_at = "";
    try {
      token = crypto.randomUUID().replace(/-/g, "");
      expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("deal_room_tokens_v2").insert({
        tenant_id,
        listing_id,
        token,
        expires_at,
      });
      if (error) throw error;
    } catch (e) {
      return E("D_INSERT_TOKEN", e);
    }

    const deal_link = `${DEAL_BASE}/${token}`;
    return J({ ok: true, version: VERSION, nda_id: body.nda_id, deal_link, expires_at });
  } catch (e) {
    return E("Z_UNEXPECTED", e);
  }
});
