// pages/listing/[id].tsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';

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
    .from('listings')
    .select('*')
    .eq('listing_id', id)
    .single();

  if (error || !data) {
    return { notFound: true };
  }

  return {
    props: {
      listing: data,
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

              {/* Additional Details */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Details</h3>
                <dl className="grid grid-cols-2 gap-4">
                  {listing.business_type && (
                    <>
                      <dt className="text-gray-600">Business Type</dt>
                      <dd className="font-semibold text-gray-900">{listing.business_type}</dd>
                    </>
                  )}
                  {listing.category && (
                    <>
                      <dt className="text-gray-600">Category</dt>
                      <dd className="font-semibold text-gray-900">{listing.category}</dd>
                    </>
                  )}
                  {listing.established_year && (
                    <>
                      <dt className="text-gray-600">Established</dt>
                      <dd className="font-semibold text-gray-900">{listing.established_year}</dd>
                    </>
                  )}
                  {listing.employees && (
                    <>
                      <dt className="text-gray-600">Employees</dt>
                      <dd className="font-semibold text-gray-900">{listing.employees}</dd>
                    </>
                  )}
                  {listing.broker_account && (
                    <>
                      <dt className="text-gray-600">Broker</dt>
                      <dd className="font-semibold text-gray-900">#{listing.broker_account}</dd>
                    </>
                  )}
                  {listing.scraped_at && (
                    <>
                      <dt className="text-gray-600">Listed Date</dt>
                      <dd className="font-semibold text-gray-900">
                        {new Date(listing.scraped_at).toLocaleDateString()}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </div>

            {/* Right Column - CTA Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-4">
                
                {/* Verification Badge */}
                {listing.verified_date && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1">
                      <span className="text-xl">✓</span>
                      Verified Listing
                    </div>
                    <div className="text-sm text-emerald-700">
                      Last verified: {new Date(listing.verified_date).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Contact Broker CTA */}
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                  {!showBrokerContact ? (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">
                        Interested in This Business?
                      </h3>
                      <p className="text-sm text-gray-600">
                        Enter your email to view broker contact info and get similar deals.
                      </p>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleEmailCapture()}
                      />
                      <button
                        onClick={handleEmailCapture}
                        disabled={submitting || !email}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Processing...' : 'View Broker Contact →'}
                      </button>
                      <p className="text-xs text-gray-500 text-center">
                        We'll send you the weekly Top 10. Unsubscribe anytime.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 p-4 rounded-lg text-center">
                        <div className="text-emerald-600 font-semibold mb-2">
                          ✓ Email Confirmed
                        </div>
                        <div className="text-sm text-gray-600">
                          Check your inbox for broker details
                        </div>
                      </div>
                      <a
                        href={listing.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
                      >
                        View on Broker Site →
                      </a>
                    </div>
                  )}
                </div>

                {/* Quality Score */}
                {listing.quality_score && (
                  <div className="bg-white p-6 rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-3">Quality Score</h4>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-emerald-600">
                        {listing.quality_score}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${listing.quality_score}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Based on data quality & verification
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Capture CTA */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-lg text-white">
                  <h4 className="font-bold text-lg mb-2">Get Weekly Top 10</h4>
                  <p className="text-sm text-emerald-50 mb-4">
                    10 hand-picked deals every Monday
                  </p>
                  <Link
                    href="/subscribe"
                    className="block w-full bg-white text-emerald-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition text-center"
                  >
                    Subscribe →
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
