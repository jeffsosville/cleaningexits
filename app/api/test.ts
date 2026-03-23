import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.DEALLEDGER_SUPABASE_URL;
  const key = process.env.DEALLEDGER_SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    return NextResponse.json({ error: 'Missing env vars', url: !!url, key: !!key });
  }

  try {
    const sb = createClient(url, key);
    const { count, error } = await sb
      .from('listings')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({ count, error, url_used: url.slice(0, 30) });
  } catch (e: any) {
    return NextResponse.json({ caught: e.message, url_used: url.slice(0, 30) });
  }
}
