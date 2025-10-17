// pages/resources.tsx
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Resources() {
  return (
    <>
      <Head>
        <title>Resources | Cleaning Exits</title>
        <meta name="description" content="Guides and resources for buying and selling commercial cleaning businesses." />
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Resources</h1>
        
        <div className="bg-white rounded-xl border p-8 mb-8">
          <p className="text-lg text-gray-700 mb-8">
            Everything you need to know about buying and selling commercial cleaning businesses.
          </p>

          <div className="space-y-8">
            {/* For Buyers */}
            <div>
              <h2 className="text-2xl font-bold mb-4">For Buyers</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">What to Look For</h3>
                  <p className="text-gray-700 mb-3">
                    When evaluating a cleaning business acquisition, focus on:
                  </p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>• <strong>Contract diversity</strong> - Multiple clients reduce risk</li>
                    <li>• <strong>Recurring revenue</strong> - Long-term contracts are gold</li>
                    <li>• <strong>Employee retention</strong> - Low turnover indicates stability</li>
                    <li>• <strong>Equipment condition</strong> - Old equipment = hidden costs</li>
                    <li>• <strong>Geographic concentration</strong> - Tighter routes = higher margins</li>
                  </ul>
                </div>

                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Typical Valuation Multiples</h3>
                  <p className="text-gray-700 mb-3">
                    Commercial cleaning businesses typically sell for:
                  </p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>• <strong>2.0-3.5x SDE</strong> for businesses under $1M revenue</li>
                    <li>• <strong>3.0-4.5x SDE</strong> for businesses $1M-$3M revenue</li>
                    <li>• <strong>4.0-6.0x EBITDA</strong> for businesses over $3M revenue</li>
                  </ul>
                  <p className="text-gray-600 text-sm mt-2">
                    *Multiples vary based on contract quality, growth, and geographic market
                  </p>
                </div>

                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Financing Your Purchase</h3>
                  <p className="text-gray-700 mb-3">
                    Most buyers finance 70-90% of the purchase price through:
                  </p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>• <strong>SBA 7(a) loans</strong> - Up to 90% LTV, 10-year terms</li>
                    <li>• <strong>Seller financing</strong> - Often 10-20% of purchase price</li>
                    <li>• <strong>Equipment financing</strong> - For vehicles and machinery</li>
                  </ul>
                  <p className="text-gray-600 text-sm mt-3">
                    Need financing? We work with SBA lenders who specialize in cleaning business acquisitions.{' '}
                    <Link href="/contact" className="text-emerald-600 hover:underline">Contact us</Link> for an intro.
                  </p>
                </div>

                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Due Diligence Checklist</h3>
                  <p className="text-gray-700 mb-3">Before you buy, verify:</p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>• Client contracts (length, terms, renewal history)</li>
                    <li>• Financial statements (3 years minimum)</li>
                    <li>• Employee agreements and turnover rates</li>
                    <li>• Insurance policies and claims history</li>
                    <li>• Equipment condition and maintenance records</li>
                    <li>• Outstanding liabilities or legal issues</li>
                    <li>• Customer concentration (top 3 clients = what % of revenue?)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* For Sellers */}
            <div>
              <h2 className="text-2xl font-bold mb-4">For Sellers</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Preparing Your Business for Sale</h3>
                  <p className="text-gray-700 mb-3">
                    Maximize your sale price by:
                  </p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>• <strong>Clean financials</strong> - Get 3 years of statements reviewed by a CPA</li>
                    <li>• <strong>Document everything</strong> - SOPs, contracts, client lists</li>
                    <li>• <strong>Reduce owner dependency</strong> - Buyers want turnkey operations</li>
                    <li>• <strong>Lock in contracts</strong> - Long-term contracts increase value</li>
                    <li>• <strong>Address maintenance</strong> - Fix deferred maintenance on equipment</li>
                  </ul>
                </div>

                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">When to Sell</h3>
                  <p className="text-gray-700 mb-3">
                    The best time to sell is when:
                  </p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>• Revenue is growing (buyers pay premiums for growth)</li>
                    <li>• You have strong client retention (shows stability)</li>
                    <li>• Equipment is in good condition (reduces buyer risk)</li>
                    <li>• Market conditions are favorable (low interest rates help buyers)</li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    Want to sell your cleaning business?{' '}
                    <Link href="/sell" className="text-emerald-600 hover:underline font-semibold">
                      Learn more →
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Market Insights */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Market Insights</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Industry Trends</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• <strong>Consolidation wave</strong> - Larger players are acquiring smaller operators</li>
                    <li>• <strong>Labor challenges</strong> - Finding and retaining quality employees remains difficult</li>
                    <li>• <strong>Technology adoption</strong> - Software for scheduling, billing, and quality control is becoming standard</li>
                    <li>• <strong>Specialization premium</strong> - Niche services (medical, industrial) command higher multiples</li>
                  </ul>
                </div>

                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">What Buyers Want Most</h3>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>• Businesses with $500k-$5M in revenue</li>
                    <li>• Strong contract base with Fortune 500 or government clients</li>
                    <li>• Owner willing to stay on for 90-180 day transition</li>
                    <li>• Clean financials with verifiable cash flow</li>
                    <li>• Established employee base with low turnover</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">Have Questions?</h3>
            <p className="text-gray-700 mb-4">
              Whether you're buying or selling, we're here to help. Get our weekly insights 
              and the Top 10 deals every Monday.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/subscribe"
                className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                Subscribe Now
              </Link>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
