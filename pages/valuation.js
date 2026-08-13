// pages/valuation.js
// Primary seller-intent page. Target queries:
//   "what is my cleaning business worth" / "cleaning business valuation multiple"
//   "what is my vending route worth" / "vending route valuation"
//
// Signature element: the range strip. Competitors publish a made-up point
// estimate ("3-5x SDE"). We publish p25/median/p75 with the sample size on
// every figure, and suppress any band under MIN_SAMPLE observations.

import Head from 'next/head';
import { useState, useMemo } from 'react';
import BaseStyles from '../components/BaseStyles';
import { getSiteConfig } from '../lib/siteConfig';
import {
  getNationalStats,
  getSdeBands,
  isPublishable,
  MIN_SAMPLE,
  money,
  mult,
  asOf,
} from '../lib/marketStats';

export default function ValuationPage({ cfg, national, bands, generatedAt }) {
  const [sde, setSde] = useState('');

  const numericSde = useMemo(() => {
    const n = Number(String(sde).replace(/[^0-9.]/g, ''));
    return isFinite(n) && n > 0 ? n : null;
  }, [sde]);

  const activeBand = useMemo(() => {
    if (!numericSde) return null;
    if (numericSde < 75000) return bands.find((b) => b.band_order === 1);
    if (numericSde < 150000) return bands.find((b) => b.band_order === 2);
    if (numericSde < 300000) return bands.find((b) => b.band_order === 3);
    if (numericSde < 500000) return bands.find((b) => b.band_order === 4);
    return bands.find((b) => b.band_order === 5);
  }, [numericSde, bands]);

  const estimate = useMemo(() => {
    if (!numericSde || !activeBand || !isPublishable(activeBand.sample_size)) return null;
    return {
      low: numericSde * Number(activeBand.p25_multiple),
      mid: numericSde * Number(activeBand.median_multiple),
      high: numericSde * Number(activeBand.p75_multiple),
      band: activeBand,
    };
  }, [numericSde, activeBand]);

  const title = `${cfg.valuationH1} | ${cfg.siteName}`;
  const desc = `Median ${mult(national.median_multiple)} SDE across ${national.sde_sample} ${cfg.businessNoun} listings. Real valuation ranges by business size, updated from live and closed listings.`;

  // FAQ schema targets the People Also Ask block for these queries.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: cfg.valuationH1,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Across ${national.sde_sample} listed ${cfg.businessNounPlural} with reported cash flow, the median asking price is ${mult(national.median_multiple)} seller's discretionary earnings. Smaller operations trade lower and larger ones higher; the full range by size band is published on this page.`,
        },
      },
      {
        '@type': 'Question',
        name: `How long does it take to sell a ${cfg.businessNoun}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Listings that actually closed spent a median of ${national.median_dom_sold} days on market. Figures based on currently active listings understate this substantially, because listings still on the market are measured mid-run rather than at completion.`,
        },
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={`${cfg.domain}/valuation`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </Head>
      <BaseStyles accent={cfg.accent} />

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow">{cfg.siteName} · Valuation Data</p>
            <h1>{cfg.valuationH1}</h1>
            <p className="lede">{cfg.valuationLede}</p>

            <div className="topline">
              <Stat
                label="Median multiple"
                value={mult(national.median_multiple)}
                sample={`${national.sde_sample} listings with reported SDE`}
                big
              />
              <Stat
                label="Median asking price"
                value={money(national.median_asking_price, { compact: true })}
                sample={`${national.active_count} active listings`}
              />
              <Stat
                label="Median SDE"
                value={money(national.median_sde, { compact: true })}
                sample={`${national.sde_sample} listings`}
              />
            </div>
          </div>
        </section>

        {/* Signature: the estimator. Returns a range, never a single number. */}
        <section className="estimator">
          <div className="wrap">
            <h2>Find your range</h2>
            <p className="lede">
              Enter your seller&rsquo;s discretionary earnings &mdash; net profit plus your own
              salary, personal expenses run through the business, interest, depreciation, and
              one-time costs.
            </p>

            <div className="input-row">
              <label htmlFor="sde">Annual SDE</label>
              <div className="field">
                <span className="prefix num">$</span>
                <input
                  id="sde"
                  type="text"
                  inputMode="numeric"
                  placeholder="150,000"
                  value={sde}
                  onChange={(e) => setSde(e.target.value)}
                  className="num"
                />
              </div>
            </div>

            {estimate && (
              <div className="result">
                <p className="eyebrow">
                  Based on {estimate.band.sample_size} listings in the{' '}
                  {estimate.band.band_label} band
                </p>
                <div className="range">
                  <div className="range-end">
                    <span className="sample">Lower quartile</span>
                    <span className="num range-val">{money(estimate.low, { compact: true })}</span>
                    <span className="sample">{mult(estimate.band.p25_multiple)}</span>
                  </div>
                  <div className="range-bar" aria-hidden="true">
                    <div className="range-fill" />
                    <div className="range-mid" />
                  </div>
                  <div className="range-end">
                    <span className="sample">Upper quartile</span>
                    <span className="num range-val">{money(estimate.high, { compact: true })}</span>
                    <span className="sample">{mult(estimate.band.p75_multiple)}</span>
                  </div>
                </div>
                <p className="midline">
                  Median: <span className="num">{money(estimate.mid, { compact: true })}</span>{' '}
                  <span className="sample">at {mult(estimate.band.median_multiple)} SDE</span>
                </p>
                <p className="caveat">
                  This is where comparable businesses are <em>asking</em>, not what yours will
                  close at. Half of listed businesses fall outside this range. What moves you
                  within it is below.
                </p>
              </div>
            )}

            {numericSde && activeBand && !isPublishable(activeBand.sample_size) && (
              <div className="result thin">
                <p>
                  Only {activeBand.sample_size} listings currently sit in the{' '}
                  {activeBand.band_label} band &mdash; below the {MIN_SAMPLE}-observation minimum
                  for publishing a median. Rather than print a number three listings wide, we
                  will hold this until the sample fills in.
                </p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>Multiples by business size</h2>
            <p className="lede">
              Size is the single largest determinant of multiple. Bands below the{' '}
              {MIN_SAMPLE}-listing minimum are shown with sample size and no median.
            </p>

            <table className="bands">
              <thead>
                <tr>
                  <th scope="col">SDE band</th>
                  <th scope="col">Listings</th>
                  <th scope="col">Lower</th>
                  <th scope="col">Median</th>
                  <th scope="col">Upper</th>
                </tr>
              </thead>
              <tbody>
                {bands.map((b) => {
                  const ok = isPublishable(b.sample_size);
                  return (
                    <tr key={b.band_order} className={ok ? '' : 'suppressed'}>
                      <th scope="row">{b.band_label}</th>
                      <td className="num">{b.sample_size}</td>
                      <td className="num">{ok ? mult(b.p25_multiple) : '—'}</td>
                      <td className="num strong">{ok ? mult(b.median_multiple) : 'sample too small'}</td>
                      <td className="num">{ok ? mult(b.p75_multiple) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>What moves you within the range</h2>
            <div className="drivers">
              {cfg.drivers.map((d) => (
                <div key={d.title} className="driver">
                  <h3>{d.title}</h3>
                  <p>{d.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dom">
          <div className="wrap narrow">
            <p className="eyebrow">A correction</p>
            <h2>How long a sale actually takes</h2>
            <p>
              Active listings in this market show a median of{' '}
              <span className="num">{national.median_dom_active}</span> days on market. Listings
              that actually sold show{' '}
              <span className="num hot">{national.median_dom_sold}</span> days.
            </p>
            <p>
              Both numbers are correct and they measure different things. Anything still listed is
              being measured partway through its run, which drags the figure down. Only completed
              sales tell you how long the process takes. Most published &ldquo;days on
              market&rdquo; statistics use the first method, which is why the number you have
              probably seen is roughly{' '}
              <span className="num">
                {Math.round(national.median_dom_sold / Math.max(national.median_dom_active, 1))}×
              </span>{' '}
              too low.
            </p>
            <p className="sample">
              Based on {national.active_count} active and {national.sold_count} closed listings
              across {national.broker_count} brokerages. Data through {asOf(national.data_through)}.
            </p>
          </div>
        </section>

        <section className="cta">
          <div className="wrap narrow">
            <h2>Where your business actually lands</h2>
            <p>
              The range above is what comparable businesses are asking. What yours is worth
              depends on contract quality, owner dependence, and how the books present &mdash;
              none of which a calculator can see.
            </p>
            <p>
              <a className="btn" href="/valuation-review">
                Request a valuation review
              </a>
            </p>
            <p className="sample">
              No cost, no listing agreement. We look at your numbers and tell you where you sit.
            </p>
          </div>
        </section>

        <footer className="foot">
          <div className="wrap">
            <p className="sample">
              Figures derived from DealLedger, an open dataset of business-for-sale listings
              compiled from {national.broker_count} brokerage sources. Statistics on this page are
              released under CC0 and may be republished with attribution to {cfg.siteName}.
              Generated {generatedAt}.
            </p>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .hero { padding-top: 72px; }
        .topline {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 32px;
          margin-top: 48px;
          padding-top: 32px;
          border-top: 2px solid var(--ink);
        }
        .estimator { background: var(--wash); }
        .input-row { margin: 32px 0 0; max-width: 380px; }
        label {
          display: block;
          font-family: var(--data);
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .field {
          display: flex;
          align-items: center;
          background: var(--paper);
          border: 1px solid var(--rule);
          border-radius: 2px;
          padding: 0 16px;
        }
        .prefix { color: var(--muted); font-size: 1.4rem; }
        input {
          flex: 1;
          border: 0;
          background: transparent;
          padding: 16px 8px;
          font-size: 1.6rem;
          color: var(--ink);
          width: 100%;
        }
        input:focus { outline: none; }
        .field:focus-within { border-color: var(--accent); }

        .result {
          margin-top: 40px;
          background: var(--paper);
          border: 1px solid var(--rule);
          border-left: 3px solid var(--accent);
          padding: 28px;
        }
        .result.thin { border-left-color: var(--muted); }
        .range {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 20px;
          margin: 20px 0;
        }
        .range-end { display: flex; flex-direction: column; gap: 3px; }
        .range-val { font-size: 1.9rem; }
        .range-bar { position: relative; height: 4px; background: var(--rule); }
        .range-fill {
          position: absolute;
          inset: 0;
          background: var(--accent);
          opacity: 0.35;
        }
        .range-mid {
          position: absolute;
          left: 50%;
          top: -6px;
          width: 2px;
          height: 16px;
          background: var(--accent);
        }
        .midline { margin: 4px 0 16px; font-size: 1.05rem; }
        .caveat {
          margin: 0;
          font-size: 0.92rem;
          color: var(--muted);
          border-top: 1px solid var(--rule);
          padding-top: 14px;
        }

        table.bands { width: 100%; border-collapse: collapse; margin-top: 32px; }
        table.bands th,
        table.bands td { text-align: right; padding: 14px 10px; border-bottom: 1px solid var(--rule); }
        table.bands thead th {
          font-family: var(--data);
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 500;
          border-bottom: 1px solid var(--ink);
        }
        table.bands th[scope='row'],
        table.bands thead th:first-child { text-align: left; font-weight: 500; }
        td.strong { color: var(--accent); font-weight: 600; font-size: 1.05rem; }
        tr.suppressed td.strong { color: var(--muted); font-weight: 400; font-size: 0.82rem; }

        .drivers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 28px;
          margin-top: 36px;
        }
        .driver { border-top: 2px solid var(--ink); padding-top: 14px; }
        .driver p { margin: 0; color: var(--muted); font-size: 0.96rem; }

        .dom :global(.hot) { color: var(--hot); }
        .cta { background: var(--ink); color: var(--paper); }
        .cta :global(h2) { color: var(--paper); }
        .cta .sample { color: #9fb0b8; }
        .btn {
          display: inline-block;
          background: var(--accent);
          color: #fff;
          padding: 14px 28px;
          border-radius: 2px;
          font-weight: 600;
          margin-top: 8px;
        }
        .btn:hover { text-decoration: none; opacity: 0.92; }
        .foot { padding: 32px 0 64px; }

        @media (max-width: 640px) {
          .range { grid-template-columns: 1fr; gap: 12px; }
          .range-bar { display: none; }
        }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  const cfg = getSiteConfig();
  const [national, bands] = await Promise.all([
    getNationalStats(cfg.vertical),
    getSdeBands(cfg.vertical),
  ]);

  return {
    props: {
      cfg,
      national,
      bands,
      generatedAt: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    },
    revalidate: 86400, // rebuild daily as listings move
  };
}

function Stat({ label, value, sample, big }) {
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>{label}</p>
      <p
        className="num"
        style={{
          fontSize: big ? '3.1rem' : '2.1rem',
          margin: '0 0 4px',
          lineHeight: 1,
          color: big ? 'var(--accent)' : 'var(--ink)',
        }}
      >
        {value ?? '—'}
      </p>
      <p className="sample" style={{ margin: 0 }}>{sample}</p>
    </div>
  );
}
