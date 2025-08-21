import type { NextApiRequest, NextApiResponse } from "next";

function serializeError(e: any) {
  try {
    return JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e)));
  } catch {
    return { message: String(e?.message || e), stack: String(e?.stack || "") };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const report: any = {
    env: {
      urlPresent: Boolean(urlEnv),
      keyPresent: Boolean(keyEnv),
      urlPreview: urlEnv ? urlEnv.slice(0, 60) : null,
      keyPreview: keyEnv ? keyEnv.slice(0, 10) + "..." : null,
    },
    restUrl: null,
  };

  try {
    const url = urlEnv?.trim();
    const key = keyEnv?.trim();

    if (!url || !key) {
      report.reason = "missing_env";
      return res.status(500).json(report);
    }

    const restUrl =
      `${url}/rest/v1/daily_listings` +
      `?select=listNumber,header,location,price,cashFlow,ebitda,description,brokerContactFullName,brokerCompany,externalUrl` +
      `&order=price.desc&limit=5`;

    report.restUrl = restUrl;

    const r = await fetch(restUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        Prefer: "return=representation",
      },
      credentials: "omit",
      cache: "no-store",
      redirect: "follow",
    });

    const text = await r.text();
    report.responseStatus = r.status;
    report.responseStatusText = r.statusText;
    report.rawBodyPreview = text.slice(0, 300);

    let body: any = text;
    try { body = JSON.parse(text); } catch { /* keep text */ }

    if (!r.ok) {
      report.body = body;
      return res.status(r.status).json(report);
    }

    return res.status(200).json({ data: body, report });
  } catch (e: any) {
    report.error = serializeError(e);
    // Surface cause if available (Node fetch often sets e.cause with code like ENOTFOUND)
    // @ts-ignore
    if (e?.cause) report.cause = serializeError(e.cause);
    return res.status(500).json(report);
  }
}
