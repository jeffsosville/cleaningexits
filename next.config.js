/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // One redirects() only: a second key in this object silently replaces the
  // first, which is how /audit -> /subscribe stopped working.
  async redirects() {
    return [
      { source: '/audit', destination: '/subscribe', permanent: true },
      // The December 2025 valuation guide quoted static multiples that the
      // live /valuation pillar now replaces; two pages chasing one query
      // split the ranking. Point it at the pillar.
      { source: '/cleaning-business-valuation-guide', destination: '/valuation', permanent: true },
      // /why was a competitor teardown with 2025 numbers the site no longer matches.
      // Temporary so a rewrite can take the URL back.
      { source: '/why', destination: '/about', permanent: false },
      { source: '/why1', destination: '/about', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap.xml',
      },
    ];
  },
};

module.exports = nextConfig;