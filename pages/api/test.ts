import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.DEALLEDGER_SUPABASE_URL;
  const key = process.env.DEALLEDGER_SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    return res.status(200).json({ error: 'Missing env vars', hasUrl: !!url, hasKey: !!key });
  }

  try {
    const sb = createClient(url, key);
    const { count, error } = await sb
      .from('listings')
      .select('*', { count: 'exact', head: true });
    return res.status(200).json({ count, error, urlPrefix: url.slice(0, 40) });
  } catch (e: any) {
    return res.status(200).json({ caught: e.message, urlPrefix: url?.slice(0, 40) });
  }
}
