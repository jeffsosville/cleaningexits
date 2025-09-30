import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;

  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from('deal_room_tokens_v2')
      .select('listing_id, expires_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Link expired' });
    }

    const { data: files } = await supabase
      .from('deal_room_files_v2')
      .select('id, file_name, file_type')
      .eq('listing_id', tokenData.listing_id)
      .eq('is_active', true);

    return res.status(200).json({ files: files || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
