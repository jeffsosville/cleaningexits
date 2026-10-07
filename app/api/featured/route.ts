import { NextResponse } from 'next/server';
import { getOurListings } from '@/data/ourListings';

export const dynamic = 'force-dynamic';

// Our own (CleaningExits-brokered) listings for the homepage feature, newest first.
export async function GET() {
  const listings = await getOurListings();
  return NextResponse.json(
    {
      listings: listings.map((l) => ({
        id: l.id, title: l.title, category: l.category, price: l.price, cash_flow: l.cash_flow,
        location: l.location, status: l.status, listedOn: l.listedOn, ctaHref: l.ctaHref,
      })),
    },
    { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
  );
}
