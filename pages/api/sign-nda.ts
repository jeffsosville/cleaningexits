// pages/api/sign-nda.ts
import type { NextApiRequest, NextApiResponse } from "next";

const FN_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") +
  "/functions/v1/nda-sign-v2";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("=== NDA SIGN API DEBUG ===");
  console.log("FN_URL:", FN_URL);
  console.log("Has SERVICE_KEY:", !!SERVICE_KEY);

  if (!FN_URL || !SERVICE_KEY) {
    return res.status(500).json({
      error: "Missing configuration"
    });
  }

  try {
    const r = await fetch(FN_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify(req.body),
    });

    const text = await r.text();
    console.log("Response:", text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ 
        error: "Invalid response",
        raw: text
      });
    }

    if (!r.ok) {
      return res.status(r.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err: any) {
    console.error("Proxy error:", err);
    return res.status(500).json({ 
      error: err.message
    });
  }
}
