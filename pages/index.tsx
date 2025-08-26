// pages/index.tsx
import Link from "next/link";
import Head from "next/head";

export default function CleaningIndexPage() {
  return (
    <>
      <Head>
        <title>The Cleaning Index</title>
        <meta name="description" content="Verified cleaning & related service listings with real sources and financials." />
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">🧼 The Cleaning Index</h1>

        <p className="mb-4 text-lg">
          We audited hundreds of cleaning business listings across marketplaces and broker sites.
          Here’s what we found—and why most listings aren’t what they seem.
        </p>

        <div className="overflow-x-auto mb-8">
          <table className="table-auto w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Category</th>
                <th className="border px-4 py-2 text-right">Count</th>
                <th className="border px-4 py-2 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border px-4 py-2">Total Listings Audited</td><td className="border px-4 py-2 text-right">782</td><td className="border px-4 py-2 text-right">100.00%</td></tr>
              <tr><td className="border px-4 py-2">Matched to Broker Site</td><td className="border px-4 py-2 text-right">431</td><td className="border px-4 py-2 text-right">55.10%</td></tr>
              <tr><td className="border px-4 py-2">With Broker + Financials</td><td className="border px-4 py-2 text-right">278</td><td className="border px-4 py-2 text-right">35.54%</td></tr>
              <tr><td className="border px-4 py-2">Unmatched / FSBO</td><td className="border px-4 py-2 text-right">351</td><td className="border px-4 py-2 text-right">44.90%</td></tr>
              <tr><td className="border px-4 py-2">FSBO + Financials</td><td className="border px-4 py-2 text-right">82</td><td className="border px-4 py-2 text-right">10.49%</td></tr>
              <tr className="font-bold bg-yellow-50">
                <td className="border px-4 py-2">Fully Real Listings (Broker or FSBO + Financials)</td>
                <td className="border px-4 py-2 text-right">360</td>
                <td className="border px-4 py-2 text-right">46.01%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mb-6">
          Less than half of all cleaning listings we reviewed had a real source and financials.
          Most are dead, duplicated, or lack meaningful information.
        </p>

        <p className="mb-8 text-lg font-medium">
          You’re not browsing 782 listings. You’re browsing ~360 that are truly actionable.
        </p>

        <Link
          href="/daily-cleaning"
          className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg shadow hover:bg-green-800 transition"
        >
          🔎 View Today&apos;s Verified Cleaning Listings
        </Link>
      </div>
    </>
  );
}
