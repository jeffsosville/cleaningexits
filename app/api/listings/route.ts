// app/api/listings/route.ts
// SINGLE SOURCE OF TRUTH: DealLedger `cleaning_listings_direct` view.
// Query logic lives in lib/listingsQuery.ts so pages/listings.tsx can
// server-render the same first page that this route returns.

import { NextRequest, NextResponse } from 'next/server';
import { queryListings } from '@/lib/listingsQuery';

// Backed by a live DealLedger view — never statically cache this route.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json(await queryListings(searchParams), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      { listings: [], pagination: null, error: error?.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
