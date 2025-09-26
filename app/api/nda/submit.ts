import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";

// Configure Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Optional: Resend for emails
async function sendEmail(to: string, subject: string, body: string, pdfUrl?: string) {
  // Example with Resend (swap for SendGrid/Postmark if preferred)
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "nda@cleaningexits.com",
      to,
      subject,
      html: `<p>${body}</p>
             ${pdfUrl ? `<p><a href="${pdfUrl}">Download signed NDA (7 days)</a></p>` : ""}`,
    }),
  });
  return resp.ok;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const {
      form_slug,
      listing_id,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_linkedin,
      consent_esign,
      utms,
      user_agent,
    } = req.body;

    if (!buyer_name || !buyer_email || !consent_esign) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      null;
    const timestamp = new Date().toISOString();

    // 1. Insert submission row
    const { data: sub, error: subErr } = await supabase
      .from("form_submissions")
      .insert({
        form_slug,
        listing_id,
        buyer_name,
        buyer_email,
        buyer_phone,
        buyer_linkedin,
        consent_esign,
        ip,
        user_agent,
      })
      .select("*")
      .single();

    if (subErr) return res.status(400).json({ error: subErr.message });

    // 2. Build PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const ndaTitle = "Mutual Non-Disclosure Agreement";
    const ndaText = `
This NDA governs the disclosure of confidential information for the purpose of
evaluating a potential transaction. Recipient agrees not to disclose or use the
information except as expressly permitted. (Replace with full NDA terms.)
    `.trim();

    page.drawText(ndaTitle, { x: 50, y: 740, size: 16, font, color: rgb(0, 0, 0) });
    page.drawText(`Buyer: ${buyer_name} <${buyer_email}>`, { x: 50, y: 715, size: 10, font });
    page.drawText(`Listing ID: ${listing_id || "-"}`, { x: 50, y: 700, size: 10, font });
    page.drawText(`Signed at: ${timestamp}`, { x: 50, y: 685, size: 10, font });
    page.drawText(`IP: ${ip || "-"}`, { x: 50, y: 670, size: 10, font });
    page.drawText(`User Agent: ${user_agent?.slice(0, 80) || "-"}`, { x: 50, y: 655, size: 10, font });
    page.drawText(`UTMs: ${JSON.stringify(utms || {})}`, { x: 50, y: 640, size: 9, font });

    page.drawText(ndaText, {
      x: 50,
      y: 580,
      size: 10,
      font,
      maxWidth: 500,
      lineHeight: 12,
    });

    page.drawText(`Electronic Signature: ${buyer_name}`, { x: 50, y: 120, size: 12, font });
    page.drawText(`Date: ${timestamp}`, { x: 50, y: 100, size: 10, font });

    const pdfBytes = await pdfDoc.save();
    const hash = crypto.createHash("sha256").update(pdfBytes).digest("hex");

    // 3. Upload to Supabase Storage
    const filename = `nda/${sub.id}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("e_signed_docs")
      .upload(filename, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (upErr) return res.status(400).json({ error: upErr.message });

    // Create a 7-day signed URL
    const { data: signedUrl } = await supabase.storage
      .from("e_signed_docs")
      .createSignedUrl(filename, 60 * 60 * 24 * 7);

    // 4. Insert final signature record
    const { error: sigErr } = await supabase.from("nda_signatures").insert({
      submission_id: sub.id,
      pdf_url: filename,
      pdf_hash_sha256: hash,
      signed_at: timestamp,
      listing_id,
      buyer_email,
      buyer_name,
      ip,
      user_agent,
    });

    if (sigErr) return res.status(400).json({ error: sigErr.message });

    // 5. Send emails
    await sendEmail(
      buyer_email,
      "Your Signed NDA – CleaningExits",
      "Here is a link to your signed NDA.",
      signedUrl?.signedUrl
    );
    // TODO: look up broker email by listing_id and send to them too
    await sendEmail(
      "broker@example.com",
      "New Buyer Signed NDA",
      `Buyer ${buyer_name} just signed an NDA for listing ${listing_id}.`,
      signedUrl?.signedUrl
    );

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
