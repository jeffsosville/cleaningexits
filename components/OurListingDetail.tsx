import Head from 'next/head';
import Link from 'next/link';
import type { OurListing } from '@/data/ourListings';

// In-house (CleaningExits-brokered) listing view, ported from VendingExits.

const money = (n: number | null) => (n == null ? '—' : `$${n.toLocaleString('en-US')}`);
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function OurListingDetail({ listing }: { listing: OurListing }) {
  const url = `https://cleaningexits.com/listing/${listing.id}`;

  return (
    <>
      <Head>
        <title>{listing.title} | Cleaning Exits</title>
        <meta name="description" content={listing.summary.substring(0, 160)} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={listing.title} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={url} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link href="/listings" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              ← Back to Cleaning Exits
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  Exclusively listed by CleaningExits
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{listing.title}</h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Asking Price</div>
                  <div className="text-xl font-bold text-gray-900">{money(listing.price)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Annualized Net</div>
                  <div className="text-xl font-bold text-emerald-600">{money(listing.cash_flow)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="text-lg font-bold text-gray-900">{listing.location}</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h2 className="font-bold text-gray-900 mb-3 text-lg">Overview</h2>
                <p className="text-gray-700 leading-relaxed">{listing.summary}</p>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">Highlights</h2>
                <ul className="space-y-2">
                  {listing.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-gray-700">
                      <span className="text-emerald-600 mt-0.5">✓</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">Financial Summary</h2>
                <div className="divide-y">
                  {listing.financials.map((f) => (
                    <div key={f.label} className="py-3 flex justify-between gap-6">
                      <div>
                        <div className="font-medium text-gray-900">{f.label}</div>
                        {f.note && <div className="text-sm text-gray-500 mt-0.5">{f.note}</div>}
                      </div>
                      <div className="font-bold text-gray-900 whitespace-nowrap">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">What's Included</h2>
                <ul className="space-y-2">
                  {listing.equipment.map((e) => (
                    <li key={e} className="flex items-start gap-2 text-gray-700">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Units</div>
                  <div className="text-2xl font-bold text-gray-900">{listing.machineCount}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Client Mix</div>
                  <div className="text-lg font-bold text-gray-900">{listing.locationTypes}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Listed</div>
                  <div className="text-lg font-bold text-gray-900">{fmtDate(listing.listedOn)}</div>
                </div>
              </div>
            </div>

            {/* Right column — NDA gate */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border-2 border-emerald-200 p-6 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-2 text-xl">Request the full package</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sign a short NDA to receive the P&amp;L, account and contract detail, and
                  staffing information.
                </p>

                <a
                  href={listing.ctaHref}
                  className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-lg transition mb-4"
                >
                  {listing.ctaLabel}
                </a>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">Listed by</div>
                  <div className="font-semibold text-gray-900">{listing.broker.name}</div>
                  <div className="text-sm text-gray-600">{listing.broker.firm}</div>
                  <a
                    href={`mailto:${listing.broker.email}?subject=${encodeURIComponent(listing.title)}`}
                    className="text-sm text-emerald-600 hover:text-emerald-700 block mt-2"
                  >
                    {listing.broker.email}
                  </a>
                  <a
                    href={`tel:${listing.broker.phone.replace(/\D/g, '')}`}
                    className="text-sm text-emerald-600 hover:text-emerald-700 block"
                  >
                    {listing.broker.phone}
                  </a>
                </div>

                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2"><span className="text-emerald-600">✓</span><span>Seller financials verified by us</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-600">✓</span><span>Direct to the listing broker</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-600">✓</span><span>No buyer-side fee</span></li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

