// supabase/functions/nda-sign-v2/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const DRY_RUN = (Deno.env.get("DRY_RUN") ?? "true").toLowerCase() === "true";
const ENV_PREFIX = Deno.env.get("ENV_PREFIX") ?? "staging";
const DEAL_BASE = Deno.env.get("PUBLIC_DEAL_BASE") ?? "https://deals.example.com/deal-v2";

function sha256Hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "";
    const ua = req.headers.get("user-agent") ?? "";
    const { tenant_id, listing_id, signer_name, signer_email } = await req.json();

    if (!tenant_id || !listing_id || !signer_name || !signer_email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Generate a minimal NDA PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText(`NDA Agreement`, { x: 50, y: 740, font, size: 18 });
    page.drawText(`Tenant: ${tenant_id}`, { x: 50, y: 700, font, size: 12 });
    page.drawText(`Listing: ${listing_id}`, { x: 50, y: 680, font, size: 12 });
    page.drawText(`Signer: ${signer_name} <${signer_email}>`, { x: 50, y: 660, font, size: 12 });
    page.drawText(`Date: ${new Date().toISOString()}`, { x: 50, y: 640, font, size: 12 });
    const pdfBytes = await pdf.save();

    const hashBuf = await crypto.subtle.digest("SHA-256", pdfBytes);
    const sha256 = sha256Hex(hashBuf);

    // Insert NDA row
    const { data: ndaRow, error: ndaErr } = await supabase
      .from("ndas_v2")
      .insert({ tenant_id, listing_id, template_version: "v1", sha256 })
      .select("id")
      .single();
    if (ndaErr) throw ndaErr;
    const nda_id = ndaRow.id as string;

    // Upload PDF if not DRY_RUN
    let pdf_url: string | null = null;
    if (!DRY_RUN) {
      const path = `${ENV_PREFIX}/${tenant_id}/${nda_id}.pdf`;
      const up = await supabase.storage
        .from("ndas_v2")
        .upload(path, new Blob([pdfBytes], { type: "application/pdf" }), { upsert: true });
      if (up.error) throw up.error;

      const signed = await supabase.storage
        .from("ndas_v2")
        .createSignedUrl(path, 3600);
      pdf_url = signed.data?.signedUrl ?? null;

      await supabase.from("ndas_v2").update({ pdf_url }).eq("id", nda_id);
    }

    // Record signature
    await supabase.from("nda_signatures_v2").insert({
      tenant_id,
      nda_id,
      signer_name,
      signer_email,
      ip,
      user_agent: ua
    });

    // Create token
    const token = crypto.randomUUID().replace(/-/g, "");
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("deal_room_tokens_v2").insert({
      tenant_id,
      listing_id,
      token,
      expires_at
    });

    const deal_link = `${DEAL_BASE}/${token}`;
    return new Response(
      JSON.stringify({ ok: true, nda_id, pdf_url, sha256, deal_link, expires_at }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

