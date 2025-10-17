// pages/sell.tsx
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Sell() {
  return (
    <>
      <Head>
        <title>Sell Your Cleaning Business | Cleaning Exits</title>
        <meta name="description" content="Get your commercial cleaning business in front of thousands of serious buyers." />
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Sell Your Cleaning Business</h1>
        
        <div className="bg-white rounded-xl border p-8 mb-8">
          <p className="text-lg text-gray-700 mb-6">
            Get your commercial cleaning business in front of thousands of qualified buyers 
            who are actively looking for opportunities like yours.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Why List With Us?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>Targeted Audience</strong> - Our subscribers are specifically looking 
                  for commercial cleaning businesses
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>Weekly Exposure</strong> - Featured in our Top 10 email to thousands of buyers
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>Verified Buyers</strong> - We work with serious buyers, not tire-kickers
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">✓</span>
                <div>
                  <strong>Fast Process</strong> - Get in front of buyers quickly
                </div>
              </li>
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Contact Us</h3>
                  <p className="text-gray-600">
                    Email us at hello@cleaningexits.com with basic details about your business
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">We Review</h3>
                  <p className="text-gray-600">
                    We'll review your business to ensure it meets our criteria
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Get Listed</h3>
                  <p className="text-gray-600">
                    Your business goes live on our site and in our weekly emails
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Connect With Buyers</h3>
                  <p className="text-gray-600">
                    We connect you with qualified buyers interested in your business
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">What We Need</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Business location</li>
              <li>• Annual revenue</li>
              <li>• Cash flow / SDE</li>
              <li>• Asking price</li>
              <li>• Brief description of operations</li>
              <li>• Number of employees (if applicable)</li>
              <li>• Year established</li>
            </ul>
          </div>

          <div className="text-center">
            <a
              href="mailto:hello@cleaningexits.com?subject=Interested in Listing My Cleaning Business"
              className="inline-block px-8 py-4 bg-emerald-600 text-white font-bold text-lg rounded-lg hover:bg-emerald-700 transition"
            >
              Get Started - Email Us
            </a>
            <p className="mt-4 text-sm text-gray-600">
              Or email us directly at{' '}
              <a href="mailto:hello@cleaningexits.com" className="text-emerald-600 hover:underline">
                hello@cleaningexits.com
              </a>
            </p>
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
