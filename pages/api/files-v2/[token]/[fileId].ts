import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token, fileId } = req.query;

  try {
    const { data: tokenData } = await supabase
      .from('deal_room_tokens_v2')
      .select('listing_id')
      .eq('token', token)
      .single();

    if (!tokenData) return res.status(404).json({ error: 'Invalid token' });

    const { data: file } = await supabase
      .from('deal_room_files_v2')
      .select('storage_path')
      .eq('id', fileId)
      .eq('listing_id', tokenData.listing_id)
      .single();

    if (!file) return res.status(404).json({ error: 'File not found' });

    const { data: signedData } = await supabase
      .storage
      .from('deal_rooms_v2')
      .createSignedUrl(file.storage_path, 3600);

    return res.status(200).json({ signed_url: signedData?.signedUrl });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
