// pages/cleaning-businesses-for-sale/[state]/[city].tsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import { createClient } from '@supabase/supabase-js';
import {
  STATE_NAMES,
  toStateCode,
  stateVariants,
  slugifyCity,
  canonicalCitySlug,
  citySlugVariants,
  cityNameFromSlug,
  CITY_INDEX_MIN,
  STATE_REDIRECT_MIN
} from '../../../lib/geo';
import { getIndexableCities } from '../../../lib/cityIndex';
import {
  summarize,
  categoryRows,
  mixPhrase,
  pctDiff,
  MIN_N,
  Summary,
  CategoryRow
} from '../../../lib/cityStats';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Market listings live in DealLedger, not the CleaningExits app project.
// `cleaning_listings_merge` no longer exists in either.
const supabaseDealLedger = createClient(
  process.env.DEALLEDGER_SUPABASE_URL as string,
  process.env.DEALLEDGER_SUPABASE_SERVICE_KEY as string
);

type Listing = {
  id: string;
  title: string | null;
  price: number | null;
  city: string | null;
  state: string | null;
  cash_flow: number | null;
  revenue: string | number | null;
  image_url: string | null;
  location: string | null;
  category: string | null;
  days_on_market: number | null;
};

type CityPageProps = {
  state: string;
  stateFullName: string;
  city: string;
  cityFormatted: string;
  listings: Listing[];
  cityStats: Summary;
  stateStats: Summary;
  categories: CategoryRow[];
  stateHref: string;
  dataThrough: string | null;
};



const money = (n?: number | null) =>
  n == null
    ? null
    : n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      });

// `revenue` arrives as a number from cleaning_listings_direct (it was text on
// the old merge table). Handle both — calling .replace() on a number throws,
// which took down the whole static export.
const parseRevenue = (rev: string | number | null | undefined): number | null => {
  if (rev == null) return null;
  if (typeof rev === 'number') return isNaN(rev) ? null : rev;
  const num = parseFloat(String(rev).replace(/[$,]/g, ''));
  return isNaN(num) ? null : num;
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Pre-render only cities that clear the index bar in a real state.
  // Thin ones still render on demand (noindex) if someone links to them.
  const cities = await getIndexableCities();
  return {
    paths: cities.map(c => ({ params: { state: c.state, city: c.slug } })),
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps<CityPageProps> = async context => {
  const stateRaw = context.params?.state as string;
  const citySlug = context.params?.city as string;
  const stateParam = toStateCode(stateRaw);
  if (!stateParam) return { notFound: true, revalidate: 3600 };

  if (stateRaw !== stateParam.toLowerCase()) {
    return {
      redirect: {
        destination: `/cleaning-businesses-for-sale/${stateParam.toLowerCase()}/${encodeURIComponent(citySlug)}`,
        permanent: true
      }
    };
  }

  // Brooklyn and Kings County are one page. Aliases 301 to the canonical slug.
  const canonical = canonicalCitySlug(stateParam, citySlug);
  if (canonical !== citySlug) {
    return {
      redirect: {
        destination: `/cleaning-businesses-for-sale/${stateParam.toLowerCase()}/${encodeURIComponent(canonical)}`,
        permanent: true
      }
    };
  }

  const cityFormatted = cityNameFromSlug(citySlug);
  const stateFullName = STATE_NAMES[stateParam] || stateParam;
  // The canonical page shows its aliases' listings too. Values are quoted
  // because "St. Louis" has a period, which PostgREST reads as syntax.
  const cityFilter = citySlugVariants(stateParam, citySlug)
    .map(slug => `city.ilike."${cityNameFromSlug(slug)}"`)
    .join(',');

  const { data: listings, error } = await supabaseDealLedger
    .from('cleaning_listings_direct')
    .select(
      'id, header, price, city, state, cash_flow, revenue, image_url, location, category, days_on_market, scraped_at'
    )
    .in('state', stateVariants(stateParam))
    .or(cityFilter)
    .order('price', { ascending: false });

  if (error) return { notFound: true, revalidate: 60 };
  // No listings in this city right now: go up to the state page rather than
  // 404. Temporary, because listings come back.
  if (!listings || listings.length === 0) {
    return {
      redirect: {
        destination: `/cleaning-businesses-for-sale/${stateParam.toLowerCase()}`,
        permanent: false
      },
      revalidate: 3600
    };
  }

  const formattedListings: Listing[] = listings.map(l => ({
    id: l.id,
    title: l.header,
    price: l.price,
    city: l.city,
    state: l.state,
    cash_flow: l.cash_flow,
    revenue: l.revenue,
    image_url: l.image_url,
    location: l.location,
    category: l.category,
    days_on_market: l.days_on_market
  }));

  // Statewide figures from the same view, so city and state compare like
  // with like. A few hundred rows at most, under the 1,000-row cap.
  const [{ data: stateRows }, { data: stateStat }] = await Promise.all([
    supabaseDealLedger
      .from('cleaning_listings_direct')
      .select('price, cash_flow, days_on_market, category')
      .in('state', stateVariants(stateParam)),
    supabaseDealLedger
      .from('market_stats_state')
      .select('active_count')
      .eq('vertical', 'cleaning')
      .eq('state_norm', stateParam)
      .maybeSingle()
  ]);

  // Link up to whichever state page is the indexable one.
  const stateHref =
    stateStat && stateStat.active_count >= STATE_REDIRECT_MIN
      ? `/for-sale/${stateParam.toLowerCase()}`
      : `/cleaning-businesses-for-sale/${stateParam.toLowerCase()}`;

  const latest = listings
    .map(l => l.scraped_at)
    .filter(Boolean)
    .sort()
    .pop();

  return {
    props: {
      state: stateParam,
      stateFullName,
      city: cityFormatted,
      cityFormatted,
      listings: formattedListings,
      cityStats: summarize(formattedListings),
      stateStats: summarize(stateRows || []),
      categories: categoryRows(formattedListings),
      stateHref,
      dataThrough: latest
        ? new Date(latest).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        : null
    },
    revalidate: 3600
  };
};

export default function CityPage({
  state,
  stateFullName,
  city,
  listings,
  cityStats,
  stateStats,
  categories,
  stateHref,
  dataThrough
}: CityPageProps) {
  const n = listings.length;
  const mix = mixPhrase(categories);
  const priceVsState = pctDiff(cityStats.medianPrice, stateStats.medianPrice);
  // Prefer the local multiple; fall back to the state's, labeled as such.
  const localMultiple = cityStats.medianMultiple != null;
  const multiple = localMultiple ? cityStats.medianMultiple : stateStats.medianMultiple;
  const x = (m: number | null) => (m == null ? null : `${m.toFixed(1)}x`);
  const plural = n === 1 ? 'business' : 'businesses';
  const pricedCategories = categories.filter(c => c.medianPrice != null);

  const metaTitle = `${n} Cleaning ${n === 1 ? 'Business' : 'Businesses'} for Sale in ${city}, ${state} | Cleaning Exits`;
  const metaDescription = [
    `${n} cleaning ${plural} for sale in ${city}, ${stateFullName}${mix ? `: ${mix}` : ''}.`,
    cityStats.medianPrice != null ? `Median asking ${money(cityStats.medianPrice)}.` : '',
    multiple != null
      ? `${localMultiple ? 'Median' : `${stateFullName} median`} ${x(multiple)} SDE.`
      : '',
    'Updated daily.'
  ]
    .filter(Boolean)
    .join(' ');

  // Schema.org structured data (typed as any so we can build it flexibly)
  const schemaData: any = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: metaTitle,
    description: metaDescription,
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 10).map((listing, index) => {
      const item: any = {
        '@type': 'Product',
        name: listing.title || 'Cleaning Business'
      };

      if (listing.price) {
        item.offers = {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: 'USD'
        };
      }

      return {
        '@type': 'ListItem',
        position: index + 1,
        item
      };
    })
  };

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        {/* One or two listings plus boilerplate is what drags a site down. */}
        {listings.length < CITY_INDEX_MIN && (
          <meta name="robots" content="noindex, follow" />
        )}
        <link
          rel="canonical"
          href={`https://cleaningexits.com/cleaning-businesses-for-sale/${state.toLowerCase()}/${slugifyCity(
            city
          )}`}
        />

        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />

        {/* JSON-LD: render as raw text so Google gets valid JSON */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link
              href="/"
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              ← Cleaning Exits
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-2 text-sm">
              <Link
                href="/cleaning-businesses-for-sale"
                className="text-emerald-100 hover:text-white"
              >
                All States
              </Link>
              <span className="mx-2 text-emerald-200">/</span>
              <Link
                href={stateHref}
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
              {n} active {plural}
              {mix ? `: ${mix}` : ''}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Tile label="For sale" value={String(n)} />
              <Tile
                label="Median asking"
                value={cityStats.medianPrice != null ? money(cityStats.medianPrice) : null}
                sub={`${cityStats.priceN} priced`}
              />
              <Tile
                label={localMultiple ? 'Median multiple' : `${state} median multiple`}
                value={multiple != null ? `${x(multiple)} SDE` : null}
                sub={`${localMultiple ? cityStats.multipleN : stateStats.multipleN} with cash flow`}
              />
              <Tile
                label="Median SDE"
                value={cityStats.medianSde != null ? money(cityStats.medianSde) : null}
                sub={`${cityStats.multipleN} with cash flow`}
              />
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

          {/* Market read, written from this page's own numbers */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              The {city} market right now
            </h2>

            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                {n} cleaning {plural} {n === 1 ? 'is' : 'are'} listed for sale in {city}
                {mix ? `: ${mix}` : ''}.
                {cityStats.medianPrice != null && (
                  <>
                    {' '}The median asking price is {money(cityStats.medianPrice)} across{' '}
                    {cityStats.priceN} priced listings
                    {priceVsState != null && stateStats.medianPrice != null && (
                      <>
                        ,{' '}
                        {priceVsState === 0
                          ? 'in line with'
                          : `${Math.abs(priceVsState)}% ${priceVsState > 0 ? 'above' : 'below'}`}{' '}
                        the {stateFullName} median of {money(stateStats.medianPrice)}
                      </>
                    )}
                    .
                  </>
                )}
              </p>

              {multiple != null && (
                <p className="mb-4">
                  {localMultiple ? (
                    <>
                      Where the broker published cash flow ({cityStats.multipleN} listings), {city}{' '}
                      businesses are asking a median {x(multiple)} seller's discretionary earnings
                      {cityStats.medianSde != null && <> on a median SDE of {money(cityStats.medianSde)}</>}.
                      {stateStats.medianMultiple != null && (
                        <>
                          {' '}Across {stateFullName} the figure is {x(stateStats.medianMultiple)} (
                          {stateStats.multipleN} listings).
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Too few {city} listings publish cash flow to give a local multiple. Across{' '}
                      {stateFullName}, businesses in this index ask a median {x(multiple)} SDE (
                      {stateStats.multipleN} listings).
                    </>
                  )}{' '}
                  These are asking figures; closed deals usually come in lower.
                </p>
              )}

              {categories.length > 1 && pricedCategories.length > 0 && (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">
                    By type of business
                  </h3>
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 font-medium">Type</th>
                        <th className="py-2 font-medium">Listings</th>
                        <th className="py-2 font-medium">Median asking</th>
                        <th className="py-2 font-medium">Median multiple</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c.key} className="border-b last:border-0">
                          <td className="py-2 capitalize">{c.label}</td>
                          <td className="py-2">{c.count}</td>
                          <td className="py-2">{c.medianPrice != null ? money(c.medianPrice) : '—'}</td>
                          <td className="py-2">
                            {c.medianMultiple != null ? `${x(c.medianMultiple)} (${c.multipleN})` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mb-4 text-sm text-gray-500">
                    Medians shown where at least {MIN_N} listings report the figure. Laundromats
                    and dry cleaners price on equipment and lease terms; contract cleaning
                    companies price on recurring revenue, so their multiples are not comparable.
                  </p>
                </>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">
                Selling or buying in {city}
              </h3>
              <p className="mb-4">
                Owners: see what a {city} business like yours would list for on the{' '}
                <Link href="/valuation" className="text-emerald-600 hover:underline">
                  valuation page
                </Link>
                , which uses the same live data, or{' '}
                <Link href="/sell" className="text-emerald-600 hover:underline">
                  talk to us about selling
                </Link>
                . Buyers: most acquisitions in this price range are financed with an SBA 7(a)
                loan, and the full {stateFullName} picture is on the{' '}
                <Link href={stateHref} className="text-emerald-600 hover:underline">
                  {stateFullName} page
                </Link>
                .
              </p>
              {dataThrough && (
                <p className="text-sm text-gray-500">
                  Data through {dataThrough}.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function Tile({ label, value, sub }: { label: string; value: string | null; sub?: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      <div className="text-emerald-100 text-sm mb-1">{label}</div>
      <div className="text-2xl font-bold">{value ?? '—'}</div>
      {sub && <div className="text-emerald-100 text-xs mt-1">{sub}</div>}
    </div>
  );
}
