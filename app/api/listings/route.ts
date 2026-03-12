// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location');
    const sortBy = searchParams.get('sortBy') || 'scraped_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const category = searchParams.get('category');
    const offset = (page - 1) * limit;
    let query = supabase
      .from('cleaning_listings_merge')
      .select('*', { count: 'exact' })
      .eq('is_verified', true);
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`header.ilike.%${search}%,notes.ilike.%${search}%,location.ilike.%${search}%`);
    }
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }
    if (location) {
      query = query.or(`location.ilike.%${location}%,city.ilike.%${location}%,state.ilike.%${location}%`);
    }
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) {
      console.error('Listings API error:', error);
      return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
    }
    const totalPages = Math.ceil((count || 0) / limit);
    return NextResponse.json({
      listings: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
