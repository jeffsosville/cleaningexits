// pages/index.tsx
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Cleaning Exits</title>
        <meta
          name="description"
          content="Verified cleaning & services listings, daily feed + indexed analysis."
        />
      </Head>

      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight mb-4">
              🧼 Cleaning Exits
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Find real, actionable cleaning & related service listings. Daily
              verified feed + a curated index.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cleaning-index"
                className="inline-block rounded-lg px-6 py-3 bg-green-700 text-white font-semibold shadow hover:bg-green-800 transition"
              >
                🔎 View Today’s Listings
              </Link>
              <Link
                href="/cleaning-index"
                className="inline-block rounded-lg px-6 py-3 bg-gray-900 text-white font-semibold shadow hover:bg-black transition"
              >
                📚 Explore the Index
              </Link>
            </div>

            <div className="mt-4">
              <Link
                href="/subscribe"
                className="text-sm text-gray-600 underline underline-offset-2"
              >
                Prefer email? Get the daily list →
              </Link>
            </div>
          </div>
        </section>

        {/* Quick cards */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid sm:grid-cols-2 gap-6">
            <Link
              href="/cleaning-index"
              className="block border rounded-2xl p-6 hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">
                Daily Cleaning Listings
              </h2>
              <p className="text-gray-600">
                Fresh, verified listings pulled from our broker matching. Prefer
                direct sources over marketplace noise.
              </p>
            </Link>

            <Link
              href="/cleaning-index"
              className="block border rounded-2xl p-6 hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">The Cleaning Index</h2>
              <p className="text-gray-600">
                Our audited index: which listings are real, which have
                financials, and where to find the originals.
              </p>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t">
          <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-gray-500">
            Built for speed and signal. No fluff.
          </div>
        </footer>
      </main>
    </>
  );
}
