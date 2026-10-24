// pages/valuation/[segment].js
// Spoke pages off the /valuation pillar: one per sub-segment with enough
// listings to publish a median (lib/segments.js lists which). Below
// MIN_SAMPLE the page 404s instead of printing a thin number.

import Head from 'next/head';
import { useState, useMemo } from 'react';
import BaseStyles from '../../components/BaseStyles';
import { getSiteConfig } from '../../lib/siteConfig';
import { segmentsFor } from '../../lib/segments';
import {
  getNationalStats,
  getSegments,
  isPublishable,
  money,
  mult,
  asOf,
} from '../../lib/marketStats';

export default function SegmentValuation({ cfg, seg, row, national, others, generatedAt }) {
  const [sde, setSde] = useState('');
  const numericSde = useMemo(() => {
    const n = Number(String(sde).replace(/[^0-9.]/g, ''));
    return isFinite(n) && n > 0 ? n : null;
  }, [sde]);

  const url = `${cfg.domain}/valuation/${seg.slug}`;
  const title = `${seg.title} | ${cfg.siteName}`;
  const desc = `Listed ${seg.noun}es ask a median ${mult(row.median_multiple)} SDE (${row.sample_size} active listings). Lower and upper quartiles, what moves the multiple, and a range calculator.`;

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: seg.keyQuestion,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Across ${row.sample_size} active ${seg.noun} listings with reported cash flow, the median asking price is ${mult(row.median_multiple)} seller's discretionary earnings. The middle half of listings ask between ${mult(row.p25_multiple)} and ${mult(row.p75_multiple)}.`,
          },
        },
        ...seg.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: cfg.siteName, item: `${cfg.domain}/` },
        { '@type': 'ListItem', position: 2, name: 'Valuation', item: `${cfg.domain}/valuation` },
        { '@type': 'ListItem', position: 3, name: seg.label, item: url },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </Head>
      <BaseStyles accent={cfg.accent} />

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow">
              <a href="/valuation">Valuation</a> · {seg.label}
            </p>
            <h1>{seg.h1}</h1>
            <p className="lede">{seg.lede}</p>

            <div className="topline">
              <Stat label="Median multiple" value={mult(row.median_multiple)} sample={`${row.sample_size} active listings with SDE`} big />
              <Stat label="Middle half" value={`${mult(row.p25_multiple)}–${mult(row.p75_multiple)}`} sample="lower to upper quartile" />
              <Stat label="Median asking price" value={money(row.median_asking_price, { compact: true })} sample={`median SDE ${money(row.median_sde, { compact: true })}`} />
            </div>
          </div>
        </section>

        <section className="estimator">
          <div className="wrap">
            <h2>Your range as a {seg.noun}</h2>
            <p className="lede">
              Enter seller&rsquo;s discretionary earnings: net profit plus your salary, personal
              expenses run through the business, interest, depreciation and one-time costs.
            </p>
            <div className="input-row">
              <label htmlFor="sde">Annual SDE</label>
              <div className="field">
                <span className="prefix num">$</span>
                <input id="sde" type="text" inputMode="numeric" placeholder="120,000" value={sde} onChange={(e) => setSde(e.target.value)} className="num" />
              </div>
            </div>
            {numericSde && (
              <div className="result">
                <p className="eyebrow">Based on {row.sample_size} {seg.label.toLowerCase()} listings</p>
                <div className="trio">
                  <div><span className="sample">Lower quartile</span><span className="num big">{money(numericSde * Number(row.p25_multiple), { compact: true })}</span></div>
                  <div><span className="sample">Median</span><span className="num big accent">{money(numericSde * Number(row.median_multiple), { compact: true })}</span></div>
                  <div><span className="sample">Upper quartile</span><span className="num big">{money(numericSde * Number(row.p75_multiple), { compact: true })}</span></div>
                </div>
                <p className="caveat">
                  These are asking prices for comparable businesses, not what yours will close at.
                  Size matters too: see multiples by SDE band on the <a href="/valuation">main valuation page</a>.
                </p>
              </div>
            )}
          </div>
        </section>

        {seg.sections.map((s) => (
          <section key={s.heading}>
            <div className="wrap narrow">
              <h2>{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="compare">
          <div className="wrap">
            <h2>Compared with other cleaning businesses</h2>
            <table className="bands">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Listings</th>
                  <th scope="col">Median multiple</th>
                  <th scope="col">Median asking</th>
                </tr>
              </thead>
              <tbody>
                <tr className="self">
                  <th scope="row">{seg.label}</th>
                  <td className="num">{row.sample_size}</td>
                  <td className="num strong">{mult(row.median_multiple)}</td>
                  <td className="num">{money(row.median_asking_price, { compact: true })}</td>
                </tr>
                {others.map((o) => (
                  <tr key={o.segment}>
                    <th scope="row">{o.href ? <a href={o.href}>{o.label}</a> : o.label}</th>
                    <td className="num">{o.sample_size}</td>
                    <td className="num">{mult(o.median_multiple)}</td>
                    <td className="num">{money(o.median_asking_price, { compact: true })}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row"><a href="/valuation">All cleaning businesses</a></th>
                  <td className="num">{national.sde_sample}</td>
                  <td className="num">{mult(national.median_multiple)}</td>
                  <td className="num">{money(national.median_asking_price, { compact: true })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="wrap narrow">
            <h2>Common questions</h2>
            {seg.faqs.map((f) => (
              <div key={f.q} className="faq">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta">
          <div className="wrap narrow">
            <h2>Where your business actually lands</h2>
            <p>
              A median tells you where comparable businesses ask. Contract quality, owner
              dependence and how the books present decide where yours sits.
            </p>
            <p><a className="btn" href="/sell">Request a valuation review</a></p>
            <p className="sample">
              No cost, no listing agreement. Or read{' '}
              <a href="/selling-your-cleaning-business" style={{ color: '#cfe3dc' }}>how to prepare a cleaning business for sale</a>.
            </p>
          </div>
        </section>

        <footer className="foot">
          <div className="wrap">
            <p className="sample">
              Figures from DealLedger&rsquo;s open dataset of broker listings: active listings with a
              reported asking price and cash flow, multiples between 0.5× and 10×. Segments are
              assigned from listing titles. Data through {asOf(national.data_through)}; generated {generatedAt}.
            </p>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .hero { padding-top: 72px; }
        .topline { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 32px; margin-top: 48px; padding-top: 32px; border-top: 2px solid var(--ink); }
        .estimator { background: var(--wash); }
        .input-row { margin: 32px 0 0; max-width: 380px; }
        label { display: block; font-family: var(--data); font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        .field { display: flex; align-items: center; background: var(--paper); border: 1px solid var(--rule); border-radius: 2px; padding: 0 16px; }
        .field:focus-within { border-color: var(--accent); }
        .prefix { color: var(--muted); font-size: 1.4rem; }
        input { flex: 1; border: 0; background: transparent; padding: 16px 8px; font-size: 1.6rem; color: var(--ink); width: 100%; }
        input:focus { outline: none; }
        .result { margin-top: 40px; background: var(--paper); border: 1px solid var(--rule); border-left: 3px solid var(--accent); padding: 28px; }
        .trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 16px 0 20px; }
        .trio div { display: flex; flex-direction: column; gap: 4px; }
        .big { font-size: 1.8rem; }
        .accent { color: var(--accent); }
        .caveat { margin: 0; font-size: 0.92rem; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 14px; }
        table.bands { width: 100%; border-collapse: collapse; margin-top: 28px; }
        table.bands th, table.bands td { text-align: right; padding: 14px 10px; border-bottom: 1px solid var(--rule); }
        table.bands thead th { font-family: var(--data); font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 500; border-bottom: 1px solid var(--ink); }
        table.bands th[scope='row'], table.bands thead th:first-child { text-align: left; font-weight: 500; }
        tr.self th, td.strong { color: var(--accent); font-weight: 600; }
        .faq { border-top: 1px solid var(--rule); padding-top: 14px; margin-top: 18px; }
        .faq h3 { margin: 0 0 6px; font-size: 1.05rem; }
        .faq p { margin: 0; color: var(--muted); }
        .cta { background: var(--ink); color: var(--paper); }
        .cta :global(h2) { color: var(--paper); }
        .cta .sample { color: #9fb0b8; }
        .btn { display: inline-block; background: var(--accent); color: #fff; padding: 14px 28px; border-radius: 2px; font-weight: 600; margin-top: 8px; }
        .btn:hover { text-decoration: none; opacity: 0.92; }
        .foot { padding: 32px 0 64px; }
        @media (max-width: 640px) { .trio { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}

export async function getStaticPaths() {
  const cfg = getSiteConfig();
  return {
    paths: Object.keys(segmentsFor(cfg.vertical)).map((slug) => ({ params: { segment: slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const cfg = getSiteConfig();
  const segCfg = segmentsFor(cfg.vertical)[params.segment];
  if (!segCfg) return { notFound: true };

  const [national, segments] = await Promise.all([getNationalStats(cfg.vertical), getSegments(cfg.vertical)]);
  const row = segments.find((r) => r.segment === segCfg.segment);
  if (!row || !isPublishable(row.sample_size)) return { notFound: true, revalidate: 86400 };

  const byKey = Object.fromEntries(
    Object.entries(segmentsFor(cfg.vertical)).map(([slug, c]) => [c.segment, { slug, label: c.label }])
  );
  const LABELS = { carpet: 'Carpet cleaning', window: 'Window cleaning', 'pressure-washing': 'Pressure washing', restoration: 'Restoration' };
  const others = segments
    .filter((r) => r.segment !== segCfg.segment && isPublishable(r.sample_size))
    .map((r) => ({
      segment: r.segment,
      label: byKey[r.segment]?.label || LABELS[r.segment] || r.segment,
      href: byKey[r.segment] ? `/valuation/${byKey[r.segment].slug}` : null,
      sample_size: r.sample_size,
      median_multiple: r.median_multiple,
      median_asking_price: r.median_asking_price,
    }));

  return {
    props: {
      cfg,
      seg: { ...segCfg, slug: params.segment },
      row,
      national,
      others,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    },
    revalidate: 86400,
  };
}

function Stat({ label, value, sample, big }) {
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>{label}</p>
      <p className="num" style={{ fontSize: big ? '3.1rem' : '2.1rem', margin: '0 0 4px', lineHeight: 1, color: big ? 'var(--accent)' : 'var(--ink)' }}>
        {value ?? '—'}
      </p>
      <p className="sample" style={{ margin: 0 }}>{sample}</p>
    </div>
  );
}
