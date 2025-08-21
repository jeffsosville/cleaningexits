import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = "https://pcmvulnxtvguaquejyb.supabase.co/rest/v1/daily_listings?select=header,location,price,cashFlow,ebitda,description,brokerContactFullName,brokerCompany,externalUrl&limit=5";

    console.log("🔍 Fetching from:", url);

    const response = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
      },
    });

    console.log("✅ Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Supabase returned error:", text);
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    console.log("📦 Got data:", data);

    return res.status(200).json(data);
  } catch (err: any) {
    console.error("🔥 API route error:", err);
    return res.status(500).json({ error: err.message || "fetch failed" });
  }
}
