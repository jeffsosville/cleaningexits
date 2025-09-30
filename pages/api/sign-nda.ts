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

    // try to parse json; if it fails, capture raw text
    let data: any;
    let raw = "";
    try {
      data = await r.json();
    } catch {
      raw = await r.text();
      data = { error: raw || "Non-JSON error from function" };
    }

    if (!r.ok) {
      const msg =
        typeof data?.error === "string"
          ? data.error
          : JSON.stringify(data);
      return res.status(r.status).json({ error: msg, code: data?.code });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
