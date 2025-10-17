// pages/contact.tsx
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact Us | Cleaning Exits</title>
        <meta name="description" content="Get in touch with Cleaning Exits about buying or selling a cleaning business." />
      </Head>

      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        
        <div className="bg-white rounded-xl border p-8 mb-8">
          <p className="text-lg text-gray-700 mb-6">
            Have questions about a listing? Want to sell your cleaning business? Just want to chat? 
            We're here to help.
          </p>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Email</h2>
              <a 
                href="mailto:hello@cleaningexits.com" 
                className="text-emerald-600 hover:text-emerald-700 text-lg"
              >
                hello@cleaningexits.com
              </a>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">For Buyers</h2>
              <p className="text-gray-600">
                Interested in a specific listing? Just fill out the form on that listing's page 
                and we'll connect you with the broker or answer your questions directly.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">For Sellers</h2>
              <p className="text-gray-600">
                Want to list your cleaning business? Email us at{' '}
                <a href="mailto:hello@cleaningexits.com" className="text-emerald-600 hover:underline">
                  hello@cleaningexits.com
                </a>
                {' '}and we'll get back to you within 24 hours.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">For Brokers</h2>
              <p className="text-gray-600">
                Want to partner with us or get your listings featured? Let's talk.{' '}
                <a href="mailto:hello@cleaningexits.com" className="text-emerald-600 hover:underline">
                  hello@cleaningexits.com
                </a>
              </p>
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
