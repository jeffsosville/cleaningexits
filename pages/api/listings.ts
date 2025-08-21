import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!url || !key) {
      return res.status(500).json({
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
        urlPresent: Boolean(url),
        keyPresent: Boolean(key),
      });
    }

    const restUrl = `${url}/rest/v1/daily_listings` +
      `?select=listNumber,header,location,price,cashFlow,ebitda,description,brokerContactFullName,brokerCompany,externalUrl` +
      `&order=price.desc&limit=20`;

    const r = await fetch(restUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        Prefer: "return=representation",
      },
      credentials: "omit",
      cache: "no-store",
    });

    const text = await r.text();
    let body: any = text;
    try { body = JSON.parse(text); } catch {}

    if (!r.ok) {
      return res.status(r.status).json({
        error: body?.message || body || r.statusText,
        status: r.status,
        restUrl,
      });
    }

    return res.status(200).json({ data: body });
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
