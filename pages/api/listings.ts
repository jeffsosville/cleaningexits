import type { NextApiRequest, NextApiResponse } from "next";
import dns from "node:dns/promises";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const report: any = { ok: true };

  try {
    // 1) DNS check
    const supaHost = "pcmvulnxtvguaquejyb.supabase.co";
    const dnsRes = await dns.lookup(supaHost).catch((e) => ({ error: String(e) }));
    report.dns = dnsRes;

    // 2) Simple outbound fetch test
    const ipRes = await fetch("https://api.ipify.org?format=json", { cache: "no-store" })
      .then(async (r) => ({ status: r.status, body: await r.text() }))
      .catch((e) => ({ error: String(e) }));
    report.ipify = ipRes;

    // 3) Direct Supabase REST call (no supabase-js)
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const restUrl =
      "https://pcmvulnxtvguaquejyb.supabase.co/rest/v1/daily_listings" +
      "?select=listNumber,header,location,price,cashFlow,ebitda,description,brokerContactFullName,brokerCompany,externalUrl" +
      "&order=price.desc&limit=5";

    const supaRes = await fetch(restUrl, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        Accept: "application/json",
        Prefer: "return=representation",
      },
      cache: "no-store",
    })
      .then(async (r) => ({
        status: r.status,
        statusText: r.statusText,
        bodyText: await r.text(),
      }))
      .catch((e) => ({ error: String(e) }));

    report.supabase = { restUrl, ...supaRes };

    // If any step errored, mark not ok
    if (report.dns?.error || report.ipify?.error || report.supabase?.error) {
      report.ok = false;
    }

    const status =
      report.supabase?.status && typeof report.supabase.status === "number"
        ? report.supabase.status
        : report.ok
        ? 200
        : 500;

    // Try to pretty parse supabase body if possible
    if (report.supabase?.bodyText) {
      try {
        report.supabase.bodyJson = JSON.parse(report.supabase.bodyText);
      } catch {}
    }

    return res.status(status).json(report);
  } catch (e: any) {
    return res.status(500).json({ ok: false, fatal: String(e?.stack || e?.message || e) });
  }
}
