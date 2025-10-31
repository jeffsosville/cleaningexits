// pages/api/sitemap.xml.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

const BASE_URL = 'https://cleaningexits.com';

const slugifyCity = (city: string): string => {
  return city.toLowerCase().replace(/\s+/g, '-');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all listings
    const { data: listings } = await supabase
      .from('cleaning_listings_merge')
      .select('id, scraped_at');

    // Get all unique states
    const { data: states } = await supabase
      .from('cleaning_listings_merge')
      .select('state')
      .not('state', 'is', null);

    // Get all unique city/state combinations
    const { data: cities } = await supabase
      .from('cleaning_listings_merge')
      .select('state, city')
      .not('state', 'is', null)
      .not('city', 'is', null);

    const uniqueStates = Array.from(new Set(states?.map(s => s.state) || []));
    
    const uniqueCities = new Map<string, Set<string>>();
    cities?.forEach(loc => {
      if (!uniqueCities.has(loc.state)) {
        uniqueCities.set(loc.state, new Set());
      }
      uniqueCities.get(loc.state)?.add(loc.city);
    });

    // Build sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Static Pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/cleaning-businesses-for-sale</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- State Pages -->
${uniqueStates
  .map(
    state => `  <url>
    <loc>${BASE_URL}/cleaning-businesses-for-sale/${state.toLowerCase()}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}

  <!-- City Pages -->
${Array.from(uniqueCities.entries())
  .flatMap(([state, citySet]) =>
    Array.from(citySet).map(
      city => `  <url>
    <loc>${BASE_URL}/cleaning-businesses-for-sale/${state.toLowerCase()}/${slugifyCity(city)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
  )
  .join('\n')}

  <!-- Listing Pages -->
${(listings || [])
  .map(
    listing => `  <url>
    <loc>${BASE_URL}/listing/${listing.id}</loc>
    <lastmod>${listing.scraped_at || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join('\n')}

</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
