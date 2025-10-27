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
  source: string;
  title: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  cash_flow: number | null;
  revenue: number | null;
  ebitda: number | null;
  description: string | null;
  listing_url: string | null;
  direct_broker_url: string | null;
  broker_account: string | null;
  contact_name: string | null;
  contact_phone: string | null;
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
    .eq('id', id)
    .single();

  if (error || !data) {
    return { notFound: true };
  }

  const listing = {
    id: data.id,
    source: data.source,
    title: data.header,
    location: data.location,
    city: data.city,
    state: data.state,
    price: data.price,
    cash_flow: data.cash_flow,
    revenue: data.revenue,
    ebitda: data.ebitda,
    description: data.notes,
    listing_url: data.url,
    direct_broker_url: data.direct_broker_url,
    broker_account: data.broker_account,
    contact_name: data.contact_name,
    contact_phone: data.contact_phone,
    scraped_at: data.scraped_at,
  };

  return { props: { listing } };
};

function ListingDetail({ listing }: { listing: Listing }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = () => {
    if (email) {
      setSubmitted(true);
    }
  };

  const calculateMultiple = () => {
    if (!listing.price || !listing.revenue) return null;
    return (listing.price / listing.revenue).toFixed(2);
  };

  const calculateROI = () => {
    if (!listing.cash_flow || !listing.price) return null;
    return ((listing.cash_flow / listing.price) * 100).toFixed(1);
  };

  const multiple = calculateMultiple();
  const roi = calculateROI();

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{listing.title || 'Cleaning Business'} | Cleaning Exits</title>
      </Head>

      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
            ← Back to Cleaning Exits
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
              listing.source === 'direct_scraped' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {listing.source === 'direct_scraped' ? '🎯 Direct Broker' : '📊 BizBuySell'}
            </span>

            <h1 className="text-4xl font-bold text-gray-900">
              {listing.title || 'Commercial Cleaning Business'}
            </h1>

            {(listing.location || listing.city || listing.state) && (
              <div className="text-lg text-gray-600">
                📍 {listing.location || `${listing.city || ''}${listing.city && listing.state ? ', ' : ''}${listing.state || ''}`}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600">Price</div>
                <div className="text-xl font-bold">{money(listing.price)}</div>
              </div>
              {listing.cash_flow && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Cash Flow</div>
                  <div className="text-xl font-bold text-emerald-600">{money(listing.cash_flow)}</div>
                </div>
              )}
              {listing.revenue && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Revenue</div>
                  <div className="text-xl font-bold">{money(listing.revenue)}</div>
                </div>
              )}
              {multiple && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Multiple</div>
                  <div className="text-xl font-bold text-orange-600">{multiple}x</div>
                </div>
              )}
            </div>

            {(roi || listing.ebitda) && (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4">📊 Investment Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  {roi && (
                    <div>
                      <div className="text-sm text-gray-600">Cash-on-Cash ROI</div>
                      <div className="text-2xl font-bold text-emerald-600">{roi}%</div>
                    </div>
                  )}
                  {listing.ebitda && (
                    <div>
                      <div className="text-sm text-gray-600">EBITDA</div>
                      <div className="text-2xl font-bold">{money(listing.ebitda)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-bold text-lg mb-4">About This Business</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description || 'Contact broker for details.'}
              </p>
            </div>

            {(listing.contact_name || listing.broker_account) && (
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-3">Broker Information</h3>
                <div className="space-y-2">
                  {listing.contact_name && (
                    <div>
                      <span className="font-semibold">Contact:</span> {listing.contact_name}
                    </div>
                  )}
                  {listing.contact_phone && (
                    <div>
                      <span className="font-semibold">Phone:</span> {listing.contact_phone}
                    </div>
                  )}
                  {listing.broker_account && (
                    <div>
                      <span className="font-semibold">Broker:</span> {listing.broker_account}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {(listing.direct_broker_url || listing.listing_url) && (
                
                  href={listing.direct_broker_url || listing.listing_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg text-center"
                >
                  View on Broker Site →
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-6">
              <h3 className="font-bold mb-4">Interested?</h3>
              
              {!submitted ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Get updates on similar listings.
                  </p>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={!email}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                  >
                    Subscribe
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-emerald-800">✓ Subscribed!</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t text-sm text-gray-600">
                <h4 className="font-semibold text-gray-900 mb-2">Why Cleaning Exits?</h4>
                <ul className="space-y-2">
                  <li>✓ Verified businesses only</li>
                  <li>✓ No franchises</li>
                  <li>✓ Direct broker links</li>
                  <li>✓ Quality ranked</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ListingDetail;
