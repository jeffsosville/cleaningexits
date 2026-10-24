// GET                         → preview this week's email (HTML), sends nothing
// GET ?format=json            → counts only
// GET with Authorization: Bearer CRON_SECRET   → sends (this is how the Vercel cron calls it)
//     add ?test=you@example.com to send only to that subscriber
import type { NextApiRequest, NextApiResponse } from 'next';
import { buildWeekly, renderWeekly, sendWeekly } from '@/lib/newsletter/weekly';

export const config = { maxDuration: 300 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET;
  const authed = !!secret && req.headers.authorization === `Bearer ${secret}`;
  try {
    if (authed) {
      const test = typeof req.query.test === 'string' ? req.query.test : undefined;
      const result = await sendWeekly({ onlyEmail: test, dryRun: req.query.dry === '1' });
      return res.status(200).json({ ok: true, ...result });
    }
    if (req.method !== 'GET') return res.status(401).json({ error: 'unauthorized' });
    if (req.query.format === 'json') return res.status(200).json(await sendWeekly({ dryRun: true }));
    const { html } = renderWeekly(await buildWeekly(), 'preview');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err: any) {
    console.error('newsletter weekly error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
