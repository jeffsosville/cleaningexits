// pages/for-sale/[state].js
// Geo pages, deliberately gated.
//
// getStaticPaths only emits states clearing cfg.geoThreshold active listings.
// fallback:false means a state below the bar returns 404 rather than a thin
// page. This is the whole point: 50 near-empty state pages is the pattern that
// gets programmatic content deindexed. Pages appear as inventory earns them.

import Head from 'next/head';
import BaseStyles from '../../components/BaseStyles';
import { getSiteConfig } from '../../lib/siteConfig';
import {
  getPublishableStates,
  getStateStat,
  getNationalStats,
  getListings,
  isPublishable,
  money,
  mult,
  asOf,
  STATE_NAMES,
} from '../../lib/marketStats';

export default function StatePage({ cfg, stat, national, listings, stateName, generatedAt }) {
  const title = `${cfg.businessNounPlural} for sale in ${stateName} | ${cfg.siteName}`;
  const desc = `${stat.active_count} active ${cfg.businessNoun} listings in ${stateName}. Median asking ${money(stat.median_asking_price, { compact: true })}. Compared against national figures, updated daily.`;

  const vsNational =
    stat.median_asking_price && national.median_asking_price
      ? Math.round(
          ((Number(stat.median_asking_price) - Number(national.median_asking_price)) /
            Number(national.median_asking_price)) *
            100
        )
      : null;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={`${cfg.domain}/for-sale/${stat.state_norm.toLowerCase()}`} />
      </Head>
      <BaseStyles accent={cfg.accent} />

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow">{cfg.siteName} · {stateName}</p>
            <h1>
              {cfg.businessNounPlural} for sale in {stateName}
            </h1>
            <p className="lede">
              {stat.active_count} active listings, plus {stat.archive_count} closed or withdrawn
              in the archive. Figures below compare {stateName} against the national market.
            </p>

            <div className="grid">
              <Cell
                label="Active listings"
                value={String(stat.active_count)}
                sub={`${stat.archive_count} in archive`}
                lead
              />
              <Cell
                label="Median asking"
                value={money(stat.median_asking_price, { compact: true })}
                sub={
                  vsNational === null
                    ? '—'
                    : `${vsNational > 0 ? '+' : ''}${vsNational}% vs national`
                }
              />
              <Cell
                label="Median SDE"
                value={
                  isPublishable(stat.sde_sample)
                    ? money(stat.median_sde, { compact: true })
                    : null
                }
                sub={`${stat.sde_sample} obs.`}
              />
              <Cell
                label="Median multiple"
                value={isPublishable(stat.sde_sample) ? mult(stat.median_multiple) : null}
                sub={
                  isPublishable(stat.sde_sample)
                    ? `${stat.sde_sample} obs.`
                    : `sample too small`
                }
              />
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>Active listings in {stateName}</h2>
            <ul className="listings">
              {listings.map((l) => (
                <li key={l.id}>
                  <a href={l.url} rel="nofollow noopener" target="_blank">
                    {l.title}
                  </a>
                  <div className="meta">
                    {l.city ? <span>{l.city}</span> : null}
                    {l.asking_price ? (
                      <span className="num">{money(l.asking_price, { compact: true })}</span>
                    ) : null}
                    {l.cash_flow ? (
                      <span className="num">{money(l.cash_flow, { compact: true })} SDE</span>
                    ) : null}
                    {l.days_on_market ? (
                      <span className="sample">{l.days_on_market}d listed</span>
                    ) : null}
                    {l.broker_name ? <span className="sample">{l.broker_name}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cta">
          <div className="wrap narrow">
            <h2>Selling in {stateName}?</h2>
            <p>
              The median business here spent{' '}
              <span className="num">{national.median_dom_sold}</span> days on market before
              closing. Knowing your range before you list is what keeps you off that curve.
            </p>
            <p>
              <a className="btn" href="/valuation">
                See what your {cfg.businessNoun} is worth
              </a>
            </p>
          </div>
        </section>

        <footer className="foot">
          <div className="wrap">
            <p className="sample">
              Data through {asOf(stat.data_through)}. Generated {generatedAt}. Listing links go
              directly to the listing brokerage.
            </p>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .hero { padding-top: 72px; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 28px;
          margin-top: 44px;
          padding-top: 28px;
          border-top: 2px solid var(--ink);
        }
        ul.listings { list-style: none; padding: 0; margin: 32px 0 0; }
        ul.listings li { padding: 18px 0; border-bottom: 1px solid var(--rule); }
        ul.listings a { font-size: 1.06rem; font-weight: 500; color: var(--ink); }
        ul.listings a:hover { color: var(--accent); }
        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 6px;
          font-size: 0.88rem;
          color: var(--muted);
        }
        .cta { background: var(--ink); color: var(--paper); }
        .cta :global(h2) { color: var(--paper); }
        .btn {
          display: inline-block;
          background: var(--accent);
          color: #fff;
          padding: 14px 28px;
          border-radius: 2px;
          font-weight: 600;
        }
        .btn:hover { text-decoration: none; opacity: 0.92; }
        .foot { padding: 32px 0 64px; }
      `}</style>
    </>
  );
}

export async function getStaticPaths() {
  const cfg = getSiteConfig();
  const states = await getPublishableStates(cfg.vertical, cfg.geoThreshold);
  return {
    paths: states.map((s) => ({ params: { state: s.state_norm.toLowerCase() } })),
    fallback: false, // below threshold = 404, not a thin page
  };
}

export async function getStaticProps({ params }) {
  const cfg = getSiteConfig();
  const code = String(params.state).toUpperCase();

  const [stat, national, listings] = await Promise.all([
    getStateStat(cfg.vertical, code),
    getNationalStats(cfg.vertical),
    getListings(cfg.vertical, { stateCode: code, status: 'active', limit: 60 }),
  ]);

  if (!stat || stat.active_count < cfg.geoThreshold) return { notFound: true };

  return {
    props: {
      cfg,
      stat,
      national,
      listings,
      stateName: STATE_NAMES[code] || code,
      generatedAt: new Date().toLocaleDateString('en-US', {
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
