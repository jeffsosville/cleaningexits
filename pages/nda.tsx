import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { getOurListingById, type OurListing } from '@/data/ourListings';
import { NDA_AGREEMENT_TEXT } from '@/lib/nda/ndaTerms';

type Props = {
  listing: Pick<OurListing, 'id' | 'title' | 'location'> & {
    priceDisplay: string | null;
  };
};

const BUDGETS = [
  'Under $100k',
  '$100k - $250k',
  '$250k - $500k',
  '$500k+',
  'Prefer not to say',
];

export default function NdaPage({ listing }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/listing-nda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: fd.get('buyer_name'),
          buyer_email: fd.get('buyer_email'),
          buyer_phone: fd.get('buyer_phone'),
          buyer_company: fd.get('buyer_company'),
          buyer_budget_range: fd.get('buyer_budget_range'),
          interest_notes: fd.get('interest_notes'),
          agree_nda: fd.get('agree_nda') === 'on',
          website: fd.get('website') || '',
          source_listing_slug: listing.id,
          source_url: `https://cleaningexits.com/listing/${listing.id}`,
          listing_title: listing.title,
          listing_asking_price_display: listing.priceDisplay,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Submission failed');
      setDone(body.dealHubUrl || null);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
  const label = 'block text-sm font-medium text-gray-800 mb-1.5';

  if (done) {
    return (
      <>
        <Head><title>NDA received | Cleaning Exits</title></Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white border rounded-lg p-8 max-w-lg text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              You&apos;re all set
            </h1>
            <p className="text-gray-700 mb-6">
              Your NDA is on file and we&apos;ve emailed you a link to the data
              room for {listing.title}. Check your inbox &mdash; and your spam
              folder, just in case.
            </p>
            {done && (
              <a
                href={done}
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Open the Data Room
              </a>
            )}
            <div className="mt-6">
              <Link href={`/listing/${listing.id}`} className="text-emerald-600 hover:text-emerald-700 text-sm">
                Back to the listing
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sign NDA | {listing.title} | Cleaning Exits</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <Link href={`/listing/${listing.id}`} className="text-emerald-600 hover:text-emerald-700 font-semibold">
              &larr; Back to the listing
            </Link>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Request the full package
          </h1>
          <p className="text-gray-600 mb-8">
            {listing.title}
            {listing.priceDisplay ? ` \u2014 ${listing.priceDisplay}` : ''}
          </p>

          <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-5">
            {/* Honeypot — hidden from humans, catnip for bots */}
            <input
              type="text" name="website" tabIndex={-1} autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] w-px h-px opacity-0"
            />

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={label} htmlFor="buyer_name">Full name *</label>
                <input id="buyer_name" name="buyer_name" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="buyer_email">Email *</label>
                <input id="buyer_email" name="buyer_email" type="email" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="buyer_phone">Phone *</label>
                <input id="buyer_phone" name="buyer_phone" type="tel" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="buyer_company">Company</label>
                <input id="buyer_company" name="buyer_company" className={input} />
              </div>
            </div>

            <div>
              <label className={label} htmlFor="buyer_budget_range">Budget range</label>
              <select id="buyer_budget_range" name="buyer_budget_range" className={input} defaultValue="">
                <option value="">Select one</option>
                {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className={label} htmlFor="interest_notes">
                What are you looking for?
              </label>
              <textarea
                id="interest_notes" name="interest_notes" rows={4} className={input}
                placeholder="Timeline, experience in commercial cleaning, financing, anything else worth knowing."
              />
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="agree_nda" required className="mt-1 h-4 w-4 accent-emerald-600" />
                <span className="text-sm text-gray-700 leading-relaxed">
                  {NDA_AGREEMENT_TEXT}
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-lg transition"
            >
              {submitting ? 'Submitting\u2026' : 'Sign NDA & Get Access'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Checking the box above is an electronic signature. We record the
              date, your IP address, and the exact terms you agreed to.
            </p>
          </form>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = typeof ctx.query.listing === 'string' ? ctx.query.listing : '';
  const listing = await getOurListingById(slug);
  if (!listing) return { notFound: true };

  return {
    props: {
      listing: {
        id: listing.id,
        title: listing.title,
        location: listing.location,
        priceDisplay: listing.price
          ? `$${listing.price.toLocaleString('en-US')}`
          : null,
      },
    },
  };
};
