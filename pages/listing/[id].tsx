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
  deep_dive_html: string | null;
};

const money = (n?: number | null) =>
  n == null ? '—' : n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

// Sanitize deep_dive_html to remove sections we don't want
const sanitizeDeepDiveHtml = (html: string | null): string | null => {
  if (!html) return null;
  
  // Remove "Ready to Move on This Deal?" section with buttons
  let sanitized = html.replace(
    /<h[23][^>]*>Ready to Move on This Deal\?<\/h[23]>[\s\S]*?(?=<h[23]|<div class="bg-white|$)/i,
    ''
  );
  
  // Remove "About This Business" section (we show it separately)
  sanitized = sanitized.replace(
    /<h[23][^>]*>About This Business<\/h[23]>[\s\S]*?(?=<h[23]|<div class="bg-white|$)/i,
    ''
  );
  
  // Remove any "View Full Listing" or "Need SBA Financing" buttons
  sanitized = sanitized.replace(
    /<a[^>]*>View Full Listing[^<]*<\/a>/gi,
    ''
  );
  sanitized = sanitized.replace(
    /<button[^>]*>View Full Listing[^<]*<\/button>/gi,
    ''
  );
  sanitized = sanitized.replace(
    /<a[^>]*>Need SBA Financing\?<\/a>/gi,
    ''
  );
  
  // Remove "View on Broker Site" links
  sanitized = sanitized.replace(
    /<a[^>]*>View on Broker Site<\/a>/gi,
    ''
  );
  
  return sanitized.trim();
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  console.log('Query ID:', id);
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Has anon key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { count } = await supabase
    .from('cleaning_listings_merge')
    .select('*', { count: 'exact', head: true });
  
  console.log('Total rows in table:', count);

  const { data, error } = await supabase
    .from('cleaning_listings_merge')
    .select('*')
    .eq('id', id)
    .single();

  console.log('Error:', error);
  console.log('Data:', data);

  if (error || !data) {
    console.log('Returning 404');
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
    deep_dive_html: data.deep_dive_html,
  };

  return {
    props: {
      listing,
    },
  };
};

export default function ListingDetail({ listing }: { listing: Listing }) {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Show phone field for high-value listings
  const isHighValue = listing.price && listing.price >= 1000000;

  // Generate Schema.org structured data for SEO
  const generateListingSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": listing.title || "Commercial Cleaning Business",
      "description": listing.description?.substring(0, 500) || "Established commercial cleaning business for sale",
      "image": listing.image_url,
      "offers": {
        "@type": "Offer",
        "price": listing.price,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": listing.broker_account || "Cleaning Exits"
        }
      },
      "brand": {
        "@type": "Brand",
        "name": "Cleaning Exits"
      },
      "additionalProperty": [
        listing.revenue ? {
          "@type": "PropertyValue",
          "name": "Revenue",
          "value": listing.revenue
        } : null,
        listing.cash_flow ? {
          "@type": "PropertyValue", 
          "name": "Cash Flow (SDE)",
          "value": listing.cash_flow
        } : null
      ].filter(Boolean),
      "locationCreated": listing.city && listing.state ? {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": listing.city,
          "addressRegion": listing.state,
          "addressCountry": "US"
        }
      } : undefined
    };
  };

  const handleEmailCapture = async () => {
    if (!email || submitting) {
      setError('Please enter a valid email address');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          phone: phone || null,
          listing_id: listing.id,
          source: 'listing_detail',
          listing_price: listing.price,
          listing_title: listing.title,
          listing_location: `${listing.city}, ${listing.state}`
        }),
      });

      if (!response.ok) throw new Error('Submission failed');
      
      setShowFullDetails(true);
    } catch (error) {
      console.error('Lead capture error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{listing.title || 'Business Listing'} | Cleaning Exits</title>
        <meta name="description" content={listing.description?.substring(0, 160) || 'Commercial cleaning business for sale'} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://cleaningexits.com/listing/${listing.id}`} />
        
        {/* Schema.org Structured Data */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(generateListingSchema()) 
          }}
        />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={listing.title || 'Business Listing'} />
        <meta property="og:description" content={listing.description?.substring(0, 160)} />
        <meta property="og:image" content={listing.image_url || 'https://cleaningexits.com/og-default.jpg'} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://cleaningexits.com/listing/${listing.id}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={listing.title || 'Business Listing'} />
        <meta name="twitter:description" content={listing.description?.substring(0, 160)} />
        <meta name="twitter:image" content={listing.image_url || 'https://cleaningexits.com/og-default.jpg'} />
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
                    <div className="text-sm text-gray-600">Cash Flow (SDE)</div>
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

              {/* Competitive Advantages */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold text-gray-900 mb-4 text-xl">Competitive Advantages</h3>
                <p className="text-gray-600 mb-4">What makes this business defensible:</p>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-900">Established operations</span>
                    <span className="text-gray-600"> - Not a startup, proven revenue model</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Recurring revenue</span>
                    <span className="text-gray-600"> - Cleaning contracts provide predictable cash flow</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Barrier to entry</span>
                    <span className="text-gray-600"> - Building a client base takes years</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Asset-light model</span>
                    <span className="text-gray-600"> - Low overhead, high cash conversion</span>
                  </div>
                </div>
              </div>

              
              {/* Deep Dive Analysis - Top 10 Only */}
              {listing.deep_dive_html && (
                <div 
                  dangerouslySetInnerHTML={{ __html: sanitizeDeepDiveHtml(listing.deep_dive_html) || '' }}
                  className="deep-dive-container"
                />
              )}

              {/* Gated Content - Show gate or unlocked content */}
              {!showFullDetails ? (
                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-lg p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Get Complete Financial Details
                    </h3>
                    <p className="text-gray-700 mb-6">
                      This listing won't last long. Access the full analysis, broker contact, and investment breakdown.
                    </p>
                    <div className="bg-white rounded-lg p-6 mb-4">
                      <div className="text-left space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600 text-xl">✓</span>
                          <span className="text-gray-700">Complete financial statements</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600 text-xl">✓</span>
                          <span className="text-gray-700">Direct broker contact info</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600 text-xl">✓</span>
                          <span className="text-gray-700">Detailed valuation & ROI analysis</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600 text-xl">✓</span>
                          <span className="text-gray-700">Key due diligence questions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Additional Business Details - After unlock */}
                  {(listing.established_year || listing.employees || listing.business_type || listing.category) && (
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="font-bold text-gray-900 mb-4 text-lg">Additional Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {listing.established_year && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Established</div>
                            <div className="text-lg font-bold text-gray-900">{listing.established_year}</div>
                          </div>
                        )}
                        
                        {listing.employees && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Employees</div>
                            <div className="text-lg font-bold text-gray-900">{listing.employees}</div>
                          </div>
                        )}
                        
                        {listing.business_type && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Business Type</div>
                            <div className="text-lg font-bold text-gray-900">{listing.business_type}</div>
                          </div>
                        )}
                        
                        {listing.category && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Category</div>
                            <div className="text-lg font-bold text-gray-900">{listing.category}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Broker Contact - After unlock */}
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                    <h3 className="font-bold text-emerald-900 mb-2 text-lg">✓ Contact Information Sent</h3>
                    <p className="text-emerald-800 mb-4">
                      Check your email for complete broker details, owner contact info, and your personalized investment analysis.
                    </p>
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-600 mb-2">Listed through our broker network</div>
                      {listing.broker_account && (
                        <div className="font-semibold text-gray-900">{listing.broker_account}</div>
                      )}
                    </div>
                    <p className="text-sm text-emerald-800">
                      <strong>Next steps:</strong> We represent YOUR interests as co-broker at no cost to you. Our team will follow up within 24 hours to discuss this opportunity.
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 italic">
                      Disclaimer: This analysis is for informational purposes only and does not constitute investment advice. All numbers are based on publicly available listing information and should be verified during due diligence. Always consult with legal, financial, and tax professionals before making any business acquisition decision.
                    </p>
                  </div>
                </div>
              )}

              {listing.verified_date && (
                <div className="text-sm text-gray-500 text-center">
                  Verified on {new Date(listing.verified_date).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Right Column - CTA Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border-2 border-emerald-200 p-6 sticky top-6">
                {!showFullDetails ? (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-xl">Get Full Details + Financial Analysis</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This listing won't last long. Here's how to take action:
                    </p>
                    
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3 mb-4">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                      
                      {isHighValue && (
                        <input
                          type="tel"
                          placeholder="Phone (optional)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </div>

                    <button
                      onClick={handleEmailCapture}
                      disabled={submitting || !email}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-3 text-lg"
                    >
                      {submitting ? 'Processing...' : 'Get Full Details →'}
                    </button>

                    <div className="border-t border-gray-200 pt-3 mb-3">
                      <a
                        href="#"
                        className="block w-full text-center bg-white hover:bg-gray-50 text-emerald-700 font-semibold py-3 px-6 rounded-lg border-2 border-emerald-600 transition"
                      >
                        Schedule 15-Min Call
                      </a>
                    </div>

                    {/* SBA Financing Teaser */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <h5 className="font-semibold text-blue-900 mb-2 text-sm">Need SBA Financing?</h5>
                      <p className="text-xs text-blue-800 mb-2">
                        90% financing available with 10% down. We connect you with specialized lenders.
                      </p>
                      <div className="text-xs text-blue-700">
                        • Est. monthly payment: ~{listing.price && listing.cash_flow ? `$${Math.round((listing.price * 0.9 * (0.08/12) * Math.pow(1 + 0.08/12, 120)) / (Math.pow(1 + 0.08/12, 120) - 1)).toLocaleString()}` : 'TBD'}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center">
                      We'll never spam you. Unsubscribe anytime.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-emerald-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-emerald-900 mb-2">✓ Details Sent!</h4>
                      <p className="text-sm text-emerald-800">
                        Check your email for complete financial information and next steps.
                      </p>
                    </div>
                    
                    <a
                      href="#"
                      className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition mb-3"
                    >
                      Schedule Strategy Call
                    </a>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-semibold text-blue-900 mb-2 text-sm">Need SBA Financing?</h5>
                      <p className="text-xs text-blue-800 mb-3">
                        We partner with lenders who specialize in cleaning business acquisitions.
                      </p>
                      <a
                        href="#"
                        className="text-blue-700 font-semibold text-sm hover:text-blue-800"
                      >
                        Learn More →
                      </a>
                    </div>
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
