// scripts/generate-sitemap.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BASE_URL = 'https://cleaningexits.com';

const generateSitemap = async () => {
  console.log('🔨 Generating sitemaps...');

  const { data: allListings } = await supabase
    .from('cleaning_listings_merge')
    .select('id, state, city, scraped_at')
    .not('price', 'is', null)
    .not('state', 'is', null);

  const listings = allListings || [];
  const uniqueStates = Array.from(new Set(listings.map(l => l.state).filter(Boolean)));
  
  const citiesByState = {};
  listings.forEach(listing => {
    if (listing.state && listing.city) {
      const state = listing.state.toLowerCase();
      const city = listing.city.toLowerCase().replace(/\s+/g, '-');
      if (!citiesByState[state]) citiesByState[state] = new Set();
      citiesByState[state].add(city);
    }
  });

  const staticSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/top-10</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/cleaning-index</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/resources</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/sell</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE_URL}/about</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${BASE_URL}/contact</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${BASE_URL}/subscribe</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${BASE_URL}/privacy-policy</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE_URL}/terms-of-service</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE_URL}/residential-cleaning-for-sale</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/cleaning-businesses-for-sale</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
</urlset>`;

  let statesSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  uniqueStates.forEach(state => {
    statesSitemap += `  <url><loc>${BASE_URL}/cleaning-businesses-for-sale/${state.toLowerCase()}</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
  });
  statesSitemap += '</urlset>';

  let citiesSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  Object.entries(citiesByState).forEach(([state, cities]) => {
    cities.forEach(city => {
      citiesSitemap += `  <url><loc>${BASE_URL}/cleaning-businesses-for-sale/${state}/${city}</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    });
  });
  citiesSitemap += '</urlset>';

  let listingsSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  listings.forEach(listing => {
    listingsSitemap += `  <url><loc>${BASE_URL}/listing/${listing.id}</loc><lastmod>${listing.scraped_at || new Date().toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
  });
  listingsSitemap += '</urlset>';

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-static.xml</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-states.xml</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-cities.xml</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-listings.xml</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>
</sitemapindex>`;

  const publicDir = path.join(process.cwd(), 'public');
  fs.writeFileSync(path.join(publicDir, 'sitemap_index.xml'), sitemapIndex);
  fs.writeFileSync(path.join(publicDir, 'sitemap-static.xml'), staticSitemap);
  fs.writeFileSync(path.join(publicDir, 'sitemap-states.xml'), statesSitemap);
  fs.writeFileSync(path.join(publicDir, 'sitemap-cities.xml'), citiesSitemap);
  fs.writeFileSync(path.join(publicDir, 'sitemap-listings.xml'), listingsSitemap);

  console.log('✅ Generated sitemaps:');
  console.log(`   - sitemap_index.xml`);
  console.log(`   - sitemap-static.xml (12 pages)`);
  console.log(`   - sitemap-states.xml (${uniqueStates.length} pages)`);
  console.log(`   - sitemap-cities.xml (${Object.values(citiesByState).reduce((s, c) => s + c.size, 0)} pages)`);
  console.log(`   - sitemap-listings.xml (${listings.length} pages)`);
};

generateSitemap().catch(console.error);
