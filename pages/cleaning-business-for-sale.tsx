// pages/cleaning-business-for-sale.tsx
import Head from "next/head";
import Link from "next/link";
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CleaningBusinessForSale() {
  return (
    <>
      <Head>
        <title>Cleaning Business For Sale | 824+ Verified Commercial Cleaning Businesses</title>
        <meta
          name="description"
          content="Find the right cleaning business for sale. Browse 824+ verified commercial cleaning companies with complete financials. Expert buying guide, valuation tips, and vetted listings from 1,500+ brokers."
        />
        <meta name="keywords" content="cleaning business for sale, commercial cleaning business for sale, janitorial business for sale, buy cleaning business" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Cleaning Business For Sale | 824+ Verified Listings" />
        <meta property="og:description" content="Find verified cleaning businesses for sale. No franchises, no dead listings." />
        <meta property="og:type" content="website" />
        
        {/* Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Cleaning Business For Sale",
            "description": "Complete guide to buying a cleaning business with 824+ verified listings",
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": 824,
              "itemListElement": {
                "@type": "ListItem",
                "name": "Commercial Cleaning Businesses"
              }
            }
          })}
        </script>
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Hero Section */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            Cleaning Business For Sale
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Browse 824+ verified commercial cleaning businesses with transparent financials. 
            No franchises. No maid services. No dead listings.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/cleaning-index"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-white font-semibold shadow-lg hover:bg-emerald-700 transition"
            >
              Browse All Listings →
            </Link>
            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-emerald-600 px-8 py-4 text-emerald-600 font-semibold hover:bg-emerald-50 transition"
            >
              Get Weekly Top 10
            </Link>
          </div>
        </header>

        {/* Stats Bar */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-8 text-white shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">824+</div>
                <div className="text-emerald-100">Verified Listings</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">1,500+</div>
                <div className="text-emerald-100">Broker Sources</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Daily</div>
                <div className="text-emerald-100">Updates</div>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Buy a Cleaning Business?
          </h2>
          <p className="text-gray-700 mb-4">
            The commercial cleaning industry represents one of the most stable and recession-resistant 
            business opportunities available today. With businesses and facilities requiring ongoing 
            maintenance regardless of economic conditions, cleaning businesses offer predictable recurring 
            revenue streams and relatively low overhead compared to other service industries.
          </p>
          <p className="text-gray-700 mb-4">
            Whether you're looking for a small residential cleaning operation that can be run part-time 
            or a large commercial janitorial company with multiple contracts, the cleaning industry offers 
            opportunities at every scale. The barrier to entry is low, but buying an established business 
            gives you immediate cash flow, existing customer relationships, and proven systems.
          </p>
        </section>

        {/* Types of Cleaning Businesses */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Types of Cleaning Businesses For Sale
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Commercial Cleaning</h3>
              <p className="text-gray-600 mb-4">
                Office buildings, retail spaces, and corporate facilities. Typically contract-based 
                with recurring monthly revenue and evening/weekend service schedules.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Recurring contract revenue</li>
                <li>• B2B relationships</li>
                <li>• Scalable operations</li>
                <li>• Property management accounts</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Janitorial Services</h3>
              <p className="text-gray-600 mb-4">
                Schools, medical facilities, industrial spaces. Often includes specialized cleaning 
                requirements and higher margins due to certification needs.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Long-term contracts</li>
                <li>• Government opportunities</li>
                <li>• Specialized services</li>
                <li>• Higher barriers to entry</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Residential Cleaning</h3>
              <p className="text-gray-600 mb-4">
                Home cleaning services with recurring weekly or bi-weekly clients. Lower contract 
                values but highly scalable with the right systems.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Recurring residential accounts</li>
                <li>• Daytime schedules</li>
                <li>• Lower equipment costs</li>
                <li>• Online booking systems</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Specialty Cleaning</h3>
              <p className="text-gray-600 mb-4">
                Carpet cleaning, window washing, pressure washing, post-construction cleanup. 
                Higher margins with specialized equipment and expertise.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Premium pricing</li>
                <li>• Specialized equipment</li>
                <li>• Project-based work</li>
                <li>• Upsell opportunities</li>
              </ul>
            </div>
          </div>
        </section>

        {/* What to Look For */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            What to Look For When Buying a Cleaning Business
          </h2>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Financial Due Diligence</h3>
            <p className="text-gray-700 mb-4">
              The most critical aspect of buying any business is understanding the true financials. 
              For cleaning businesses, focus on:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Recurring Revenue:</strong> What percentage of revenue comes from monthly contracts versus one-time jobs? Higher recurring revenue means more predictable cash flow.</li>
              <li><strong>Customer Concentration:</strong> Is revenue spread across many clients or dependent on a few large accounts? Ideally, no single client represents more than 20% of revenue.</li>
              <li><strong>Contract Terms:</strong> Review actual contracts. How long are terms? What are cancellation clauses? Are contracts transferable to new ownership?</li>
              <li><strong>True Owner Involvement:</strong> How many hours does the current owner work? Are they on the tools cleaning, or managing? This affects the actual cash flow you'll receive.</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Operations Assessment</h3>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Employee Retention:</strong> High turnover is common in cleaning, but the best businesses have long-tenured staff. Check average employee tenure.</li>
              <li><strong>Systems and Processes:</strong> Are operations documented? Is there training material? Software for scheduling and billing? These systems protect value.</li>
              <li><strong>Equipment and Assets:</strong> What equipment is included? What's its condition? Factor in replacement costs for aging equipment.</li>
              <li><strong>Insurance and Licensing:</strong> Verify all required licenses, bonding, and insurance are current and transferable.</li>
            </ul>
          </div>

          <div className="bg-emerald-50 border-l-4 border-emerald-400 p-6 rounded-r-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Growth Potential</h3>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Market Position:</strong> Is the business well-known locally? Strong online reviews? Good reputation makes growth easier.</li>
              <li><strong>Capacity:</strong> Can the business handle more clients with existing staff and equipment? Or is it maxed out?</li>
              <li><strong>Service Expansion:</strong> Are there natural upsell opportunities? Can you add carpet cleaning, window washing, or specialty services?</li>
              <li><strong>Geographic Expansion:</strong> Can you expand to adjacent territories or add locations?</li>
            </ul>
          </div>
        </section>

        {/* Valuation Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            How Are Cleaning Businesses Valued?
          </h2>
          
          <p className="text-gray-700 mb-6">
            Cleaning businesses are typically valued as a multiple of Seller's Discretionary Earnings (SDE), 
            which includes the owner's salary, benefits, and net profit. The multiple varies based on several factors:
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Typical Valuation Multiples</h3>
            
            <div className="space-y-4">
              <div className="border-l-4 border-emerald-500 pl-4">
                <div className="font-bold text-gray-900">2.0x - 2.5x SDE</div>
                <div className="text-gray-600">Small residential or owner-operator businesses with limited systems</div>
              </div>
              
              <div className="border-l-4 border-emerald-500 pl-4">
                <div className="font-bold text-gray-900">2.5x - 3.5x SDE</div>
                <div className="text-gray-600">Established commercial cleaning with good contract mix and some management in place</div>
              </div>
              
              <div className="border-l-4 border-emerald-500 pl-4">
                <div className="font-bold text-gray-900">3.5x - 4.5x SDE</div>
                <div className="text-gray-600">Well-systematized businesses with diversified client base, strong contracts, and minimal owner involvement</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Factors That Increase Value</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Long-term contracts (2+ years)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>High recurring revenue (80%+)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Diversified client base</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Documented systems</span>
                  </li>
                </ul>
              </div>
              <div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Strong management team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Proprietary technology/software</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Strong online presence/reputation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Growth trajectory</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Financing Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Financing Your Cleaning Business Purchase
          </h2>
          
          <p className="text-gray-700 mb-6">
            Most cleaning business acquisitions under $500K are financed through SBA loans, specifically 
            the SBA 7(a) program. These loans allow you to purchase a business with as little as 10% down, 
            making business ownership accessible without requiring substantial capital.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">SBA 7(a) Loans</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 10% down payment typical</li>
                <li>• Up to $5M loan amount</li>
                <li>• 10-year term for business purchases</li>
                <li>• Competitive interest rates</li>
                <li>• Can include working capital</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Seller Financing</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Typically 20-30% of purchase price</li>
                <li>• 3-5 year terms common</li>
                <li>• Shows seller confidence</li>
                <li>• Can bridge financing gaps</li>
                <li>• Often subordinated to SBA loan</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
            <p className="text-gray-700 mb-2">
              <strong>Example:</strong> A $300K cleaning business with $100K SDE
            </p>
            <ul className="space-y-1 text-gray-700">
              <li>• Purchase Price: $300,000</li>
              <li>• SBA Loan (90%): $270,000</li>
              <li>• Your Down Payment (10%): $30,000</li>
              <li>• Monthly Loan Payment: ~$3,200</li>
              <li>• Monthly Cash Flow (after debt service): ~$5,100</li>
            </ul>
          </div>
        </section>

        {/* Why CleaningExits */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Why Use CleaningExits to Find Your Cleaning Business?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Listings Only</h3>
              <p className="text-gray-600">
                Every listing is verified from actual business brokers. No franchise lead funnels, 
                no fake listings, no "opportunities" that don't exist. Just real businesses for sale.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Coverage</h3>
              <p className="text-gray-600">
                We aggregate from 1,500+ business brokers nationwide, giving you access to far more 
                listings than any single broker or marketplace. See the entire market in one place.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Updated Daily</h3>
              <p className="text-gray-600">
                New listings added every day. Dead listings removed immediately. Get real-time access 
                to the freshest opportunities before they're gone.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">✂️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No Noise</h3>
              <p className="text-gray-600">
                We filter out residential maid services, franchise opportunities, and other noise. 
                Focus on commercial cleaning businesses with real enterprise value.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 md:p-12 text-white text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Cleaning Business?
            </h2>
            <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
              Browse 824+ verified listings from commercial janitorial companies to specialty 
              cleaning services. Start your search today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cleaning-index"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-emerald-600 font-bold shadow-lg hover:bg-gray-50 transition"
              >
                Browse All 824+ Listings →
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 border-2 border-white px-8 py-4 text-white font-bold hover:bg-emerald-800 transition"
              >
                Get Weekly Top 10
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                How much does it cost to buy a cleaning business?
              </h3>
              <p className="text-gray-700">
                Cleaning businesses range from $50,000 for small residential operations to $2M+ for 
                large commercial janitorial companies. Most businesses are priced between $150K-$500K 
                and valued at 2-4x annual cash flow (SDE). With SBA financing, you can acquire a business 
                with 10% down.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Do I need experience in cleaning to buy a cleaning business?
              </h3>
              <p className="text-gray-700">
                No prior cleaning experience is required, especially for commercial operations where 
                you'll be managing rather than performing the work. However, understanding the operations, 
                quality standards, and customer service expectations is important. Many buyers spend time 
                shadowing the current owner during transition.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What's the difference between a cleaning business and a janitorial business?
              </h3>
              <p className="text-gray-700">
                The terms are often used interchangeably, but "janitorial" typically refers to commercial 
                and institutional cleaning (offices, schools, medical facilities) while "cleaning business" 
                can include residential services. Janitorial businesses usually have higher contract values, 
                longer terms, and more predictable revenue.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                How long does it take to close on a cleaning business purchase?
              </h3>
              <p className="text-gray-700">
                From accepted offer to closing typically takes 60-90 days. This includes due diligence 
                (2-4 weeks), SBA loan approval (4-6 weeks), and final closing preparations. All-cash 
                purchases can close much faster, sometimes in 30 days.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Will customers stay after I buy the business?
              </h3>
              <p className="text-gray-700">
                Commercial cleaning businesses typically have high customer retention through ownership 
                transitions, especially when contracts are in place. The key is maintaining service quality 
                and building relationships during the transition period. Retention rates of 80-90% are 
                common with proper transition planning.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Start Your Search Today
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of buyers who use CleaningExits to find verified cleaning business 
            opportunities. Updated daily with new listings.
          </p>
          <Link
            href="/cleaning-index"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-white font-semibold shadow-lg hover:bg-emerald-700 transition"
          >
            View All Listings →
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
