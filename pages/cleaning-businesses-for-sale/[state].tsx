// pages/cleaning-businesses-for-sale/[state].tsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Listing = {
  id: string;
  title: string | null;
  price: number | null;
  city: string | null;
  state: string | null;
  cash_flow: number | null;
  revenue: string | null;
  image_url: string | null;
};

type StateStats = {
  total_listings: number;
  avg_price: number;
  avg_revenue: number;
  cities: string[];
};

type StatePageProps = {
  state: string;
  stateFullName: string;
  listings: Listing[];
  stats: StateStats;
};

const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming'
};

const money = (n?: number | null) =>
  n == null ? null : n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const parseRevenue = (rev: string | null): number | null => {
  if (!rev) return null;
  const cleaned = rev.replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Get all unique states from database
  const { data: states } = await supabase
    .from('cleaning_listings_merge')
    .select('state')
    .not('state', 'is', null)
    .order('state');

  if (!states) return { paths: [], fallback: 'blocking' };

  // Get unique states
  const uniqueStates = Array.from(new Set(states.map(s => s.state)));
  
  const paths = uniqueStates.map(state => ({
    params: { state: state.toLowerCase() }
  }));

  return {
    paths,
    fallback: 'blocking', // Generate pages on-demand for new states
  };
};

export const getStaticProps: GetStaticProps<StatePageProps> = async (context) => {
  const state = (context.params?.state as string).toUpperCase();
  const stateFullName = STATE_NAMES[state] || state;

  // Get listings for this state
  const { data: listings, error } = await supabase
    .from('cleaning_listings_merge')
    .select('id, header, price, city, state, cash_flow, revenue, image_url')
    .eq('state', state)
    .not('price', 'is', null)
    .order('price', { ascending: false })
    .limit(50);

  if (error || !listings || listings.length === 0) {
    return { notFound: true };
  }

  // Parse revenue (it's stored as TEXT, might have $ and commas)
  const parseRevenue = (rev: string | null): number | null => {
    if (!rev) return null;
    const cleaned = rev.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // Calculate stats
  const validPrices = listings.filter(l => l.price).map(l => l.price!);
  const validRevenue = listings
    .map(l => parseRevenue(l.revenue))
    .filter((r): r is number => r !== null);
  const cities = Array.from(new Set(listings.filter(l => l.city).map(l => l.city!)));

  const stats: StateStats = {
    total_listings: listings.length,
    avg_price: validPrices.length > 0 
      ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) 
      : 0,
    avg_revenue: validRevenue.length > 0
      ? Math.round(validRevenue.reduce((a, b) => a + b, 0) / validRevenue.length)
      : 0,
    cities: cities.slice(0, 10), // Top 10 cities
  };

  const formattedListings = listings.map(l => ({
    id: l.id,
    title: l.header,
    price: l.price,
    city: l.city,
    state: l.state,
    cash_flow: l.cash_flow,
    revenue: l.revenue,
    image_url: l.image_url,
  }));

  return {
    props: {
      state,
      stateFullName,
      listings: formattedListings,
      stats,
    },
    revalidate: 3600, // Regenerate page every hour
  };
};

export default function StatePage({ state, stateFullName, listings, stats }: StatePageProps) {
  const [priceFilter, setPriceFilter] = useState<string>('all');

  // Filter listings based on price
  const filteredListings = listings.filter(listing => {
    if (priceFilter === 'all') return true;
    if (!listing.price) return false;
    
    const ranges: Record<string, [number, number]> = {
      'under-500k': [0, 500000],
      '500k-1m': [500000, 1000000],
      '1m-plus': [1000000, 999999999],
    };
    
    const [min, max] = ranges[priceFilter] || [0, 999999999];
    return listing.price >= min && listing.price <= max;
  });

  const metaTitle = `${stats.total_listings} Cleaning Businesses for Sale in ${stateFullName} | Cleaning Exits`;
  const metaDescription = `Browse ${stats.total_listings} verified cleaning businesses for sale in ${stateFullName}. Average price ${money(stats.avg_price)}. No franchises. Direct broker connections. SBA financing available.`;

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": metaTitle,
    "description": metaDescription,
    "url": `https://cleaningexits.com/cleaning-businesses-for-sale/${state.toLowerCase()}`,
    "about": {
      "@type": "LocalBusiness",
      "name": "Cleaning Businesses",
      "location": {
        "@type": "State",
        "name": stateFullName
      }
    }
  };

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://cleaningexits.com/cleaning-businesses-for-sale/${state.toLowerCase()}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://cleaningexits.com/cleaning-businesses-for-sale/${state.toLowerCase()}`} />
        
        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              ← Cleaning Exits
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-2">
              <Link href="/cleaning-businesses-for-sale" className="text-emerald-100 hover:text-white">
                All States
              </Link>
              <span className="mx-2 text-emerald-200">/</span>
              <span className="text-white font-semibold">{stateFullName}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Cleaning Businesses for Sale in {stateFullName}
            </h1>
            
            <p className="text-xl text-emerald-50 mb-6">
              {stats.total_listings} verified commercial cleaning businesses available
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-emerald-100 text-sm mb-1">Available</div>
                <div className="text-2xl font-bold">{stats.total_listings}</div>
              </div>
              
              {stats.avg_price > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-emerald-100 text-sm mb-1">Avg Price</div>
                  <div className="text-2xl font-bold">{money(stats.avg_price)}</div>
                </div>
              )}
              
              {stats.avg_revenue > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-emerald-100 text-sm mb-1">Avg Revenue</div>
                  <div className="text-2xl font-bold">{money(stats.avg_revenue)}</div>
                </div>
              )}
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-emerald-100 text-sm mb-1">Cities</div>
                <div className="text-2xl font-bold">{stats.cities.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Cities Navigation */}
          {stats.cities.length > 0 && (
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h2 className="font-bold text-gray-900 mb-4">Browse by City</h2>
              <div className="flex flex-wrap gap-2">
                {stats.cities.map(city => (
                  <Link
                    key={city}
                    href={`/cleaning-businesses-for-sale/${state.toLowerCase()}/${city.toLowerCase().replace(/\s+/g, '-')}`}
                    className="px-4 py-2 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition text-sm font-medium"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-gray-700 font-medium">Price Range:</span>
              <button
                onClick={() => setPriceFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  priceFilter === 'all' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPriceFilter('under-500k')}
                className={`px-4 py-2 rounded-lg transition ${
                  priceFilter === 'under-500k' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Under $500K
              </button>
              <button
                onClick={() => setPriceFilter('500k-1m')}
                className={`px-4 py-2 rounded-lg transition ${
                  priceFilter === '500k-1m' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                $500K - $1M
              </button>
              <button
                onClick={() => setPriceFilter('1m-plus')}
                className={`px-4 py-2 rounded-lg transition ${
                  priceFilter === '1m-plus' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                $1M+
              </button>
              
              <div className="ml-auto text-gray-600">
                Showing {filteredListings.length} of {listings.length}
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="bg-white rounded-lg border hover:border-emerald-500 transition overflow-hidden group"
              >
                {listing.image_url && (
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                    <img 
                      src={listing.image_url} 
                      alt={listing.title || 'Business'}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                )}
                
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition">
                    {listing.title || 'Cleaning Business Opportunity'}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="text-lg font-bold text-gray-900">
                        {listing.price ? money(listing.price) : 'Contact'}
                      </span>
                    </div>
                    
                    {listing.cash_flow && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cash Flow</span>
                        <span className="font-semibold text-emerald-600">
                          {money(listing.cash_flow)}
                        </span>
                      </div>
                    )}
                    
                    {listing.city && (
                      <div className="text-sm text-gray-600">
                        📍 {listing.city}, {listing.state}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-emerald-600 font-semibold group-hover:underline">
                    View Details →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* SEO Content Section */}
          <div className="mt-12 bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Buy a Cleaning Business in {stateFullName}?
            </h2>
            
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                {stateFullName} offers excellent opportunities for entrepreneurs looking to acquire established cleaning businesses. 
                With {stats.total_listings} verified listings currently available, buyers can find commercial cleaning companies 
                across {stats.cities.length} cities throughout the state.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Market Overview</h3>
              <p className="mb-4">
                The cleaning industry in {stateFullName} continues to show strong fundamentals with recurring revenue models 
                and established client relationships. These businesses typically sell for 2-3x annual cash flow (SDE), 
                with SBA financing available for qualified buyers.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Financing Options</h3>
              <p className="mb-4">
                Most cleaning business acquisitions in {stateFullName} qualify for SBA 7(a) loans, allowing buyers to 
                finance up to 90% of the purchase price. With down payments as low as 10%, entrepreneurs can acquire 
                cash-flowing businesses without depleting their capital.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Why Cleaning Exits?</h3>
              <ul className="mb-4 space-y-2">
                <li>✓ Verified cleaning businesses only - no franchises or lead generation schemes</li>
                <li>✓ Direct relationships with 1,500+ business brokers nationwide</li>
                <li>✓ Transparent pricing and valuation analysis for every listing</li>
                <li>✓ Co-brokerage representation at no cost to buyers</li>
                <li>✓ SBA financing connections and acquisition guidance</li>
              </ul>
              
              <p className="mb-4">
                Browse our curated selection of {stats.total_listings} cleaning businesses for sale in {stateFullName}. 
                Each listing includes detailed financial information, valuation analysis, and direct broker contact details.
              </p>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
