// pages/cleaning-businesses-for-sale/index.tsx
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

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

type StateData = {
  state: string;
  count: number;
};

type AllStatesProps = {
  states: StateData[];
  totalListings: number;
};

export const getStaticProps: GetStaticProps<AllStatesProps> = async () => {
  // Get counts by state - only states with listings
  const { data: listings } = await supabase
    .from('cleaning_listings_merge')
    .select('state')
    .not('state', 'is', null)
    .not('price', 'is', null); // Only count listings with prices

  if (!listings) {
    return {
      props: {
        states: [],
        totalListings: 0,
      },
      revalidate: 3600,
    };
  }

  // Count listings per state
  const stateCounts = listings.reduce((acc, listing) => {
    acc[listing.state] = (acc[listing.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const states = Object.entries(stateCounts)
    .map(([state, count]) => ({
      state,
      count,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  return {
    props: {
      states,
      totalListings: listings.length,
    },
    revalidate: 3600,
  };
};

export default function AllStatesPage({ states, totalListings }: AllStatesProps) {
  const metaTitle = 'Cleaning Businesses for Sale by State | Cleaning Exits';
  const metaDescription = `Browse ${totalListings.toLocaleString()} verified cleaning businesses for sale across ${states.length} states. No franchises. Direct broker connections. SBA financing available.`;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href="https://cleaningexits.com/cleaning-businesses-for-sale" />
        
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cleaningexits.com/cleaning-businesses-for-sale" />
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
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Cleaning Businesses for Sale by State
            </h1>
            <p className="text-xl text-emerald-50 mb-8">
              {totalListings.toLocaleString()} verified commercial cleaning businesses across {states.length} states
            </p>
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalListings.toLocaleString()}</div>
                <div className="text-sm text-emerald-100">Total Listings</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">{states.length}</div>
                <div className="text-sm text-emerald-100">States</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">90%</div>
                <div className="text-sm text-emerald-100">SBA Financing</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          
          {/* States Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by State</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {states.map(({ state, count }) => (
                <Link
                  key={state}
                  href={`/cleaning-businesses-for-sale/${state.toLowerCase()}`}
                  className="bg-white border-2 hover:border-emerald-500 rounded-lg p-5 transition group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600">
                      {STATE_NAMES[state] || state}
                    </h3>
                    <span className="text-2xl">→</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {count} {count === 1 ? 'listing' : 'listings'} available
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* SEO Content */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Why Buy a Cleaning Business?
            </h2>
            
            <div className="prose max-w-none text-gray-700">
              <p className="text-lg mb-6">
                The commercial cleaning industry offers one of the most stable, recession-resistant business models available. 
                With {totalListings.toLocaleString()} verified listings across the United States, Cleaning Exits provides the 
                largest transparent marketplace for cleaning business acquisitions.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Industry Fundamentals</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Recurring revenue model with long-term contracts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Asset-light operations with high cash conversion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Recession-resistant demand across all economic cycles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Multiple expansion opportunities in every market</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Acquisition Advantages</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Immediate cash flow from day one of ownership</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Trained employees and established operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Proven client base that took years to build</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>SBA 7(a) financing up to 90% of purchase price</span>
                    </li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">Typical Valuation Multiples</h3>
              <p className="mb-4">
                Commercial cleaning businesses typically sell for 2.0-3.5x annual Seller's Discretionary Earnings (SDE), 
                depending on factors like client concentration, contract terms, and growth trajectory. Businesses with 
                long-term contracts, diversified client bases, and strong employee retention command premium valuations.
              </p>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">SBA Financing Available</h3>
              <p className="mb-4">
                Most cleaning business acquisitions qualify for SBA 7(a) loans, which offer up to 90% financing with 
                10-year terms. This allows qualified buyers to acquire cash-flowing businesses with minimal down payment, 
                preserving capital for working capital and growth initiatives. We connect buyers with SBA-preferred lenders 
                who specialize in cleaning industry acquisitions.
              </p>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">The Cleaning Exits Advantage</h3>
              <p className="mb-4">
                Unlike traditional business-for-sale marketplaces, Cleaning Exits operates as a co-broker, representing 
                buyer interests throughout the acquisition process. We provide:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Transparent valuation analysis for every listing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Direct relationships with 1,500+ business brokers nationwide</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>No franchises, MLMs, or lead generation schemes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Verified listings with real financial data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Co-brokerage representation at no cost to buyers</span>
                </li>
              </ul>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6 mt-8">
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Ready to Find Your Next Business?</h3>
                <p className="text-emerald-800 mb-4">
                  Browse our verified listings by state above, or contact us to discuss your specific acquisition criteria. 
                  Our team specializes in matching buyers with the right opportunities and guiding them through the entire 
                  acquisition process.
                </p>
                <Link 
                  href="/#subscribe"
                  className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg transition"
                >
                  Get Started →
                </Link>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
