/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [{ source: '/audit', destination: '/subscribe', permanent: true }];
  },
  // The December 2025 valuation guide quoted static multiples that the live
  // /valuation pillar now replaces; two pages chasing one query split the
  // ranking. Point it at the pillar.
  async redirects() {
    return [
      { source: '/cleaning-business-valuation-guide', destination: '/valuation', permanent: true },
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