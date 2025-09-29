// supabase/functions/nda-sign-v2/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

// ── Env (use allowed names; Supabase blocks SUPABASE_* in secrets) ──────────────
const PROJECT_URL = Deno.env.get("PROJECT_URL")!;            // e.g. https://<ref>.supabase.co
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;  // your service role JWT
const DRY_RUN = (Deno.env.get("DRY_RUN") ?? "true").toLowerCase() === "true";
const ENV_PREFIX = Deno.env.get("ENV_PREFIX") ?? "staging";  // staging | prod
const DEAL_BASE = Deno.env.get("PUBLIC_DEAL_BASE") ?? "https://deals.example.com/deal-v2";

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

// ── Helpers ────────────────────────────────────────────────────────────────────
function sha256Hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ── Handler ────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "";
    const ua = req.headers.get("user-agent") ?? "";
    const body = await req.json().catch(() => ({}));

    const { tenant_id, listing_id, signer_name, signer_email } = body ?? {};
    if (!tenant_id || !listing_id || !signer_name || !signer_email) {
      return json({ error: "Missing required fields" }, 400);
    }

    // 1) Generate minimal NDA PDF (MVP terms inline; template versions later)
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]); // Letter
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    let y = 740;
    const draw = (t: string, size = 12) => {
      page.drawText(t, { x: 50, y, size, font });
      y -= size + 10;
    };
    draw("Mutual Confidentiality Agreement (v1)", 18);
    draw(`Tenant: ${tenant_id}`);
    draw(`Listing: ${listing_id}`);
    draw(`Recipient: ${signer_name} <${signer_email}>`);
    draw(`Date: ${new Date().toISOString()}`);
    y -= 10;
    draw("Recipient agrees to keep non-public information confidential, use only for evaluation,");
    draw("and not to contact the seller outside broker channels. Obligations survive 3 years.");
    const pdfBytes = await pdf.save();

    const hashBuf = await crypto.subtle.digest("SHA-256", pdfBytes);
    const sha256 = sha256Hex(hashBuf);

    // 2) Create NDA row
    const { data: ndaRow, error: ndaErr } = await supabase
      .from("ndas_v2")
      .insert({ tenant_id, listing_id, template_version: "v1", sha256 })
      .select("id")
      .single();
    if (ndaErr) throw new Error(`ndas_v2 insert failed: ${ndaErr.message}`);
    const nda_id: string = ndaRow.id;

    // 3) Upload PDF (skip if DRY_RUN)
    let pdf_url: string | null = null;
    if (!DRY_RUN) {
      const path = `${ENV_PREFIX}/${tenant_id}/${nda_id}.pdf`;
      const up = await supabase.storage
        .from("ndas_v2")
        .upload(path, new Blob([pdfBytes], { type: "application/pdf" }), { upsert: true });
      if (up.error) throw new Error(`storage upload failed: ${up.error.message}`);

      const signed = await supabase.storage.from("ndas_v2").createSignedUrl(path, 3600);
      if (signed.error) throw new Error(`createSignedUrl failed: ${signed.error.message}`);
      pdf_url = signed.data?.signedUrl ?? null;

      const { error: updErr } = await supabase
        .from("ndas_v2")
        .update({ pdf_url })
        .eq("id", nda_id);
      if (updErr) throw new Error(`ndas_v2 update failed: ${updErr.message}`);
    }

    // 4) Record signature metadata
    const { error: sigErr } = await supabase.from("nda_signatures_v2").insert({
      tenant_id,
      nda_id,
      signer_name,
      signer_email,
      ip,
      user_agent: ua,
    });
    if (sigErr) throw new Error(`nda_signatures_v2 insert failed: ${sigErr.message}`);

    // 5) Create 24h deal-room token
    const token = crypto.randomUUID().replace(/-/g, "");
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: tokErr } = await supabase.from("deal_room_tokens_v2").insert({
      tenant_id,
      listing_id,
      token,
      expires_at,
    });
    if (tokErr) throw new Error(`deal_room_tokens_v2 insert failed: ${tokErr.message}`);

    // 6) Response
    const deal_link = `${DEAL_BASE}/${token}`;
    return json({ ok: true, nda_id, pdf_url, sha256, deal_link, expires_at }, 200);
  } catch (e: any) {
    console.error("nda-sign-v2 error:", e);
    const msg = typeof e?.message === "string" ? e.message : String(e);
    const code = e?.code ?? e?.name ?? "unknown_error";
    return json({ error: msg, code }, 500);
  }
});
