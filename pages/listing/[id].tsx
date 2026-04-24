// pages/listing/[id].tsx
// FIX: Three-tier lookup so listings clicked from /cleaning-index resolve.
//   1. top_10_commercial_cleaning  (slug IDs like "top10-2024-001") — local CleaningExits Supabase
//   2. cleaning_listings_merge     (UUID IDs)                       — local CleaningExits Supabase
//   3. DealLedger `listings`       (numeric bigserial IDs)          — DealLedger Supabase  ← NEW
//
// Previously: listings shown on /cleaning-index came from DealLedger but the detail
// page only looked in local tables, so most clicks 404'd. This adds DealLedger as a
// final fallback. Surfaces the new fields too: relisted, days_on_market, listing_views,
// quality_tier, direct_broker_url, estimated_listed_date.

import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import ValuationAnalysis from '../../components/ValuationAnalysis';

// Local CleaningExits Supabase (top10 + merge tables)
const supabaseLocal = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// DealLedger Supabase (canonical listings)
const supabaseDealLedger = createClient(
  process.env.DEALLEDGER_SUPABASE_URL as string,
  process.env.DEALLEDGER_SUPABASE_SERVICE_KEY as string
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
  quality_tier: string | null;
  featured_rank: number | null;
  scraped_at: string | null;
  deep_dive_html: string | null;

  // DealLedger-only enrichment
  days_on_market: number | null;
  listing_views: number | null;
  estimated_listed_date: string | null;
  first_seen: string | null;
  price_reduced: boolean;
  relisted: boolean;
  direct_broker_url: string | null;
};

const money = (n?: number | null) =>
  n == null ? '—' : n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const fmtDate = (d: string | null) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return null; }
};

const sanitizeDeepDiveHtml = (html: string | null): string | null => {
  if (!html) return null;
  let sanitized = html.replace(
    /<h[23][^>]*>Ready to Move on This Deal\?<\/h[23]>[\s\S]*?(?=<h[23]|<div class="bg-white|$)/i,
    ''
  );
  sanitized = sanitized.replace(
    /<h[23][^>]*>About This Business<\/h[23]>[\s\S]*?(?=<h[23]|<div class="bg-white|$)/i,
    ''
  );
  sanitized = sanitized.replace(/<a[^>]*>View Full Listing[^<]*<\/a>/gi, '');
  sanitized = sanitized.replace(/<button[^>]*>View Full Listing[^<]*<\/button>/gi, '');
  sanitized = sanitized.replace(/<a[^>]*>Need SBA Financing\?<\/a>/gi, '');
  sanitized = sanitized.replace(/<a[^>]*>View on Broker Site<\/a>/gi, '');
  return sanitized.trim();
};

// Empty skeleton so we don't have to scatter `?? null` everywhere when assembling.
const emptyListing = (): Listing => ({
  id: '', listing_id: '', title: null, price: null, price_text: null,
  location: null, city: null, state: null, description: null,
  business_type: null, category: null, revenue: null, cash_flow: null,
  established_year: null, employees: null, listing_url: '#', image_url: null,
  broker_account: null, why_hot: null, curator_note: null, verified_date: null,
  quality_score: null, quality_tier: null, featured_rank: null, scraped_at: null,
  deep_dive_html: null, days_on_market: null, listing_views: null,
  estimated_listed_date: null, first_seen: null, price_reduced: false,
  relisted: false, direct_broker_url: null,
});

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  let listing: Listing | null = null;

  // ─── 1. Top 10 (local) — slug IDs like "top10-2024-001" ────────────────────
  const { data: top10Data } = await supabaseLocal
    .from('top_10_commercial_cleaning')
    .select('*')
    .eq('listing_id', id)
    .maybeSingle();

  if (top10Data) {
    listing = {
      ...emptyListing(),
      id: top10Data.listing_id,
      listing_id: top10Data.listing_id,
      title: top10Data.title,
      price: top10Data.price,
      location: top10Data.location,
      city: top10Data.city,
      state: top10Data.state,
      description: top10Data.description,
      revenue: top10Data.revenue,
      cash_flow: top10Data.cash_flow,
      listing_url: top10Data.listing_url || '#',
      image_url: top10Data.image_url,
      broker_account: top10Data.broker_account,
      verified_date: top10Data.scraped_at,
      featured_rank: top10Data.rank,
      scraped_at: top10Data.scraped_at,
    };
  }

  // ─── 2. Merge table (local) — UUID IDs ─────────────────────────────────────
  if (!listing) {
    const { data: mergeData } = await supabaseLocal
      .from('cleaning_listings_merge')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (mergeData) {
      listing = {
        ...emptyListing(),
        id: mergeData.id,
        listing_id: mergeData.id,
        title: mergeData.header,
        price: mergeData.price,
        location: mergeData.location,
        city: mergeData.city,
        state: mergeData.state,
        description: mergeData.notes,
        revenue: mergeData.revenue,
        cash_flow: mergeData.cash_flow,
        listing_url: mergeData.url || mergeData.direct_broker_url || '#',
        image_url: mergeData.image_url,
        broker_account: mergeData.broker_account,
        verified_date: mergeData.scraped_at,
        scraped_at: mergeData.scraped_at,
        deep_dive_html: mergeData.deep_dive_html,
      };
    }
  }

  // ─── 3. DealLedger (canonical) — numeric bigserial IDs ─────────────────────
  if (!listing) {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      const { data: dlData } = await supabaseDealLedger
        .from('listings')
        .select(`id, listing_number, header, price, cash_flow, state, city, category,
                 days_on_market, listing_views, estimated_listed_date, first_seen,
                 url, broker_account, contact_name, contact_phone,
                 price_reduced, relisted, direct_broker_url,
                 quality_score, quality_tier, raw_json, created_at`)
        .eq('id', numericId)
        .maybeSingle();

      if (dlData) {
        // Pull a description out of raw_json if available; otherwise leave null.
        const rawDescription = dlData.raw_json?.description
          ?? dlData.raw_json?.business_description
          ?? null;

        listing = {
          ...emptyListing(),
          id: String(dlData.id),
          listing_id: String(dlData.id),
          title: dlData.header,
          price: dlData.price,
          city: dlData.city,
          state: dlData.state,
          location: [dlData.city, dlData.state].filter(Boolean).join(', ') || null,
          description: rawDescription,
          category: dlData.category,
          cash_flow: dlData.cash_flow,
          listing_url: dlData.direct_broker_url || dlData.url || '#',
          broker_account: dlData.broker_account,
          verified_date: dlData.created_at,
          scraped_at: dlData.created_at,
          quality_score: dlData.quality_score,
          quality_tier: dlData.quality_tier,
          days_on_market: dlData.days_on_market,
          listing_views: dlData.listing_views,
          estimated_listed_date: dlData.estimated_listed_date,
          first_seen: dlData.first_seen,
          price_reduced: !!dlData.price_reduced,
          relisted: !!dlData.relisted,
          direct_broker_url: dlData.direct_broker_url,
        };
      }
    }
  }

  if (!listing) return { notFound: true };
  return { props: { listing } };
};

export default function ListingDetail({ listing }: { listing: Listing }) {
  const generateListingSchema = () => {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": listing.title || "Cleaning Business",
      "description": listing.description?.substring(0, 500) || "Established cleaning business for sale",
      "offers": {
        "@type": "Offer",
        "price": listing.price,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "seller": { "@type": "Organization", "name": listing.broker_account || "Cleaning Exits" }
      },
      "brand": { "@type": "Brand", "name": "Cleaning Exits" }
    };
    if (listing.image_url) schema.image = listing.image_url;
    const additionalProperties = [
      listing.revenue ? { "@type": "PropertyValue", "name": "Revenue", "value": listing.revenue } : null,
      listing.cash_flow ? { "@type": "PropertyValue", "name": "Cash Flow (SDE)", "value": listing.cash_flow } : null
    ].filter(Boolean);
    if (additionalProperties.length > 0) schema.additionalProperty = additionalProperties;
    if (listing.city && listing.state) {
      schema.locationCreated = {
        "@type": "Place",
        "address": { "@type": "PostalAddress", "addressLocality": listing.city, "addressRegion": listing.state, "addressCountry": "US" }
      };
    }
    return schema;
  };

  const listedDate = fmtDate(listing.estimated_listed_date) ?? fmtDate(listing.first_seen);

  return (
    <>
      <Head>
        <title>{listing.title || 'Business Listing'} | Cleaning Exits</title>
        <meta name="description" content={listing.description?.substring(0, 160) || 'Cleaning business for sale'} />
        <link rel="canonical" href={`https://cleaningexits.com/listing/${listing.id}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateListingSchema()) }} />
        <meta property="og:title" content={listing.title || 'Business Listing'} />
        <meta property="og:description" content={listing.description?.substring(0, 160) || ''} />
        <meta property="og:image" content={listing.image_url || 'https://cleaningexits.com/og-default.jpg'} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://cleaningexits.com/listing/${listing.id}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={listing.title || 'Business Listing'} />
        <meta name="twitter:description" content={listing.description?.substring(0, 160) || ''} />
        <meta name="twitter:image" content={listing.image_url || 'https://cleaningexits.com/og-default.jpg'} />
      </Head>

      <div className="min-h-screen bg-gray-50">
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

              {/* Status badges row (above title) */}
              <div className="flex flex-wrap items-center gap-2">
                {listing.featured_rank && (
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ⭐ Top 10 This Week #{listing.featured_rank}
                  </div>
                )}
                {listing.quality_tier === 'Verified' && (
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ Verified
                  </div>
                )}
                {listing.relisted && (
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Relisted
                  </div>
                )}
                {listing.price_reduced && (
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Price Reduced
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {listing.title || 'Business Opportunity'}
              </h1>

              {/* Headline numbers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Price</div>
                  <div className="text-xl font-bold text-gray-900">
                    {listing.price ? money(listing.price) : (listing.price_text || 'Contact')}
                  </div>
                </div>
                {listing.cash_flow != null && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Cash Flow (SDE)</div>
                    <div className="text-xl font-bold text-emerald-600">{money(listing.cash_flow)}</div>
                  </div>
                )}
                {listing.revenue != null && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Revenue</div>
                    <div className="text-xl font-bold text-gray-900">{money(listing.revenue)}</div>
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

              {/* DealLedger market intelligence — the wedge */}
              {(listing.days_on_market != null || listing.listing_views != null || listedDate) && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Market Intelligence</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {listing.days_on_market != null && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Days on Market</div>
                        <div className="text-2xl font-bold text-gray-900">{listing.days_on_market}d</div>
                      </div>
                    )}
                    {listing.listing_views != null && listing.listing_views > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Buyer Views</div>
                        <div className="text-2xl font-bold text-blue-700">👁 {listing.listing_views.toLocaleString()}</div>
                      </div>
                    )}
                    {listedDate && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Listed</div>
                        <div className="text-lg font-bold text-gray-900">{listedDate}</div>
                      </div>
                    )}
                    {listing.quality_score != null && listing.quality_score > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Quality Score</div>
                        <div className="text-2xl font-bold text-gray-900">{listing.quality_score}<span className="text-sm text-gray-500">/100</span></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Sourced from <a href="https://dealledger.org" className="underline hover:text-gray-600" target="_blank" rel="noopener noreferrer">DealLedger</a> — buyer view counts and DOM are not available on most marketplaces.
                  </p>
                </div>
              )}

              {listing.description && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">About This Business</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
                </div>
              )}

              {listing.deep_dive_html && (
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizeDeepDiveHtml(listing.deep_dive_html) || '' }}
                  className="deep-dive-container"
                />
              )}

              {(listing.established_year || listing.employees || listing.business_type) && (
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
                  </div>
                </div>
              )}

              {listing.broker_account && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Listed by</div>
                  <div className="font-semibold text-gray-900">{listing.broker_account}</div>
                </div>
              )}

              {listing.verified_date && (
                <div className="text-sm text-gray-500 text-center">
                  Verified on {new Date(listing.verified_date).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Sidebar CTA */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border-2 border-emerald-200 p-6 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-2 text-xl">Interested in this listing?</h3>
                <p className="text-sm text-gray-600 mb-5">
                  {listing.direct_broker_url
                    ? 'Contact the broker directly — no marketplace gate.'
                    : 'Contact the broker on the marketplace — no signup required.'}
                </p>

                <a
                  href={listing.direct_broker_url || (listing.listing_url !== '#' ? listing.listing_url : '#')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg mb-4"
                >
                  {listing.direct_broker_url ? 'Contact Broker Directly →' : 'View on BizBuySell →'}
                </a>

                {listing.broker_account && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="text-xs text-gray-500 mb-1">Listed by</div>
                    <div className="font-semibold text-gray-900 text-sm">{listing.broker_account}</div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span><span>No account required</span></li>
                    <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span><span>No email capture</span></li>
                    <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span><span>Direct to broker</span></li>
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
