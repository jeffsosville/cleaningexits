// Ultra-minimal NDA flow (no PDF, no storage)
// Creates: ndas_v2 row (placeholder), nda_signatures_v2 row, deal_room_tokens_v2 token

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const VERSION = "nda-sign-v2-min-01";

const PROJECT_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const DEAL_BASE = Deno.env.get("PUBLIC_DEAL_BASE") ?? "https://deals.example.com/deal-v2";

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { tenant_id, listing_id, signer_name, signer_email } = body || {};

    if (!tenant_id || !listing_id || !signer_name || !signer_email) {
      return json(
        { error: "Missing required fields: tenant_id, listing_id, signer_name, signer_email", version: VERSION },
        400
      );
    }

    // A) Create the light NDA row (placeholders for required cols)
    // Assumes ndas_v2 has NOT NULL for template_version & sha256.
    const { data: ndaRow, error: ndaErr } = await supabase
      .from("ndas_v2")
      .insert({
        tenant_id,
        listing_id,
        template_version: "v0",  // placeholder
        sha256: "skip",          // placeholder
      })
      .select("id")
      .single();
    if (ndaErr) return json({ error: `ndas_v2 insert failed: ${ndaErr.message}`, stage: "ndas_v2", version: VERSION }, 500);

    const nda_id = ndaRow.id as string;

    // B) Record signer
    const ip = req.headers.get("x-forwarded-for") ?? "";
    const ua = req.headers.get("user-agent") ?? "";
    const { error: sigErr } = await supabase.from("nda_signatures_v2").insert({
      tenant_id,
      nda_id,
      signer_name,
      signer_email,
      ip,
      user_agent: ua,
    });
    if (sigErr) return json({ error: `nda_signatures_v2 insert failed: ${sigErr.message}`, stage: "nda_signatures_v2", version: VERSION }, 500);

    // C) Create 24h token
    const token = crypto.randomUUID().replace(/-/g, "");
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: tokErr } = await supabase.from("deal_room_tokens_v2").insert({
      tenant_id,
      listing_id,
      token,
      expires_at,
    });
    if (tokErr) return json({ error: `deal_room_tokens_v2 insert failed: ${tokErr.message}`, stage: "deal_room_tokens_v2", version: VERSION }, 500);

    const deal_link = `${DEAL_BASE}/${token}`;

    return json({ ok: true, version: VERSION, nda_id, deal_link, expires_at });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : String(e);
    return json({ error: msg, stage: "unexpected", version: VERSION }, 500);
  }
});
