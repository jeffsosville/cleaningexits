import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string // Use service role for this
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Mark listing as pending analysis
    const { error } = await supabase
      .from('listings')
      .update({ pending_analysis: true })
      .eq('listing_id', id);

    if (error) throw error;

    return res.status(200).json({ 
      message: 'Analysis queued. Check back in 30 seconds.',
      status: 'pending'
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Failed to queue analysis' });
  }
}
