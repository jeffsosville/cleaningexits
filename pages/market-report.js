// pages/market-report.js
// The citable asset. Purpose is backlinks, not conversion.
//
// Everything here is designed to be quoted: a stable URL, a named index,
// explicit sample sizes, a CC0 license, and a pre-written citation line.
// Trade press, lenders, and associations cite free sourced data; they do not
// link listings pages.

import Head from 'next/head';
import BaseStyles from '../components/BaseStyles';
import { getSiteConfig } from '../lib/siteConfig';
import {
  getNationalStats,
  getSdeBands,
  getStateStats,
  isPublishable,
  MIN_SAMPLE,
  money,
  mult,
  asOf,
  STATE_NAMES,
} from '../lib/marketStats';

export default function MarketReport({ cfg, national, bands, states, generatedAt, quarter }) {
  const title = `${cfg.industryLabel} Market Report ${quarter} | ${cfg.siteName}`;
  const desc = `Median ${mult(national.median_multiple)} SDE, ${money(national.median_asking_price, { compact: true })} median asking price, ${national.median_dom_sold}-day median time to sale. ${national.active_count} active listings across ${national.broker_count} brokerages. Free to republish.`;

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${cfg.industryLabel} Market Report ${quarter}`,
    description: desc,
    url: `${cfg.domain}/market-report`,
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    creator: { '@type': 'Organization', name: cfg.siteName, url: cfg.domain },
    temporalCoverage: asOf(national.data_through),
    variableMeasured: [
      'Median asking price',
      "Median seller's discretionary earnings",
      'Median asking price to SDE multiple',
      'Median days on market',
    ],
  };

  const citation = `${cfg.siteName}, "${cfg.industryLabel} Market Report ${quarter}." ${cfg.domain}/market-report. Data through ${asOf(national.data_through)}. CC0.`;

  const rankedStates = states.filter((s) => isPublishable(s.active_count));

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={`${cfg.domain}/market-report`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
        />
      </Head>
      <BaseStyles accent={cfg.accent} />

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow">
              {cfg.siteName} Market Report · {quarter} · Free to republish
            </p>
            <h1>{cfg.industryLabel}</h1>
            <p className="lede">
              Compiled from {national.active_count} active and{' '}
              {national.archive_count} closed or withdrawn listings across{' '}
              {national.broker_count} brokerages. Every figure carries its sample size. Nothing
              below {MIN_SAMPLE} observations is published as a median.
            </p>

            <div className="headline-grid">
              <Cell
                label="Median multiple"
                value={mult(national.median_multiple)}
                sub={`${national.sde_sample} obs.`}
                lead
              />
              <Cell
                label="Median asking"
                value={money(national.median_asking_price, { compact: true })}
                sub={`${national.active_count} obs.`}
              />
              <Cell
                label="Median SDE"
                value={money(national.median_sde, { compact: true })}
                sub={`${national.sde_sample} obs.`}
              />
              <Cell
                label="Days to sale"
                value={String(national.median_dom_sold)}
                sub={`${national.sold_count} closed`}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="wrap narrow">
            <p className="eyebrow">Finding 01</p>
            <h2>Price range across the market</h2>
            <p>
              Half of listed {cfg.businessNounPlural} are asking between{' '}
              <span className="num">{money(national.p25_asking_price, { compact: true })}</span>{' '}
              and{' '}
              <span className="num">{money(national.p75_asking_price, { compact: true })}</span>,
              with a median of{' '}
              <span className="num">{money(national.median_asking_price, { compact: true })}</span>.
              The spread is wide because this is a market of owner-operated businesses with
              inconsistent books, not a market of standardized assets.
            </p>
          </div>
        </section>

        <section>
          <div className="wrap narrow">
            <p className="eyebrow">Finding 02</p>
            <h2>Bigger businesses earn better multiples</h2>
            <p>
              Multiple rises with size, and not gradually. Each step up in earnings band moves the
              business into a different buyer pool &mdash; individual buyers at the bottom,
              search funds and strategics at the top.
            </p>
            <table>
              <thead>
                <tr>
                  <th scope="col">SDE band</th>
                  <th scope="col">n</th>
                  <th scope="col">Median multiple</th>
                  <th scope="col">Median asking</th>
                </tr>
              </thead>
              <tbody>
                {bands.map((b) => {
                  const ok = isPublishable(b.sample_size);
                  return (
                    <tr key={b.band_order}>
                      <th scope="row">{b.band_label}</th>
                      <td className="num">{b.sample_size}</td>
                      <td className="num strong">
                        {ok ? mult(b.median_multiple) : <span className="sup">n &lt; {MIN_SAMPLE}</span>}
                      </td>
                      <td className="num">
                        {ok ? money(b.median_asking_price, { compact: true }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="correction">
          <div className="wrap narrow">
            <p className="eyebrow">Finding 03 · Correction</p>
            <h2>The days-on-market figure in circulation is wrong</h2>
            <p>
              Active listings show a median of{' '}
              <span className="num">{national.median_dom_active}</span> days on market. Closed
              sales show <span className="num hot">{national.median_dom_sold}</span>.
            </p>
            <p>
              The gap is not seasonal and it is not a data error. It is survivorship: a listing
              still on the market is being measured before it finishes, so any average built from
              live inventory is measuring incomplete runs. Most published time-to-sale figures for
              small business sales are computed this way, which understates the real figure by
              roughly{' '}
              <span className="num">
                {Math.round(national.median_dom_sold / Math.max(national.median_dom_active, 1))}×
              </span>
              .
            </p>
            <p>
              For an owner planning an exit, the operational number is{' '}
              <span className="num">{national.median_dom_sold}</span> days from listing to close,
              before any pre-sale preparation.
            </p>
          </div>
        </section>

        {rankedStates.length > 0 && (
          <section>
            <div className="wrap narrow">
              <p className="eyebrow">Finding 04</p>
              <h2>Where the inventory is</h2>
              <p>
                Active listings concentrate in a small number of states. Only{' '}
                {rankedStates.length} clear the {MIN_SAMPLE}-listing minimum for a published
                median; the remainder are reported as counts only.
              </p>
              <table>
                <thead>
                  <tr>
                    <th scope="col">State</th>
                    <th scope="col">Active</th>
                    <th scope="col">Median asking</th>
                    <th scope="col">Median SDE</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedStates.map((s) => (
                    <tr key={s.state_norm}>
                      <th scope="row">{STATE_NAMES[s.state_norm] || s.state_norm}</th>
                      <td className="num">{s.active_count}</td>
                      <td className="num">{money(s.median_asking_price, { compact: true }) ?? '—'}</td>
                      <td className="num">{money(s.median_sde, { compact: true }) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="method">
          <div className="wrap narrow">
            <h2>Method</h2>
            <p>
              Listings are collected directly from brokerage websites, not from a single
              marketplace, and observed repeatedly over time. Days on market is measured from
              first observation rather than from a self-reported listing date, so it reflects when
              a listing actually appeared.
            </p>
            <p>
              Multiples are asking price divided by reported seller&rsquo;s discretionary
              earnings, restricted to listings reporting both, and winsorized to the 0.5&ndash;10&times;
              range to exclude data-entry errors. Medians are used throughout because the
              distribution is heavily right-skewed and means would mislead.
            </p>
            <p>
              These are <em>asking</em> prices except where explicitly labeled as closed. Asking
              prices in this market run above closing prices; treat the multiples as a ceiling.
            </p>
            <p className="sample">
              Coverage: {national.active_count} active listings across{' '}
              {national.states_covered} states and {national.broker_count} brokerages. Data
              through {asOf(national.data_through)}. Generated {generatedAt}.
            </p>
          </div>
        </section>

        <section className="license">
          <div className="wrap narrow">
            <p className="eyebrow">License</p>
            <h2>Republish this</h2>
            <p>
              Every figure on this page is released under{' '}
              <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="license">
                CC0 1.0
              </a>
              . No permission needed, no attribution required. If you would like to credit it
              anyway:
            </p>
            <blockquote className="citation">{citation}</blockquote>
            <p className="sample">
              Journalists and researchers who need the underlying rows rather than the summary can
              request the dataset directly.
            </p>
          </div>
        </section>
      </main>

      <style jsx>{`
        .hero { padding-top: 72px; }
        .headline-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 28px;
          margin-top: 48px;
          padding-top: 28px;
          border-top: 2px solid var(--ink);
        }
        table { width: 100%; border-collapse: collapse; margin-top: 28px; }
        th, td { text-align: right; padding: 13px 10px; border-bottom: 1px solid var(--rule); }
        thead th {
          font-family: var(--data);
          font-size: 0.66rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 500;
          border-bottom: 1px solid var(--ink);
        }
        th[scope='row'], thead th:first-child { text-align: left; font-weight: 500; }
        td.strong { color: var(--accent); font-weight: 600; }
        .sup { color: var(--muted); font-size: 0.75rem; font-weight: 400; }
        .correction { background: var(--wash); }
        .correction :global(.hot) { color: var(--hot); }
        .citation {
          font-family: var(--data);
          font-size: 0.86rem;
          line-height: 1.7;
          background: var(--wash);
          border-left: 3px solid var(--accent);
          margin: 24px 0;
          padding: 18px 22px;
        }
        .license { padding-bottom: 88px; }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  const cfg = getSiteConfig();
  const [national, bands, states] = await Promise.all([
    getNationalStats(cfg.vertical),
    getSdeBands(cfg.vertical),
    getStateStats(cfg.vertical),
  ]);

  const now = new Date();
  const quarter = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;

  return {
    props: {
      cfg,
      national,
      bands,
      states,
      quarter,
      generatedAt: now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    },
    revalidate: 86400,
  };
}

function Cell({ label, value, sub, lead }) {
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>{label}</p>
      <p
        className="num"
        style={{
          fontSize: lead ? '2.9rem' : '2.1rem',
          margin: '0 0 4px',
          lineHeight: 1,
          color: lead ? 'var(--accent)' : 'var(--ink)',
        }}
      >
        {value ?? '—'}
      </p>
      <p className="sample" style={{ margin: 0 }}>{sub}</p>
    </div>
  );
}
