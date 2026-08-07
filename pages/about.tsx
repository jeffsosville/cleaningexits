// pages/about.tsx
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us | Cleaning Exits</title>
        <meta
          name="description"
          content="Cleaning Exits is a data-first marketplace for buying and selling commercial cleaning businesses. Here's who we are and why we built it."
        />
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">About Cleaning Exits</h1>

        <div className="bg-white rounded-xl border p-8 mb-8">
          <p className="text-lg text-gray-700 mb-6">
            Cleaning Exits exists because the market for small cleaning businesses is
            opaque by default. Listings go stale and stay up. The same business gets
            relisted three times under three different brokers. Asking prices float
            free of any multiple anyone can defend. Buyers waste months chasing deals
            that closed last spring.
          </p>

          <p className="text-gray-700 mb-6">
            We started by building the data layer instead of the storefront. Every
            listing on this site is pulled directly from broker sources, checked for
            freshness, scored, and dated. When a listing goes quiet, we say so. When
            we can't verify something, we don't print it.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              How we think about a deal
            </p>
            <p className="text-gray-700">
              We create competition to drive the price up, and we protect both the
              buyer and the seller. Those two things sound like they're in tension.
              They aren't. A deal that falls apart in diligence is worse for everyone
              than a deal that was priced honestly on day one.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Who's behind it</h2>

          <div className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="text-xl font-semibold mb-3">Jeff Sosville</h3>
            <p className="text-gray-700 mb-4">
              Jeff started brokering ATMs in 2013 and spent the next decade building
              that business into the dominant player in its category — 200+ closed
              transactions, north of $100M in total value. He got there the boring
              way: systematic outreach, showing up at every trade show, and knowing
              more about what things actually sold for than anyone else in the room.
            </p>
            <p className="text-gray-700">
              That last part turned into the thesis for everything since. Jeff taught
              himself Python, React, and Postgres so he could build the data
              infrastructure behind Cleaning Exits rather than rent it — the scrapers,
              the freshness monitoring, the relist detection, and the listing quality
              scoring that runs under every page on this site. He focuses on the
              platform and the data. Find a fragmented, opaque market, build the
              definitive record of what's really happening in it, and the transactions
              follow.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">John Sosville</h3>
            {/* VERIFY: years in market and deal count below are placeholders. */}
            <p className="text-gray-700 mb-4">
              John came up in Main Street M&amp;A and has spent more than a decade on
              the transaction side of owner-operated businesses — the sub-$10M deals
              that private equity ignores and most brokers handle badly. He's
              represented sellers across service, route, and equipment-based
              businesses, and he's sat on the buy side often enough to know exactly
              which questions a seller hopes nobody asks.
            </p>
            <p className="text-gray-700">
              His work here is the transaction itself: pricing a business against what
              comparable companies actually closed at rather than what they were
              listed for, structuring around the earn-outs and seller notes that get
              deals financed, running the diligence process so it doesn't stall at week
              six, and managing the human parts — the key employee who needs to stay,
              the owner who isn't as ready to leave as he says he is. He's turned down
              more listings than he's taken. A business that isn't ready to sell is a
              business that will sit on the market for a year and close for less.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">What we don't do</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold text-xl">—</span>
              <div>
                We don't sell buyer leads. Your information doesn't get resold to a
                list of brokers who'll call you for a year.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold text-xl">—</span>
              <div>
                We don't pad the listing count. If a business is under contract or the
                listing has gone stale, it gets marked, not buried.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold text-xl">—</span>
              <div>
                We don't charge buyers. Our compensation comes from the sell side, so
                the guidance costs you nothing.
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Want to talk?</h2>
          <p className="text-gray-700 mb-6">
            Buying, selling, or just want to know what your business is actually
            worth — we'll give you a real answer.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
            >
              Get in Touch
            </Link>
            <Link
              href="/cleaning-index"
              className="inline-block px-6 py-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:border-emerald-600 hover:text-emerald-700 transition"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
