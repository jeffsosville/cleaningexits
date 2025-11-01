// pages/residential-cleaning-for-sale.tsx
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Listing = {
  id: string;
  header: string | null;
  price: number | null;
  city: string | null;
  state: string | null;
  cash_flow: number | null;
  revenue: string | null;
  image_url: string | null;
};

const money = (n?: number | null) =>
  n == null ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const parseRevenue = (rev: string | null): number | null => {
  if (!rev) return null;
  const cleaned = rev.replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export default function ResidentialCleaningPage({ listings, totalCount, avgPrice, avgRevenue, states }: any) {
  return (
    <>
      <Head>
        <title>Residential Cleaning Businesses for Sale | Cleaning Exits</title>
        <meta name="description" content={`${totalCount} residential cleaning businesses for sale. Browse verified home cleaning and maid service opportunities with detailed financials.`} />
        <link rel="canonical" href="https://cleaningexits.com/residential-cleaning-for-sale" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">← Back to Cleaning Exits</Link>
          </div>
        </header>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Residential Cleaning Businesses for Sale</h1>
            <p className="text-xl text-emerald-100 mb-8">{totalCount} verified residential cleaning and maid service businesses available</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">{totalCount}</div>
                <div className="text-emerald-100">Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">{states.length}+</div>
                <div className="text-emerald-100">States</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">{money(avgPrice)}</div>
                <div className="text-emerald-100">Avg Price</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">90%</div>
                <div className="text-emerald-100">SBA Financing</div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-12">
          {states.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by State</h2>
              <div className="flex flex-wrap gap-3">
                {states.map((state: string) => (
                  <Link key={state} href={`/cleaning-businesses-for-sale/${state.toLowerCase()}`} 
                    className="px-4 py-2 bg-white border rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition">
                    {state}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Residential Cleaning Businesses</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing: Listing) => (
                <Link key={listing.id} href={`/listing/${listing.id}`} 
                  className="bg-white rounded-lg border hover:shadow-lg transition overflow-hidden">
                  {listing.image_url && <img src={listing.image_url} alt={listing.header || ''} className="w-full h-48 object-cover" />}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2">{listing.header || 'Residential Cleaning Business'}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Price</span><span className="font-bold text-emerald-600">{money(listing.price)}</span></div>
                      {listing.cash_flow && <div className="flex justify-between"><span className="text-gray-600">Cash Flow</span><span>{money(listing.cash_flow)}</span></div>}
                      {listing.revenue && <div className="flex justify-between"><span className="text-gray-600">Revenue</span><span>{money(parseRevenue(listing.revenue))}</span></div>}
                      <div className="flex justify-between pt-2 border-t"><span className="text-gray-600">Location</span><span className="font-medium">{listing.city && listing.state ? `${listing.city}, ${listing.state}` : listing.state || '—'}</span></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-bold mb-4">Why Buy a Residential Cleaning Business?</h2>
            <p className="text-gray-700 mb-4">Residential cleaning businesses serve homeowners with recurring cleaning services. These businesses benefit from predictable revenue streams and strong customer retention.</p>
            <h3 className="text-xl font-bold mt-6 mb-3">Key Benefits</h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ <strong>Recurring revenue</strong> from weekly/bi-weekly home cleanings</li>
              <li>✓ <strong>Low overhead</strong> compared to commercial operations</li>
              <li>✓ <strong>Flexible scheduling</strong> and route optimization</li>
              <li>✓ <strong>Strong referral business</strong> from satisfied homeowners</li>
              <li>✓ <strong>SBA financing available</strong> with 10% down payment</li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const keywords = ['residential', 'home', 'house', 'maid', 'housekeeping', 'homeowner'];
  
  const { data: allListings } = await supabase
    .from('cleaning_listings_merge')
    .select('*')
    .not('price', 'is', null)
    .not('state', 'is', null);

  const listings = (allListings || []).filter(listing => {
    const searchText = `${listing.header} ${listing.notes}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  }).slice(0, 50);

  const avgPrice = listings.length > 0 ? Math.round(listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length) : 0;
  
  const revenues = listings.map(l => {
    if (!l.revenue) return null;
    const cleaned = l.revenue.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }).filter((r): r is number => r !== null);
  
  const avgRevenue = revenues.length > 0 ? Math.round(revenues.reduce((sum, r) => sum + r, 0) / revenues.length) : 0;
  
  const states = Array.from(new Set(listings.filter(l => l.state).map(l => l.state!))).slice(0, 10);

  return {
    props: { listings, totalCount: listings.length, avgPrice, avgRevenue, states },
    revalidate: 3600,
  };
};
