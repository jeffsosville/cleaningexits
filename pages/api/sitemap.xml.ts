// pages/api/sitemap.xml.ts
//
// Only indexable, 200-status, canonical URLs belong here. Google reads every
// URL in a sitemap as "please index this", so listing thin or broken pages
// here actively hurts the site.
//
// What's in:   real static pages (paths verified against pages/), the gated
//              /for-sale/{state} pages, and city pages at or above
//              CITY_INDEX_MIN listings.
// What's out:  /cleaning-businesses-for-sale/{state} (redirect or noindex now),
//              thin city pages (noindex), individual listing pages (broker
//              copy duplicated across the web; Google declined to index them),
//              transactional pages (/nda, /confirm, /unsubscribe), internal
//              pages (/vertical-demo, /why1, /daily-cleaning).
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { STATE_REDIRECT_MIN } from '../../lib/geo';
import { getIndexableCities, getStateUpdated } from '../../lib/cityIndex';

const supabaseDealLedger = createClient(
  process.env.DEALLEDGER_SUPABASE_URL as string,
  process.env.DEALLEDGER_SUPABASE_SERVICE_KEY as string
);

const BASE_URL = 'https://cleaningexits.com';

// [path, changefreq, priority, live]. Every path here must match a file in
// pages/. `live` pages are rebuilt from listing data every day, so today is a
// true lastmod. Hand-written pages get no lastmod: stamping them with today's
// date on every request teaches Google to ignore the field site-wide.
const STATIC_PAGES: Array<[string, string, string, boolean]> = [
  ['/', 'daily', '1.0', true],
  ['/valuation', 'weekly', '1.0', true],
  ['/valuation/residential', 'weekly', '0.9', true],
  ['/valuation/commercial', 'weekly', '0.9', true],
  ['/valuation/sde-multiples', 'weekly', '0.9', true],
  ['/selling-your-cleaning-business', 'monthly', '0.9', false],
  ['/market-report', 'weekly', '0.9', true],
  ['/sell', 'monthly', '0.8', false],
  ['/listings', 'daily', '0.8', true],
  ['/cleaning-businesses-for-sale', 'daily', '0.8', true],
  ['/cleaning-business-for-sale', 'weekly', '0.7', true],
  ['/residential-cleaning-for-sale', 'weekly', '0.7', false],
  ['/commercial-cleaning-industry-overview', 'monthly', '0.7', false],
  ['/cleaning-index', 'daily', '0.7', true],
  ['/top10', 'daily', '0.7', true],
  ['/resources', 'weekly', '0.6', false],
  ['/resources/utah-janitorial-deal', 'monthly', '0.6', false],
  ['/why', 'monthly', '0.5', false],
  ['/about', 'monthly', '0.5', false],
  ['/contact', 'monthly', '0.4', false],
  ['/subscribe', 'monthly', '0.4', false],
  ['/privacy', 'yearly', '0.2', false],
  ['/terms', 'yearly', '0.2', false],
];

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const entry = (path: string, lastmod: string | null, cf: string, pr: string) =>
  `  <url>
    <loc>${xmlEscape(BASE_URL + encodeURI(path))}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${cf}</changefreq>
    <priority>${pr}</priority>
  </url>`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const entries = STATIC_PAGES.map(([p, cf, pr, live]) => entry(p, live ? today : null, cf, pr));
    // Geo pages change when a new listing appears, so that is their lastmod.
    const stateUpdated = await getStateUpdated();

    // Gated state pages: same rule /for-sale/[state] uses to decide it exists.
    const { data: stateRows, error: stateErr } = await supabaseDealLedger
      .from('market_stats_state')
      .select('state_norm, active_count')
      .eq('vertical', 'cleaning')
      .gte('active_count', STATE_REDIRECT_MIN);
    if (stateErr) throw stateErr;
    for (const r of stateRows || []) {
      const code = String(r.state_norm);
      entries.push(entry(`/for-sale/${code.toLowerCase()}`, stateUpdated.get(code) || null, 'daily', '0.8'));
    }

    // City pages that clear the index bar, aliases folded into their
    // canonical slug (Kings County -> Brooklyn).
    for (const c of await getIndexableCities()) {
      entries.push(entry(`/cleaning-businesses-for-sale/${c.state}/${c.slug}`, c.updated, 'weekly', '0.6'));
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
