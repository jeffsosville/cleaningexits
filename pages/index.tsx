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
                href="/daily-cleaning"
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
          </div>
        </section>
      </main>
    </>
  );
}
