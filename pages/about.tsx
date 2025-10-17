// pages/about.tsx
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function About() {
  return (
    <>
      <Head>
        <title>About | Cleaning Exits</title>
        <meta name="description" content="Cleaning Exits is the most comprehensive database of commercial cleaning businesses for sale. No franchises, no BS." />
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">About Cleaning Exits</h1>
        
        <div className="space-y-8">
          <div className="bg-white rounded-xl border p-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              Finding a legitimate commercial cleaning business to buy is harder than it should be. 
              Most marketplaces are cluttered with franchises, dead listings, and residential maid services.
            </p>
            <p className="text-gray-700 mb-4">
              We built Cleaning Exits to solve that problem.
            </p>
            <p className="text-gray-700">
              We aggregate listings from hundreds of brokers, verify the data, filter out the noise, 
              and deliver only real commercial cleaning opportunities to serious buyers.
            </p>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <h2 className="text-2xl font-bold mb-4">What Makes Us Different</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>No Franchises</strong> - Only independently owned businesses
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>Commercial Only</strong> - No residential maid services
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>Verified & Updated</strong> - We check listings daily
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>Comprehensive</strong> - 800+ verified listings from hundreds of sources
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>No Lead-Gen BS</strong> - Real listings from real brokers
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. We Aggregate</h3>
                <p className="text-gray-700">
                  Our system monitors hundreds of business brokers and marketplaces daily, 
                  capturing every new cleaning business listing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">2. We Filter</h3>
                <p className="text-gray-700">
                  We automatically remove franchises, residential services, and other businesses 
                  that don't meet our criteria for commercial cleaning businesses.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">3. We Verify</h3>
                <p className="text-gray-700">
                  Each listing is checked for accuracy and completeness. Dead listings are removed.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">4. We Deliver</h3>
                <p className="text-gray-700">
                  Every week, we curate the Top 10 best opportunities and send them to our subscribers. 
                  Plus, you get access to our full index of 800+ verified listings.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-8">
            <h2 className="text-2xl font-bold mb-4">Who We Help</h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                <strong>Buyers:</strong> Entrepreneurs, searchers, and investors looking for 
                profitable cleaning businesses without wasting time on junk listings.
              </p>
              <p className="text-gray-700">
                <strong>Sellers:</strong> Business owners who want exposure to serious, 
                qualified buyers.
              </p>
              <p className="text-gray-700">
                <strong>Brokers:</strong> Professionals who want their quality listings in 
                front of our growing audience of buyers.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <h2 className="text-2xl font-bold mb-4">Get Started</h2>
            <p className="text-gray-700 mb-6">
              Join thousands of buyers who trust Cleaning Exits to find their next acquisition.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/subscribe"
                className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                Subscribe to Weekly Top 10
              </Link>
              <Link
                href="/cleaning-index"
                className="inline-block px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Browse All Listings
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
