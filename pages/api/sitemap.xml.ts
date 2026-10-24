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
import { toStateCode, slugifyCity, CITY_INDEX_MIN, STATE_REDIRECT_MIN } from '../../lib/geo';

const supabaseDealLedger = createClient(
  process.env.DEALLEDGER_SUPABASE_URL as string,
  process.env.DEALLEDGER_SUPABASE_SERVICE_KEY as string
);

const BASE_URL = 'https://cleaningexits.com';

// [path, changefreq, priority]. Every path here must match a file in pages/.
const STATIC_PAGES: Array<[string, string, string]> = [
  ['/', 'daily', '1.0'],
  ['/valuation', 'weekly', '1.0'],
  ['/valuation/residential', 'weekly', '0.9'],
  ['/valuation/commercial', 'weekly', '0.9'],
  ['/valuation/sde-multiples', 'weekly', '0.9'],
  ['/selling-your-cleaning-business', 'monthly', '0.9'],
  ['/market-report', 'weekly', '0.9'],
  ['/sell', 'monthly', '0.8'],
  ['/listings', 'daily', '0.8'],
  ['/cleaning-businesses-for-sale', 'daily', '0.8'],
  ['/cleaning-business-for-sale', 'weekly', '0.7'],
  ['/residential-cleaning-for-sale', 'weekly', '0.7'],
  ['/commercial-cleaning-industry-overview', 'monthly', '0.7'],
  ['/cleaning-index', 'daily', '0.7'],
  ['/top10', 'daily', '0.7'],
  ['/resources', 'weekly', '0.6'],
  ['/resources/utah-janitorial-deal', 'monthly', '0.6'],
  ['/why', 'monthly', '0.5'],
  ['/about', 'monthly', '0.5'],
  ['/contact', 'monthly', '0.4'],
  ['/subscribe', 'monthly', '0.4'],
  ['/privacy', 'yearly', '0.2'],
  ['/terms', 'yearly', '0.2'],
];

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const entry = (path: string, lastmod: string, cf: string, pr: string) =>
  `  <url>
    <loc>${xmlEscape(BASE_URL + encodeURI(path))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${cf}</changefreq>
    <priority>${pr}</priority>
  </url>`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const entries = STATIC_PAGES.map(([p, cf, pr]) => entry(p, today, cf, pr));

    // Gated state pages: same rule /for-sale/[state] uses to decide it exists.
    const { data: stateRows, error: stateErr } = await supabaseDealLedger
      .from('market_stats_state')
      .select('state_norm, active_count')
      .eq('vertical', 'cleaning')
      .gte('active_count', STATE_REDIRECT_MIN);
    if (stateErr) throw stateErr;
    for (const r of stateRows || []) {
      entries.push(entry(`/for-sale/${String(r.state_norm).toLowerCase()}`, today, 'daily', '0.8'));
    }

    // City pages that clear the index bar, under normalized state codes only.
    const { data: locs, error: locErr } = await supabaseDealLedger
      .from('cleaning_listings_direct')
      .select('state, city')
      .not('state', 'is', null)
      .not('city', 'is', null);
    if (locErr) throw locErr;

    const counts = new Map<string, number>();
    for (const l of locs || []) {
      const code = toStateCode(l.state);
      if (!code) continue;
      const key = `/cleaning-businesses-for-sale/${code.toLowerCase()}/${slugifyCity(l.city)}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    counts.forEach((n, path) => {
      if (n >= CITY_INDEX_MIN) entries.push(entry(path, today, 'weekly', '0.6'));
    });

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
