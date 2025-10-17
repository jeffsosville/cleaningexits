// pages/terms.tsx
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | Cleaning Exits</title>
        <meta name="description" content="Terms of Service for Cleaning Exits" />
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none bg-white rounded-xl border p-8">
          <p className="text-sm text-gray-600 mb-6">Last updated: October 17, 2025</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using cleaningexits.com (the "Site"), you accept and agree to be bound 
            by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not 
            use the Site.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Description of Service</h2>
          <p className="text-gray-700">
            Cleaning Exits provides a platform for aggregating and displaying commercial cleaning 
            business listings from various sources. We also provide email newsletters and related 
            services.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. No Broker-Dealer Relationship</h2>
          <p className="text-gray-700">
            Cleaning Exits is NOT a licensed business broker or dealer. We do not represent buyers 
            or sellers in transactions. We simply aggregate publicly available listing information 
            and connect interested parties. Any transaction is between you and the listing broker 
            or seller directly.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Accuracy of Information</h2>
          <p className="text-gray-700 mb-4">
            While we strive to provide accurate and up-to-date information, we do not guarantee the 
            accuracy, completeness, or reliability of any listings or information on the Site. 
            Listings are sourced from third parties, and we are not responsible for errors or 
            omissions.
          </p>
          <p className="text-gray-700">
            <strong>You should always conduct your own due diligence before making any business 
            purchase decision.</strong>
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. No Investment Advice</h2>
          <p className="text-gray-700">
            Nothing on this Site constitutes investment, legal, tax, or financial advice. You should 
            consult with appropriate professionals before making any business acquisition decisions.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. User Conduct</h2>
          <p className="text-gray-700 mb-3">You agree not to:</p>
          <ul className="text-gray-700 space-y-2 ml-6">
            <li>• Use the Site for any illegal purpose</li>
            <li>• Scrape, copy, or reproduce listings without permission</li>
            <li>• Impersonate others or provide false information</li>
            <li>• Interfere with the Site's operation or security</li>
            <li>• Use automated systems to access the Site without permission</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Intellectual Property</h2>
          <p className="text-gray-700">
            The Site and its content (excluding third-party listings) are owned by Cleaning Exits 
            and protected by copyright and other intellectual property laws. You may not reproduce, 
            distribute, or create derivative works without our permission.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Third-Party Links</h2>
          <p className="text-gray-700">
            Our Site contains links to third-party websites (including listing broker sites). We are 
            not responsible for the content or practices of these sites.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Disclaimer of Warranties</h2>
          <p className="text-gray-700">
            THE SITE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE 
            DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
            AND NON-INFRINGEMENT.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">10. Limitation of Liability</h2>
          <p className="text-gray-700">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLEANING EXITS SHALL NOT BE LIABLE FOR ANY 
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS 
            OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR OTHER 
            INTANGIBLE LOSSES.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">11. Indemnification</h2>
          <p className="text-gray-700">
            You agree to indemnify and hold harmless Cleaning Exits from any claims, damages, losses, 
            or expenses arising from your use of the Site or violation of these Terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">12. Changes to Terms</h2>
          <p className="text-gray-700">
            We reserve the right to modify these Terms at any time. We will post the updated Terms 
            on this page with a new "Last updated" date. Your continued use of the Site after changes 
            constitutes acceptance of the new Terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">13. Termination</h2>
          <p className="text-gray-700">
            We may terminate or suspend your access to the Site at any time, without notice, for any 
            reason, including violation of these Terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">14. Governing Law</h2>
          <p className="text-gray-700">
            These Terms are governed by the laws of the State of New York, without regard to conflict 
            of law principles. Any disputes shall be resolved in the courts located in Buffalo, New York.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">15. Contact</h2>
          <p className="text-gray-700">
            If you have questions about these Terms, please contact us at:
          </p>
          <p className="text-gray-700 mt-2">
            <strong>Email:</strong> hello@cleaningexits.com
          </p>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
