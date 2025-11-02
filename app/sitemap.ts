import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default async function GET() {
  const BASE_URL = 'https://cleaningexits.com'; // Changed from www to non-www

  // Fetch all listings from database
  const { data: allListings } = await supabase
    .from('cleaning_listings_merge')
    .select('id, state, city, updated_at')
    .not('price', 'is', null)
    .not('state', 'is', null);

  const listings = allListings || [];

  // Get unique states and cities
  const states = Array.from(new Set(listings.map(l => l.state?.toLowerCase()).filter(Boolean)));
  const citiesByState: Record<string, Set<string>> = {};

  listings.forEach(listing => {
    if (listing.state && listing.city) {
      const state = listing.state.toLowerCase();
      const city = listing.city.toLowerCase().replace(/\s+/g, '-');
      
      if (!citiesByState[state]) {
        citiesByState[state] = new Set();
      }
      citiesByState[state].add(city);
    }
  });

  // Build sitemap XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Main Navigation Pages -->
  <url>
    <loc>${BASE_URL}/top-10</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/cleaning-index</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/resources</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/sell</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/subscribe</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/privacy-policy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/terms-of-service</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <!-- Service Type Pages -->
  <url>
    <loc>${BASE_URL}/residential-cleaning-for-sale</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- All States Index -->
  <url>
    <loc>${BASE_URL}/cleaning-businesses-for-sale</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- State Pages -->
`;

  states.forEach(state => {
    sitemap += `  <url>
    <loc>${BASE_URL}/cleaning-businesses-for-sale/${state}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  // Add city pages
  Object.entries(citiesByState).forEach(([state, cities]) => {
    cities.forEach(city => {
      sitemap += `  <url>
    <loc>${BASE_URL}/cleaning-businesses-for-sale/${state}/${city}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });
  });

  // Add individual listing pages
  listings.forEach(listing => {
    sitemap += `  <url>
    <loc>${BASE_URL}/listing/${listing.id}</loc>
    <lastmod>${listing.updated_at ? new Date(listing.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  });

  sitemap += `</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}
