// pages/listing/[id].tsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';

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
  n == null
    ? '—'
    : n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      });

// Sanitize deep_dive_html to remove sections we don't want
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

  sanitized = sanitized
    .replace(/<a[^>]*>View Full Listing[^<]*<\/a>/gi, '')
    .replace(/<button[^>]*>View Full Listing[^<]*<\/button>/gi, '')
    .replace(/<a[^>]*>Need SBA Financing\?<\/a>/gi, '')
    .replace(/<a[^>]*>View on Broker Site<\/a>/gi, '');

  return sanitized.trim();
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  // IMPORTANT: Use service role server-side to avoid RLS surprises.
  // Do NOT create this client at module scope (prevents accidental client bundling).
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string, // server-only
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // 1) Try to load directly from the merge table by id OR listing_id
  let { data: mergeRow, error: mergeErr } = await supabaseAdmin
    .from('cleaning_listings_merge')
    .select('*')
    .or(`id.eq.${id},listing_id.eq.${id}`)
    .maybeSingle();

  // 2) If not found, try resolving via Top-10 view by slug
  //    We try to get a merge PK if the view exposes it (merge_id or id),
  //    otherwise we’ll render from the Top-10 fields as a fallback.
  let top10Row: any = null;
  if (!mergeRow) {
    const { data: t10 } = await supabaseAdmin
      .from('top_10_commercial_cleaning')
      .select('*')
      .eq('listing_id', id)
      .maybeSingle();

    top10Row = t10 ?? null;

    if (top10Row) {
      const mergeId =
        top10Row.merge_id || // preferred if your view exposes it
        top10Row.id ||       // sometimes views pass through id
        null;

      if (mergeId) {
        const { data: fromMerge } = await supabaseAdmin
          .from('cleaning_listings_merge')
          .select('*')
          .eq('id', mergeId)
          .maybeSingle();
        if (fromMerge) mergeRow = fromMerge;
      }
    }
  }

  // If we still have nothing, render 404 (hard miss)
  if (!mergeRow && !top10Row) {
    return { notFound: true };
  }

  // Build the listing object from the best available source (merge preferred)
  const src: any = mergeRow ?? top10Row;

  const listing: Listing = {
    id: (mergeRow?.id ?? top10Row?.id ?? id) as string,
    listing_id: (mergeRow?.listing_id ?? top10Row?.listing_id ?? id) as string,
    title: src.header ?? src.title ?? null,
    price: src.price ?? null,
    price_text: null,
    location: src.location ?? null,
    city: src.city ?? null,
    state: src.state ?? null,
    description: src.notes ?? src.description ?? null,
    business_type: null,
    category: null,
    revenue: src.revenue ?? null,
    cash_flow: src.cash_flow ?? null,
    established_year: null,
    employees: null,
    listing_url: src.direct_broker_url || src.url || src.listing_url || '#',
    image_url: src.image_url ?? null,
    broker_account: src.broker_account ?? null,
    why_hot: null,
    curator_note: null,
    verified_date: src.scraped_at ?? null,
    quality_score: null,
    featured_rank: src.featured_rank ?? null,
    scraped_at: src.scraped_at ?? null,
    deep_dive_html: src.deep_dive_html ?? null,
  };

  return { props: { listing } };
};

export default function ListingDetail({ listing }: { listing: Listing }) {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isHighValue = listing.price && listing.price >= 1_000_000;

  const generateListingSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": listing.title || "Commercial Cleaning Business",
      "description":
        listing.description?.substring(0, 500) ||
        "Established commercial cleaning business for sale",
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
      "brand": { "@type": "Brand", "name": "Cleaning Exits" },
      "additionalProperty": [
        listing.revenue
          ? { "@type": "PropertyValue", "name": "Revenue", "value": listing.revenue }
          : null,
        listing.cash_flow
          ? { "@type": "PropertyValue", "name": "Cash Flow (SDE)", "value": listing.cash_flow }
          : null
      ].filter(Boolean),
      "locationCreated":
        listing.city && listing.state
          ? {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": listing.city,
                "addressRegion": listing.state,
                "addressCountry": "US"
              }
            }
          : undefined
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
    } catch (err) {
      console.error('Lead capture error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{listing.title || 'Business Listing'} | Cleaning Exits</title>
        <meta
          name="description"
          content={
            listing.description?.substring(0, 160) ||
            'Commercial cleaning business for sale'
          }
        />
        <link rel="canonical" href={`https://cleaningexits.com/listing/${listing.listing_id}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateListingSchema()) }}
        />
        <meta property="og:title" content={listing.title || 'Business Listing'} />
        <meta property="og:description" content={listing.description?.substring(0, 160) || ''} />
        <meta property="og:image" content={listing.image_url || 'https://cleaningexits.com/og-default.jpg'} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://cleaningexits.com/listing/${listing.listing_id}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={listing.title || 'Business Listing'} />
        <meta name="twitter:description" content={listing.description?.substring(0, 160) || ''} />
        <meta name="twitter:image" content={listing.image_url || 'https://cleaningexits.com/og-default.jpg'} />
      </Head>

      {/* ...UI below unchanged... */}
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              ← Back to Cleaning Exits
            </Link>
          </div>
        </header>
        {/* (rest of your component unchanged) */}
      </div>
    </>
  );
}


