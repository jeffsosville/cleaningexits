import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('public.cleaning_listings')
      .select('*')
      .limit(5);

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      count: data?.length || 0,
      sample: data?.[0] || null
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Caught error',
      message: error.message 
    }, { status: 500 });
  }
}
