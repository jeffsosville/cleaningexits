// pages/api/sign-nda.ts
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const r = await fetch(
      "https://tcsgmaozbbkldpwlorzk.supabase.co/functions/v1/nda-sign-v2",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || "NDA signing failed" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("sign-nda error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
