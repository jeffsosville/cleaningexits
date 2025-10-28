//pages/listing/[id].tsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import ValuationAnalysis from '../../components/ValuationAnalysis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Listing = {
  id: string;
  listing_id: string;
  title: string | null;
  price: number | null;
  price_text: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  business_type: string | null;
  category: string | null;
  revenue: number | null;
  cash_flow: number | null;
  established_year: number | null;
  employees: number | null;
  listing_url: string;
  image_url: string | null;
  broker_account: string | null;
  why_hot: string | null;
  curator_note: string | null;
  verified_date: string | null;
  quality_score: number | null;
  featured_rank: number | null;
  scraped_at: string | null;
};

const money = (n?: number | null) =>
  n == null ? '—' : n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  const { data, error } = await supabase
    .from('cleaning_listings_merge')
    .select('*')
    .eq('listing_id', id)
    .single();

  if (error || !data) {
    return { notFound: true };
  }

  const listing = {
    id: data.id,
    listing_id: data.id,
    title: data.header,
    price: data.price,
    price_text: null,
    location: data.location,
    city: data.city,
    state: data.state,
    description: data.notes,
    business_type: null,
    category: null,
    revenue: data.revenue,
    cash_flow: data.cash_flow,
    established_year: null,
    employees: null,
    listing_url: data.direct_broker_url || data.url || '#',
    image_url: data.image_url,
    broker_account: data.broker_account,
    why_hot: null,
    curator_note: null,
    verified_date: data.scraped_at,
    quality_score: null,
    featured_rank: null,
    scraped_at: data.scraped_at,
  };

  return {
    props: {
      listing,
    },
  };
};

export default function ListingDetail({ listing }: { listing: Listing }) {
  const [showBrokerContact, setShowBrokerContact] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmailCapture = async () => {
    if (!email || submitting) return;
    
    setSubmitting(true);
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'listing_detail' }),
      });
      setShowBrokerContact(true);
    } catch (error) {
      console.error('Subscription error:', error);
      setShowBrokerContact(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{listing.title || 'Business Listing'} | Cleaning Exits</title>
        <meta name="description" content={listing.description?.substring(0, 160) || 'Commercial cleaning business for sale'} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              ← Back to Cleaning Exits
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Featured Badge */}
              {listing.featured_rank && (
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                  ⭐ Top 10 This Week #{listing.featured_rank}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {listing.title || 'Business Opportunity'}
              </h1>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Price</div>
                  <div className="text-xl font-bold text-gray-900">
                    {listing.price ? money(listing.price) : (listing.price_text || 'Contact')}
                  </div>
                </div>
                
                {listing.cash_flow && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Cash Flow</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {money(listing.cash_flow)}
                    </div>
                  </div>
                )}
                
                {listing.revenue && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Revenue</div>
                    <div className="text-xl font-bold text-gray-900">
                      {money(listing.revenue)}
                    </div>
                  </div>
                )}
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="text-lg font-bold text-gray-900">
                    {listing.city && listing.state ? `${listing.city}, ${listing.state}` : 
                     listing.city || listing.state || listing.location || '—'}
                  </div>
                </div>
              </div>

              {/* Why It's Hot */}
              {listing.why_hot && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔥</div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Why This Is Hot</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {listing.why_hot}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Valuation Analysis - Automated */}
              <ValuationAnalysis listingId={listing.listing_id} />

              {/* Curator's Note */}
              {listing.curator_note && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Curator's Note</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {listing.curator_note}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">About This Business</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {listing.description || 'No description available.'}
                </p>
              </div>

              {/* Additional Business Details */}
              <div className="grid grid-cols-2 gap-4">
                {listing.established_year && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Established</div>
                    <div className="text-lg font-bold text-gray-900">{listing.established_year}</div>
                  </div>
                )}
                
                {listing.employees && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Employees</div>
                    <div className="text-lg font-bold text-gray-900">{listing.employees}</div>
                  </div>
                )}
                
                {listing.business_type && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Business Type</div>
                    <div className="text-lg font-bold text-gray-900">{listing.business_type}</div>
                  </div>
                )}
                
                {listing.category && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Category</div>
                    <div className="text-lg font-bold text-gray-900">{listing.category}</div>
                  </div>
                )}
              </div>

              {/* Broker Info */}
              {listing.broker_account && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Listed By</div>
                  <div className="font-semibold text-gray-900">{listing.broker_account}</div>
                </div>
              )}

              {/* View Original Listing */}
              <div className="flex gap-3">
                <a
                  href={listing.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition"
                >
                  View Original Listing →
                </a>
              </div>
            </div>

            {/* Right Column - CTA Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border p-6 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-4">Interested in this business?</h3>
                
                {!showBrokerContact ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Get broker contact details and receive updates on similar listings.
                    </p>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleEmailCapture}
                      disabled={submitting || !email}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : 'Get Broker Details'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      We'll never spam you. Unsubscribe anytime.
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-emerald-900 mb-2">✓ Contact Information</h4>
                    <p className="text-sm text-emerald-800 mb-3">
                      Check your email for broker details and next steps.
                    </p>
                    <a
                      href={listing.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition"
                    >
                      View on Broker Site
                    </a>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">Why Cleaning Exits?</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>Verified cleaning businesses only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>No franchises or lead-gen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>Direct broker relationships</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>Automated valuation analysis</span>
                    </li>
                  </ul>
                </div>

                {listing.verified_date && (
                  <div className="mt-6 pt-6 border-t text-xs text-gray-500">
                    Verified on {new Date(listing.verified_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
