import { VerticalConfig } from '../types';

/**
 * Landscape Services Vertical Configuration
 */
export const landscapeVertical: VerticalConfig = {
  info: {
    name: 'Landscape Services',
    slug: 'landscape',
    domain: 'landscapeexits.com',
    brandColor: '#10B981', // Green
    logoPath: '/logos/landscape-logo.svg',
    faviconPath: '/favicons/landscape-favicon.ico',
  },

  seo: {
    metaTitle: 'Landscape Businesses for Sale | {{name}}',
    metaDescription:
      'Discover profitable landscape and lawn care businesses for sale. Find commercial landscaping, lawn maintenance, irrigation, and hardscape companies with verified financials.',
    keywords: [
      'landscape business for sale',
      'lawn care business for sale',
      'landscaping company acquisition',
      'lawn maintenance business',
      'irrigation business for sale',
      'hardscape business',
      'tree service business',
      'snow removal business',
      'landscape design business',
      'commercial landscaping',
    ],
    ogImage: '/og-images/landscape-og.jpg',
    twitterCard: 'summary_large_image',
  },

  categories: [
    {
      id: 'lawn-maintenance',
      name: 'Lawn Maintenance',
      description: 'Mowing, trimming, and regular lawn care services',
      icon: 'grass',
    },
    {
      id: 'commercial-landscape',
      name: 'Commercial Landscaping',
      description: 'Large-scale property maintenance and design',
      icon: 'building',
    },
    {
      id: 'residential-landscape',
      name: 'Residential Landscaping',
      description: 'Home landscape design and maintenance',
      icon: 'home',
    },
    {
      id: 'irrigation',
      name: 'Irrigation Services',
      description: 'Sprinkler installation, maintenance, and repair',
      icon: 'droplets',
    },
    {
      id: 'hardscape',
      name: 'Hardscape & Masonry',
      description: 'Patios, walkways, retaining walls, and stonework',
      icon: 'brick',
    },
    {
      id: 'tree-service',
      name: 'Tree Service',
      description: 'Tree trimming, removal, and arborist services',
      icon: 'tree',
    },
    {
      id: 'snow-removal',
      name: 'Snow Removal',
      description: 'Seasonal snow plowing and ice management',
      icon: 'snowflake',
    },
    {
      id: 'landscape-design',
      name: 'Landscape Design',
      description: 'Design, installation, and beautification services',
      icon: 'palette',
    },
  ],

  valuationMultiples: {
    revenueMin: 0.4,
    revenueMax: 0.85,
    revenueMedian: 0.625,
    sdeMin: 2.2,
    sdeMax: 4.0,
    sdeMedian: 3.1,
    ebitdaMin: 3.5,
    ebitdaMax: 5.5,
    ebitdaMedian: 4.5,
  },

  brokerSources: [
    {
      name: 'BizBuySell',
      url: 'https://www.bizbuysell.com/businesses-for-sale/lawn-care-and-landscaping-businesses/',
      active: true,
      scraperConfig: {
        rateLimit: 30,
      },
    },
    {
      name: 'BizQuest',
      url: 'https://www.bizquest.com/businesses-for-sale/landscaping/',
      active: true,
      scraperConfig: {
        rateLimit: 20,
      },
    },
    {
      name: 'LandscapeTrades',
      url: 'https://www.landscapetrades.com/businesses-for-sale',
      active: false,
    },
  ],

  emailTemplates: {
    welcome: {
      subject: 'Welcome to LandscapeExits - Your Landscape Business Marketplace',
      headerText: 'Welcome to LandscapeExits!',
      ctaText: 'Browse Landscape Businesses',
    },
    weeklyTop10: {
      subject: 'Top 10 Landscape Businesses This Week | LandscapeExits',
      headerText: 'This Week\'s Top Landscape Business Opportunities',
      introText:
        'Here are the most promising landscape and lawn care businesses listed this week. Each has been verified with detailed equipment lists and financial data.',
    },
    newListing: {
      subject: 'New Landscape Business Listed: {{businessName}}',
      headerText: 'New Opportunity Alert',
    },
    priceChange: {
      subject: 'Price Reduced: {{businessName}}',
      headerText: 'Price Drop Alert',
    },
    fromEmail: 'listings@landscapeexits.com',
    fromName: 'LandscapeExits',
  },

  terminology: {
    businessTerm: 'Landscape Business',
    businessTermPlural: 'Landscape Businesses',
    revenueTerm: 'Annual Revenue',
    profitTerm: 'SDE',
    customMetrics: [
      {
        key: 'customerCount',
        label: 'Active Customers',
        description: 'Number of recurring maintenance accounts',
        format: 'number',
      },
      {
        key: 'seasonalRevenue',
        label: 'Seasonal Split',
        description: 'Revenue breakdown by season',
        format: 'text',
      },
      {
        key: 'equipmentValue',
        label: 'Equipment Value',
        description: 'Total value of equipment and vehicles',
        format: 'currency',
      },
      {
        key: 'crewCount',
        label: 'Crews',
        description: 'Number of active field crews',
        format: 'number',
      },
      {
        key: 'recurringContracts',
        label: 'Contract Revenue %',
        description: 'Percentage from recurring maintenance contracts',
        format: 'percentage',
      },
    ],
  },

  custom: {
    filters: {
      serviceArea: ['Urban', 'Suburban', 'Rural', 'Multi-location'],
      equipmentIncluded: true,
      vehiclesIncluded: true,
      seasonality: ['Year-round', 'Seasonal', 'Snow Removal'],
    },
  },
};
