// pages/cleaning-businesses-for-sale/[state]/[city].tsx
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
  location: string | null;
};

type CityPageProps = {
  state: string;
  stateFullName: string;
  city: string;
  cityFormatted: string;
  listings: Listing[];
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

const formatCityName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const slugifyCity = (city: string): string => {
  return city.toLowerCase().replace(/\s+/g, '-');
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Get all unique state/city combinations
  const { data: locations } = await supabase
    .from('cleaning_listings_merge')
    .select('state, city')
    .not('state', 'is', null)
    .not('city', 'is', null);

  if (!locations) return { paths: [], fallback: 'blocking' };

  // Create unique state/city pairs
  const uniquePairs = new Map<string, Set<string>>();
  
  locations.forEach(loc => {
    if (!uniquePairs.has(loc.state)) {
      uniquePairs.set(loc.state, new Set());
    }
    uniquePairs.get(loc.state)?.add(loc.city);
  });

  const paths: Array<{ params: { state: string; city: string } }> = [];
  
  uniquePairs.forEach((cities, state) => {
    cities.forEach(city => {
      paths.push({
        params: {
          state: state.toLowerCase(),
          city: slugifyCity(city)
        }
      });
    });
  });

  return {
    paths: paths.slice(0, 100), // Pre-generate top 100 cities, rest on-demand
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<CityPageProps> = async (context) => {
  const stateParam = (context.params?.state as string).toUpperCase();
  const citySlug = context.params?.city as string;
  const cityFormatted = formatCityName(citySlug);
  
  const stateFullName = STATE_NAMES[stateParam] || stateParam;

  // Query database - try to match city name flexibly
  const { data: listings, error } = await supabase
    .from('cleaning_listings_merge')
    .select('id, header, price, city, state, cash_flow, revenue, image_url, location')
    .eq('state', stateParam)
    .ilike('city', cityFormatted)
    .order('price', { ascending: false });

  if (error || !listings || listings.length === 0) {
    return { notFound: true };
  }

  const formattedListings = listings.map(l => ({
    id: l.id,
    title: l.header,
    price: l.price,
    city: l.city,
    state: l.state,
    cash_flow: l.cash_flow,
    revenue: l.revenue,
    image_url: l.image_url,
    location: l.location,
  }));

  return {
    props: {
      state: stateParam,
      stateFullName,
      city: cityFormatted,
      cityFormatted,
      listings: formattedListings,
    },
    revalidate: 3600,
  };
};

export default function CityPage({ state, stateFullName, city, listings }: CityPageProps) {
  const avgPrice = listings
    .filter(l => l.price)
    .reduce((sum, l) => sum + (l.price || 0), 0) / listings.filter(l => l.price).length;

  const metaTitle = `${listings.length} Cleaning Businesses for Sale in ${city}, ${state} | Cleaning Exits`;
  const metaDescription = `Buy an established cleaning business in ${city}, ${stateFullName}. ${listings.length} verified listings. Average price ${money(avgPrice)}. SBA financing available. No franchises.`;

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": metaTitle,
    "description": metaDescription,
    "numberOfItems": listings.length,
    "itemListElement": listings.slice(0, 10).map((listing, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": listing.title || "Cleaning Business",
        "offers": listing.price ? {
          "@type": "Offer",
          "price": listing.price,
          "priceCurrency": "USD"
        } : undefined
      }
    }))
  };

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://cleaningexits.com/cleaning-businesses-for-sale/${state.toLowerCase()}/${slugifyCity(city)}`} />
        
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        
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
            <div className="mb-2 text-sm">
              <Link href="/cleaning-businesses-for-sale" className="text-emerald-100 hover:text-white">
                All States
              </Link>
              <span className="mx-2 text-emerald-200">/</span>
              <Link 
                href={`/cleaning-businesses-for-sale/${state.toLowerCase()}`}
                className="text-emerald-100 hover:text-white"
              >
                {stateFullName}
              </Link>
              <span className="mx-2 text-emerald-200">/</span>
              <span className="text-white font-semibold">{city}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Cleaning Businesses for Sale in {city}, {state}
            </h1>
            
            <p className="text-xl text-emerald-50 mb-6">
              {listings.length} verified commercial cleaning {listings.length === 1 ? 'business' : 'businesses'} available now
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-emerald-100 text-sm mb-1">Available</div>
                <div className="text-2xl font-bold">{listings.length}</div>
              </div>
              
              {avgPrice > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-emerald-100 text-sm mb-1">Avg Price</div>
                  <div className="text-2xl font-bold">{money(avgPrice)}</div>
                </div>
              )}
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-emerald-100 text-sm mb-1">Financing</div>
                <div className="text-lg font-bold">90% SBA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Listings Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {listings.map(listing => (
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
                    
                    {listing.revenue && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Revenue</span>
                        <span className="text-gray-700">
                          {money(parseRevenue(listing.revenue))}
                        </span>
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

          {/* SEO Content */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Buying a Cleaning Business in {city}, {stateFullName}
            </h2>
            
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                {city} has {listings.length} verified cleaning {listings.length === 1 ? 'business' : 'businesses'} currently 
                available for acquisition. These established operations offer recurring revenue, trained teams, and proven 
                systems that new startups take years to develop.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Why Buy Instead of Start?</h3>
              <p className="mb-4">
                Acquiring an existing cleaning business in {city} eliminates the 2-3 year ramp-up period required for startups. 
                You're buying existing contracts, equipment, employees, and most importantly - cash flow from day one. The seller 
                has already solved the hardest problems: finding clients, hiring reliable staff, and building operational systems.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Typical Valuation Multiples</h3>
              <p className="mb-4">
                Commercial cleaning businesses in {city} typically sell for 2.0-3.5x annual Seller's Discretionary Earnings (SDE). 
                This multiple varies based on client concentration, contract terms, employee retention, and growth trajectory. 
                Businesses with long-term commercial contracts and recurring revenue command premium valuations.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">SBA Financing for {city} Businesses</h3>
              <p className="mb-4">
                Most cleaning business acquisitions in {city} qualify for SBA 7(a) loans, which allow up to 90% financing. 
                This means qualified buyers can acquire a cash-flowing business with as little as 10% down. We connect buyers 
                with SBA-preferred lenders who specialize in cleaning industry acquisitions.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Our Co-Brokerage Advantage</h3>
              <p className="mb-4">
                Unlike traditional marketplaces, Cleaning Exits operates as a co-broker, representing YOUR interests throughout 
                the acquisition process at no cost to you. We provide transparent valuation analysis, connect you directly with 
                listing brokers, and guide you through due diligence and closing.
              </p>
              
              <p className="mb-4 font-semibold text-gray-900">
                Ready to explore cleaning businesses for sale in {city}? Browse our verified listings above or contact us 
                to discuss your acquisition criteria.
              </p>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
