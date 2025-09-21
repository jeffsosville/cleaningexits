// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface Listing {
  header: string;
  location: string;
  price: number;
  description: string;
  img: string;
  listNumber: number;
  urlStub: string;
  cashFlow: string;
  ebitda: string;
  brokerCompany: string;
  brokerContactFullName: string;
  region: string;
  hotProperty: string;
  recentlyUpdated: string;
  recentlyAdded: string;
  scraped_at: string;
  surrogate_key: string;
}

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

    const offset = (page - 1) * limit;

    let query = supabase
      .from('daily_listings')
      .select(`
        header,
        location,
        price,
        description,
        img,
        listNumber,
        urlStub,
        cashFlow,
        ebitda,
        brokerCompany,
        brokerContactFullName,
        region,
        hotProperty,
        recentlyUpdated,
        recentlyAdded,
        scraped_at,
        surrogate_key
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`header.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
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
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
