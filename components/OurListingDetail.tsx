import Head from 'next/head';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import InquiryForm from './InquiryForm';
import type { OurListing } from '@/data/ourListings';

// In-house (CleaningExits-brokered) listing page. Laid out like the atmbrokerage.com listing
// pages: headline + price, intro, key figures, services, the rest of the write-up, business
// details, then the NDA call to action. Only teaser-level facts live on this page; everything
// else is in the CIM released after the NDA.
//
// `summary` is a small markdown-lite body: blank lines split paragraphs, "## " starts a heading,
// "- " starts a bullet. The first paragraph is the intro and the meta description.

const money = (n: number | null) => (n == null ? '—' : `$${n.toLocaleString('en-US')}`);

type Block = { kind: 'p'; text: string } | { kind: 'h'; text: string } | { kind: 'ul'; items: string[] };

function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let para: string[] = [];
    let bullets: string[] = [];
    const flush = () => {
      if (para.length) blocks.push({ kind: 'p', text: para.join(' ') });
      if (bullets.length) blocks.push({ kind: 'ul', items: bullets });
      para = []; bullets = [];
    };
    for (const l of lines) {
      if (l.startsWith('## ')) { flush(); blocks.push({ kind: 'h', text: l.slice(3) }); }
      else if (l.startsWith('- ')) { if (para.length) { blocks.push({ kind: 'p', text: para.join(' ') }); para = []; } bullets.push(l.slice(2)); }
      else { if (bullets.length) { blocks.push({ kind: 'ul', items: bullets }); bullets = []; } para.push(l); }
    }
    flush();
  }
  return blocks;
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-6 space-y-1.5 text-gray-800">
    {items.map((t) => <li key={t}>{t}</li>)}
  </ul>
);

export default function OurListingDetail({ listing }: { listing: OurListing }) {
  const url = `https://cleaningexits.com/listing/${listing.id}`;
  const blocks = parseBody(listing.summary || '');
  const introIdx = blocks.findIndex((b) => b.kind === 'p');
  const intro = introIdx >= 0 ? (blocks[introIdx] as { text: string }).text : '';
  const rest = blocks.filter((_, i) => i !== introIdx);
  const sold = listing.status === 'sold';
  const underLoi = listing.status === 'under_loi';

  const details: [string, string | null][] = [
    ['Asking Price', money(listing.price)],
    ['Location', listing.location],
    [listing.machineCount ? 'Crews' : '', listing.machineCount ? String(listing.machineCount) : null],
    ['Client Mix', listing.locationTypes],
    ['Schedule', listing.hoursPerWeek],
  ];

  const Cta = ({ big = false }: { big?: boolean }) => sold ? null : (
    <a
      href={listing.ctaHref}
      className={`inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition ${big ? 'py-4 px-8 text-lg' : 'py-3 px-6'}`}
    >
      Request the full details on this listing
    </a>
  );

  return (
    <>
      <Head>
        <title>{`${listing.title} | Cleaning Exits`}</title>
        <meta name="description" content={intro.substring(0, 160)} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={listing.title} />
        <meta property="og:description" content={intro.substring(0, 200)} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={url} />
      </Head>

      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/cleaning-index" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
          ← All cleaning businesses for sale
        </Link>

        <div className="grid lg:grid-cols-3 gap-10 mt-4">
          <article className="lg:col-span-2 space-y-6 leading-relaxed">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Exclusive CleaningExits listing
                </span>
                {underLoi && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Under LOI</span>}
                {sold && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Sold</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{listing.title}</h1>
              <p className="mt-2 text-xl font-bold text-gray-900">
                {listing.category || 'Cleaning Business'} – {money(listing.price)}
              </p>
            </div>

            {intro && <p className="text-gray-800">{intro}</p>}

            {listing.financials.length > 0 && <Bullets items={listing.financials.map((f) => `${f.label}: ${f.value}${f.note ? ` (${f.note})` : ''}`)} />}

            {listing.equipment.length > 0 && (
              <section>
                <h2 className="font-bold text-gray-900 mb-2">The business provides the following services:</h2>
                <Bullets items={listing.equipment} />
              </section>
            )}

            {listing.highlights.length > 0 && (
              <section>
                <h2 className="font-bold text-gray-900 mb-2">Why buyers like it</h2>
                <Bullets items={listing.highlights} />
              </section>
            )}

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Business Details</h2>
              <Bullets items={details.filter(([k, v]) => k && v).map(([k, v]) => `${k}: ${v}`)} />
            </section>

            {rest.map((b, i) =>
              b.kind === 'h' ? <h2 key={i} className="text-xl font-bold text-gray-900 pt-2">{b.text}</h2>
              : b.kind === 'ul' ? <Bullets key={i} items={b.items} />
              : <p key={i} className="text-gray-800">{b.text}</p>
            )}

            {!sold && (
              <section className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <Cta big />
                <p className="mt-4 text-gray-700">
                  The confidential information memorandum — tax-return and P&amp;L financials, the SDE recast,
                  revenue by customer and city, the booked schedule, and staffing and equipment detail — is
                  released after a short confidentiality agreement. There is no cost and no obligation.
                </p>
              </section>
            )}

            <section className="pt-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Questions about this listing?</h2>
              <p className="text-gray-600 mb-4">Send us a note and we'll get back to you within one business day.</p>
              <InquiryForm mode="contact" accent="emerald" />
            </section>
          </article>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 lg:sticky lg:top-6">
              <div className="text-sm text-gray-500">Asking price</div>
              <div className="text-3xl font-bold text-gray-900 mb-4">{money(listing.price)}</div>
              {!sold && <a href={listing.ctaHref} className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition mb-4">{listing.ctaLabel}</a>}
              <ul className="text-sm text-gray-600 space-y-2 mb-5">
                <li className="flex gap-2"><span className="text-emerald-600">✓</span><span>Full CIM after a short NDA</span></li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span><span>No cost, no obligation</span></li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span><span>Questions answered in the deal room</span></li>
              </ul>
              <div className="border-t pt-4 text-sm">
                <div className="text-gray-500 mb-1">Listed by</div>
                <div className="font-semibold text-gray-900">{listing.broker.name}</div>
                <div className="text-gray-600">{listing.broker.firm}</div>
                <a href={`mailto:${listing.broker.email}?subject=${encodeURIComponent(listing.title)}`} className="text-emerald-600 hover:text-emerald-700 block mt-2">{listing.broker.email}</a>
                <a href={`tel:${listing.broker.phone.replace(/\D/g, '')}`} className="text-emerald-600 hover:text-emerald-700 block">{listing.broker.phone}</a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
