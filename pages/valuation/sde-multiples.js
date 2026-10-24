// pages/valuation/sde-multiples.js
// Spoke: "cleaning business SDE multiple" / "how to calculate SDE".
// Explains the number the whole valuation rests on, then shows live
// multiples by SDE band with sample sizes.

import Head from 'next/head';
import BaseStyles from '../../components/BaseStyles';
import { getSiteConfig } from '../../lib/siteConfig';
import { getNationalStats, getSdeBands, isPublishable, MIN_SAMPLE, money, mult, asOf } from '../../lib/marketStats';

const ADD_BACKS = [
  ['Owner’s salary and payroll taxes', 'Everything the business pays you as wages, plus the employer taxes on it.'],
  ['Owner benefits', 'Health insurance, retirement contributions and similar perks paid for the owner.'],
  ['Personal expenses run through the business', 'A personal vehicle, phone, travel or meals that are not needed to run the company.'],
  ['Interest', 'Loan interest, because a buyer will finance the business their own way.'],
  ['Depreciation and amortization', 'Non-cash charges. Buyers look at real equipment replacement separately.'],
  ['One-time costs', 'A lawsuit, a move, a one-off repair. Only genuinely non-recurring items; buyers check.'],
];

export default function SdeMultiples({ cfg, national, bands, generatedAt }) {
  const url = `${cfg.domain}/valuation/sde-multiples`;
  const title = `Cleaning Business SDE Multiples: How to Calculate SDE and What It’s Worth | ${cfg.siteName}`;
  const desc = `How to calculate seller’s discretionary earnings for a cleaning business, and current asking multiples by SDE band: median ${mult(national.median_multiple)} across ${national.sde_sample} listings.`;
  const exampleSde = Math.round(Number(national.median_sde) / 1000) * 1000;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is SDE for a cleaning business?',
        acceptedAnswer: { '@type': 'Answer', text: 'Seller’s discretionary earnings: net profit plus the owner’s salary and benefits, personal expenses paid by the business, interest, depreciation and genuinely one-time costs. It is the total cash benefit one full-time owner-operator takes out of the business, and it is the figure small cleaning businesses are priced on.' },
      },
      {
        '@type': 'Question',
        name: 'What SDE multiple do cleaning businesses sell for?',
        acceptedAnswer: { '@type': 'Answer', text: `Across ${national.sde_sample} active cleaning business listings with reported cash flow, the median asking price is ${mult(national.median_multiple)} SDE. Multiples rise with size; the table on this page shows the range for each SDE band.` },
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </Head>
      <BaseStyles accent={cfg.accent} />
      <main>
        <section className="hero">
          <div className="wrap narrow">
            <p className="eyebrow"><a href="/valuation">Valuation</a> · SDE multiples</p>
            <h1>Cleaning business SDE multiples, and how to calculate your SDE</h1>
            <p className="lede">
              Almost every cleaning business under a few million in revenue is priced as a multiple of
              seller&rsquo;s discretionary earnings. Get the SDE wrong and the multiple does not matter.
            </p>
          </div>
        </section>

        <section>
          <div className="wrap narrow">
            <h2>What SDE is</h2>
            <p>
              SDE is the total cash benefit one full-time owner takes out of the business in a year. Start
              with net profit from your tax return or profit and loss statement, then add back the items a
              new owner would not inherit:
            </p>
            <ul className="addbacks">
              {ADD_BACKS.map(([h, b]) => (
                <li key={h}><strong>{h}.</strong> {b}</li>
              ))}
            </ul>
            <p>
              If you employ a manager who would have to be replaced, their salary stays in as a cost. If you
              have two owners drawing pay, only one owner&rsquo;s compensation is added back; the second is a
              job a buyer would have to fill.
            </p>
          </div>
        </section>

        <section className="estimator">
          <div className="wrap narrow">
            <h2>From SDE to price</h2>
            <p>
              Price is SDE times a multiple. The median listed cleaning business reports about{' '}
              <span className="num">{money(exampleSde, { compact: true })}</span> of SDE and asks{' '}
              <span className="num">{mult(national.median_multiple)}</span>, which puts it around{' '}
              <span className="num">{money(exampleSde * Number(national.median_multiple), { compact: true })}</span>.
              The multiple itself depends mostly on size, then on contracts, owner dependence and how clean the
              books are.
            </p>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>Multiples by SDE band</h2>
            <p className="lede">Active listings with a reported asking price and cash flow. Bands under {MIN_SAMPLE} listings show no median.</p>
            <table className="bands">
              <thead>
                <tr><th scope="col">SDE band</th><th scope="col">Listings</th><th scope="col">Lower</th><th scope="col">Median</th><th scope="col">Upper</th><th scope="col">Median asking</th></tr>
              </thead>
              <tbody>
                {bands.map((b) => {
                  const ok = isPublishable(b.sample_size);
                  return (
                    <tr key={b.band_order}>
                      <th scope="row">{b.band_label}</th>
                      <td className="num">{b.sample_size}</td>
                      <td className="num">{ok ? mult(b.p25_multiple) : '—'}</td>
                      <td className="num strong">{ok ? mult(b.median_multiple) : 'sample too small'}</td>
                      <td className="num">{ok ? mult(b.p75_multiple) : '—'}</td>
                      <td className="num">{ok ? money(b.median_asking_price, { compact: true }) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="sample" style={{ marginTop: 16 }}>
              Run your own number on the <a href="/valuation">valuation calculator</a>, or see multiples for{' '}
              <a href="/valuation/residential">residential</a> and{' '}
              <a href="/valuation/commercial">commercial &amp; janitorial</a> businesses.
            </p>
          </div>
        </section>

        <section>
          <div className="wrap narrow">
            <h2>Mistakes that cost sellers money</h2>
            <p><strong>Adding back things a buyer will still pay for.</strong> If the work still has to be done after you leave, it is a cost, not an add-back. Buyers and lenders remove these during diligence and the price drops with them.</p>
            <p><strong>Unrecorded cash.</strong> Revenue that never reached the tax return cannot be verified or financed, so it adds nothing to what a buyer can pay.</p>
            <p><strong>Using a partial year.</strong> Buyers price on trailing twelve months and the last two to three years of returns. A strong quarter does not reset the number.</p>
          </div>
        </section>

        <section className="cta">
          <div className="wrap narrow">
            <h2>Not sure what your real SDE is?</h2>
            <p>Send us your last two years of returns and a current profit and loss statement. We will recast the SDE the way a buyer will.</p>
            <p><a className="btn" href="/sell">Request a valuation review</a></p>
          </div>
        </section>

        <footer className="foot">
          <div className="wrap">
            <p className="sample">Figures from DealLedger&rsquo;s open dataset of broker listings. Data through {asOf(national.data_through)}; generated {generatedAt}.</p>
          </div>
        </footer>
      </main>
      <style jsx>{`
        .hero { padding-top: 72px; }
        .estimator { background: var(--wash); }
        .addbacks { padding-left: 20px; }
        .addbacks li { margin: 8px 0; }
        table.bands { width: 100%; border-collapse: collapse; margin-top: 28px; }
        table.bands th, table.bands td { text-align: right; padding: 14px 10px; border-bottom: 1px solid var(--rule); }
        table.bands thead th { font-family: var(--data); font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 500; border-bottom: 1px solid var(--ink); }
        table.bands th[scope='row'], table.bands thead th:first-child { text-align: left; font-weight: 500; }
        td.strong { color: var(--accent); font-weight: 600; }
        .cta { background: var(--ink); color: var(--paper); }
        .cta :global(h2) { color: var(--paper); }
        .btn { display: inline-block; background: var(--accent); color: #fff; padding: 14px 28px; border-radius: 2px; font-weight: 600; margin-top: 8px; }
        .btn:hover { text-decoration: none; opacity: 0.92; }
        .foot { padding: 32px 0 64px; }
        @media (max-width: 640px) { table.bands { font-size: 0.85rem; } }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  const cfg = getSiteConfig();
  if (cfg.vertical !== 'cleaning') return { notFound: true };
  const [national, bands] = await Promise.all([getNationalStats(cfg.vertical), getSdeBands(cfg.vertical)]);
  return {
    props: { cfg, national, bands, generatedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
    revalidate: 86400,
  };
}
