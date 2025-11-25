// pages/audit.tsx
import Head from "next/head";
import Link from "next/link";
import Header from '../components/Header';
import Footer from '../components/Footer';

type AuditDay = {
  date: string;
  dateDisplay: string;
  total: number;
  real: number;
  junk: number;
  listings: AuditListing[];
};

type AuditListing = {
  listNumber: number;
  title: string;
  location: string;
  state: string;
  askingPrice: number;
  cashFlow: number | null;
  ebitda: number | null;
  multiple: number | null;
  verdict: 'REAL' | 'JUNK';
  redFlags: string;
  notes: string;
  listingUrl: string;
};

const money = (n?: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

// Static data for now - can move to Supabase later
const auditData: AuditDay[] = [
  {
    date: "2024-11-25",
    dateDisplay: "November 25, 2024",
    total: 10,
    real: 1,
    junk: 9,
    listings: [
      {
        listNumber: 2443789,
        title: "Commercial and Residential Pressure Washing",
        location: "Bullitt County, KY",
        state: "KY",
        askingPrice: 1125000,
        cashFlow: null,
        ebitda: 308555,
        multiple: 3.65,
        verdict: "REAL",
        redFlags: "",
        notes: "Real broker (Edison Business Advisors - Steven Niehaus). Real photos. Established 1980. Realistic 3.6x multiple.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/commercial-and-residential-pressure-washing/2443789/"
      },
      {
        listNumber: 2444412,
        title: "Profitable Water Damage Cleanup Company",
        location: "Chattanooga, TN",
        state: "TN",
        askingPrice: 238900,
        cashFlow: 267448,
        ebitda: null,
        multiple: 0.89,
        verdict: "JUNK",
        redFlags: "Impossible multiple, no photos, copy-paste description",
        notes: "'This is your chance to step into...' - same copy-paste description across multiple fake listings.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/profitable-water-damage-cleanup-company/2444412/"
      },
      {
        listNumber: 2444418,
        title: "Water Damage and Mold-Remediation Business with Great Cash Flow",
        location: "Rock Hill, SC",
        state: "SC",
        askingPrice: 241900,
        cashFlow: 260484,
        ebitda: null,
        multiple: 0.93,
        verdict: "JUNK",
        redFlags: "Impossible multiple, no photos, copy-paste description",
        notes: "Same description as Chattanooga listing. Same broker spam network.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/water-damage-and-mold-remediation-business-with-great-cash-flow/2444418/"
      },
      {
        listNumber: 2444416,
        title: "Restoration Service Business with Consistent Year-Round Demand",
        location: "Myrtle Beach, SC",
        state: "SC",
        askingPrice: 236900,
        cashFlow: 261471,
        ebitda: null,
        multiple: 0.91,
        verdict: "JUNK",
        redFlags: "Impossible multiple, no photos, generic description",
        notes: "Cash flow HIGHER than asking price. Same broker spam pattern.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/restoration-service-business-with-consistent-year-round-demand/2444416/"
      },
      {
        listNumber: 2444007,
        title: "High-Demand Water Damage Restoration Business",
        location: "Houston, TX",
        state: "TX",
        askingPrice: 229000,
        cashFlow: 279000,
        ebitda: null,
        multiple: 0.82,
        verdict: "JUNK",
        redFlags: "Impossible multiple, no photos, copy-paste description",
        notes: "Cash flow higher than asking. Same broker pattern as other spam listings.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/high-demand-water-damage-restoration-business/2444007/"
      },
      {
        listNumber: 2444128,
        title: "Established Vent/Window Cleaning Franchise For Sale",
        location: "Ocoee, FL",
        state: "FL",
        askingPrice: 50000,
        cashFlow: 250000,
        ebitda: 125000,
        multiple: 0.20,
        verdict: "JUNK",
        redFlags: "Franchise territory not a business, impossible multiple",
        notes: "This is franchise recruitment disguised as a business sale. The $250K 'cash flow' is a projection, not actual financials.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/established-vent-window-cleaning-franchise-for-sale/2444128/"
      },
      {
        listNumber: 2444448,
        title: "Scalable Commercial Cleaning Franchise Based in Charlotte",
        location: "Mecklenburg County, NC",
        state: "NC",
        askingPrice: 435000,
        cashFlow: 175000,
        ebitda: null,
        multiple: 2.49,
        verdict: "JUNK",
        redFlags: "Franchise territory, can't verify broker, round numbers",
        notes: "Master franchise recruitment. Not a real operating business for sale.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/scalable-commercial-cleaning-franchise-based-in-charlotte/2444448/"
      },
      {
        listNumber: 2436305,
        title: "Handyman, Housekeeping and Concierge Services",
        location: "Winter Garden, FL",
        state: "FL",
        askingPrice: 575000,
        cashFlow: 200000,
        ebitda: null,
        multiple: 2.88,
        verdict: "JUNK",
        redFlags: "No photos, round numbers, generic description",
        notes: "40 years in business but no photos? Round $200K cash flow? Suspicious.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/handyman-housekeeping-and-concierge-services/2436305/"
      },
      {
        listNumber: 2443670,
        title: "Local Business - Hood Cleaning - Bristol",
        location: "Bristol, TN",
        state: "TN",
        askingPrice: 235000,
        cashFlow: 213000,
        ebitda: null,
        multiple: 1.10,
        verdict: "JUNK",
        redFlags: "Near-impossible multiple, no photos, same broker pattern",
        notes: "1.1x multiple is technically possible for distressed sale but combined with no photos and generic description = junk.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/local-business-hood-cleaning-bristol/2443670/"
      },
      {
        listNumber: 2418246,
        title: "Profitable, Systemized Cleaning Biz – Recurring Clients, VA-Supported",
        location: "Denton County, TX",
        state: "TX",
        askingPrice: 30000,
        cashFlow: 19000,
        ebitda: 19000,
        multiple: 1.58,
        verdict: "JUNK",
        redFlags: "Round numbers, no photos, brand new (2025)",
        notes: "Established 2025 - brand new. Impossible to verify any financials.",
        listingUrl: "https://www.bizbuysell.com/business-opportunity/profitable-systemized-cleaning-biz-recurring-clients-va-supported/2418246/"
      }
    ]
  }
];

// Calculate running totals
const totalDays = auditData.length;
const totalListings = auditData.reduce((sum, day) => sum + day.total, 0);
const totalReal = auditData.reduce((sum, day) => sum + day.real, 0);
const totalJunk = auditData.reduce((sum, day) => sum + day.junk, 0);
const junkPercent = Math.round((totalJunk / totalListings) * 100);

export default function AuditPage() {
  return (
    <>
      <Head>
        <title>30-Day BizBuySell Audit | CleaningExits</title>
        <meta name="description" content="Daily audit of cleaning business listings on BizBuySell. Real vs junk. Full transparency. Open data." />
      </Head>

      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <header className="text-center mb-10">
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            🔍 30-Day BizBuySell Audit
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Every cleaning business listing. Analyzed daily. Full transparency.
          </p>
        </header>

        {/* Stats Grid */}
        <section className="mb-10">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900">{totalDays}</div>
                <div className="text-sm text-gray-600 mt-1">Days Completed</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900">{totalListings}</div>
                <div className="text-sm text-gray-600 mt-1">Listings Reviewed</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-emerald-600">{totalReal}</div>
                <div className="text-sm text-gray-600 mt-1">Real ({100 - junkPercent}%)</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-red-500">{totalJunk}</div>
                <div className="text-sm text-gray-600 mt-1">Junk ({junkPercent}%)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Progress Bar */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Audit Progress</span>
            <span className="text-sm text-gray-500">{totalDays} / 30 days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-emerald-600 h-3 rounded-full transition-all"
              style={{ width: `${(totalDays / 30) * 100}%` }}
            ></div>
          </div>
        </section>

        {/* Daily Log */}
        <section className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">📅 Daily Log</h2>

          {auditData.map((day, dayIndex) => (
            <div key={day.date} className="rounded-2xl border border-gray-200 mb-6 overflow-hidden">
              {/* Day Header */}
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">Day {totalDays - dayIndex} — {day.dateDisplay}</h3>
                </div>
                <div className="flex gap-4">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    ✅ {day.real} Real
                  </span>
                  <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                    🗑️ {day.junk} Junk
                  </span>
                </div>
              </div>

              {/* Listings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Verdict</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Listing</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Asking</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Cash Flow</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Multiple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.listings.map((listing) => (
                      <tr key={listing.listNumber} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-4">
                          {listing.verdict === 'REAL' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              ✅ REAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              🗑️ JUNK
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <a 
                            href={listing.listingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-900 hover:text-emerald-600 transition"
                          >
                            {listing.title}
                          </a>
                          <div className="text-gray-500 text-xs mt-1">📍 {listing.location}</div>
                          {listing.redFlags && (
                            <div className="text-red-500 text-xs mt-1">🚩 {listing.redFlags}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-gray-900">
                          {money(listing.askingPrice)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700">
                          {money(listing.cashFlow || listing.ebitda)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {listing.multiple && (
                            <span className={`font-semibold ${
                              listing.multiple >= 2.5 ? 'text-emerald-600' : 
                              listing.multiple >= 1.5 ? 'text-yellow-600' : 'text-red-500'
                            }`}>
                              {listing.multiple.toFixed(2)}x
                              {listing.multiple < 1.5 && ' 🚩'}
                              {listing.multiple >= 2.5 && listing.multiple <= 4 && ' ✅'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        {/* Methodology */}
        <section className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">🎯 Methodology</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 p-6 bg-white">
              <h3 className="font-bold text-lg mb-4 text-red-600">🚩 Red Flags (Junk Indicators)</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span><strong>Impossible Multiple:</strong> Asking price below 2x cash flow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span><strong>No Photos:</strong> Stock images or "No photo available"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span><strong>Copy-Paste Description:</strong> Generic text across multiple listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span><strong>Unverifiable Broker:</strong> No website, license, or presence</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span><strong>Round Numbers:</strong> $500K asking, $200K cash flow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span><strong>Franchise Trap:</strong> Territory recruitment disguised as sale</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6 bg-white">
              <h3 className="font-bold text-lg mb-4 text-emerald-600">✅ Green Flags (Real Indicators)</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Realistic Multiple:</strong> 2.5x - 4x SDE/cash flow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Real Photos:</strong> Actual equipment, location, or team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Verified Broker:</strong> Licensed, website, professional presence</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Specific Financials:</strong> Non-round numbers, EBITDA disclosed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Operating History:</strong> Years in business with track record</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Clear Reason for Sale:</strong> Retirement, relocation, etc.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Skip the Junk. See Only Real Deals.</h2>
            <p className="text-lg text-emerald-50 mb-6 max-w-2xl mx-auto">
              We do the filtering so you don't have to. Every listing on CleaningExits is manually verified.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cleaning-index"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-emerald-600 font-semibold hover:bg-gray-50 transition"
              >
                Browse Verified Listings →
              </Link>
              <a
                href="https://github.com/jeffsosville/cleaning-listings-audit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-8 py-4 text-white font-semibold hover:bg-emerald-800 transition"
              >
                📊 Raw Data (GitHub)
              </a>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="text-center">
          <p className="text-gray-500 text-sm">
            Follow the daily audit on Twitter: <a href="https://twitter.com/jeffsosville" className="text-emerald-600 hover:underline font-semibold">@jeffsosville</a>
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
