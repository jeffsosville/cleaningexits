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
        
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-xl border p-8 mb-8">
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

          <div className="bg-white rounded-xl border p-8 mb-8">
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

          <div className="bg-white rounded-xl border p-8 mb-8">
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
                  that don't meet our
