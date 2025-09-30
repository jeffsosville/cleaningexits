// pages/api/sign-nda.ts
import type { NextApiRequest, NextApiResponse } from "next";

const FN_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") +
  "/functions/v1/nda-sign-v2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("=== NDA SIGN API DEBUG ===");
  console.log("FN_URL:", FN_URL);
  console.log("Request body:", req.body);

  if (!FN_URL || !FN_URL.startsWith("https://")) {
    return res.status(500).json({
      error: "NEXT_PUBLIC_SUPABASE_URL not configured"
    });
  }

  try {
    console.log("Calling Edge Function...");
    
    const r = await fetch(FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    console.log("Edge Function status:", r.status);
    console.log("Edge Function headers:", Object.fromEntries(r.headers.entries()));

    const text = await r.text();
    console.log("Edge Function raw response:", text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Failed to parse JSON, raw text:", text);
      return res.status(500).json({ 
        error: "Invalid response from Edge Function",
        raw: text
      });
    }

    if (!r.ok) {
      console.error("Edge Function error:", data);
      return res.status(r.status).json(data);
    }

    console.log("Success:", data);
    return res.status(200).json(data);

  } catch (err: any) {
    console.error("Proxy error:", err);
    return res.status(500).json({ 
      error: err.message,
      stack: err.stack
    });
  }
}
