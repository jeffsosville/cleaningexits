import { VerticalConfig } from '../types';

/**
 * Cleaning Services Vertical Configuration
 */
export const cleaningVertical: VerticalConfig = {
  info: {
    name: 'Cleaning Services',
    slug: 'cleaning',
    domain: 'cleaningexits.com',
    brandColor: '#3B82F6', // Blue
    logoPath: '/logos/cleaning-logo.svg',
    faviconPath: '/favicons/cleaning-favicon.ico',
  },

  seo: {
    metaTitle: 'Cleaning Businesses for Sale | {{name}}',
    metaDescription:
      'Find profitable cleaning businesses for sale. Browse commercial cleaning, residential cleaning, janitorial services, and specialty cleaning companies. Verified listings with financial details.',
    keywords: [
      'cleaning business for sale',
      'janitorial business for sale',
      'commercial cleaning business',
      'residential cleaning service',
      'cleaning company acquisition',
      'cleaning franchise for sale',
      'maid service business',
      'office cleaning business',
      'carpet cleaning business',
      'window cleaning business',
    ],
    ogImage: '/og-images/cleaning-og.jpg',
    twitterCard: 'summary_large_image',
  },

  categories: [
    {
      id: 'commercial',
      name: 'Commercial Cleaning',
      description: 'Office buildings, retail spaces, and commercial facilities',
      icon: 'building',
    },
    {
      id: 'residential',
      name: 'Residential Cleaning',
      description: 'House cleaning and maid services',
      icon: 'home',
    },
    {
      id: 'janitorial',
      name: 'Janitorial Services',
      description: 'Large-scale facility maintenance and cleaning',
      icon: 'briefcase',
    },
    {
      id: 'carpet',
      name: 'Carpet & Upholstery',
      description: 'Specialized carpet, rug, and upholstery cleaning',
      icon: 'sparkles',
    },
    {
      id: 'window',
      name: 'Window Cleaning',
      description: 'Residential and commercial window cleaning services',
      icon: 'square',
    },
    {
      id: 'specialty',
      name: 'Specialty Cleaning',
      description: 'Post-construction, move-out, and other specialized cleaning',
      icon: 'star',
    },
    {
      id: 'pressure-washing',
      name: 'Pressure Washing',
      description: 'Exterior cleaning for buildings, driveways, and surfaces',
      icon: 'droplet',
    },
  ],

  valuationMultiples: {
    revenueMin: 0.35,
    revenueMax: 0.75,
    revenueMedian: 0.55,
    sdeMin: 2.0,
    sdeMax: 3.5,
    sdeMedian: 2.75,
    ebitdaMin: 3.0,
    ebitdaMax: 5.0,
    ebitdaMedian: 4.0,
  },

  brokerSources: [
    {
      name: 'BizBuySell',
      url: 'https://www.bizbuysell.com/businesses-for-sale/cleaning-businesses/',
      active: true,
      scraperConfig: {
        rateLimit: 30,
      },
    },
    {
      name: 'BizQuest',
      url: 'https://www.bizquest.com/businesses-for-sale/cleaning/',
      active: true,
      scraperConfig: {
        rateLimit: 20,
      },
    },
    {
      name: 'BusinessBroker.net',
      url: 'https://www.businessbroker.net/businesses-for-sale/cleaning-maintenance/',
      active: false,
    },
  ],

  emailTemplates: {
    welcome: {
      subject: 'Welcome to CleaningExits - Your Cleaning Business Marketplace',
      headerText: 'Welcome to CleaningExits!',
      ctaText: 'Browse Cleaning Businesses',
    },
    weeklyTop10: {
      subject: 'Top 10 Cleaning Businesses This Week | CleaningExits',
      headerText: 'This Week\'s Top Cleaning Business Opportunities',
      introText:
        'Here are the most promising cleaning businesses listed this week. Each has been verified and includes detailed financial information.',
    },
    newListing: {
      subject: 'New Cleaning Business Listed: {{businessName}}',
      headerText: 'New Opportunity Alert',
    },
    priceChange: {
      subject: 'Price Reduced: {{businessName}}',
      headerText: 'Price Drop Alert',
    },
    fromEmail: 'listings@cleaningexits.com',
    fromName: 'CleaningExits',
  },

  terminology: {
    businessTerm: 'Cleaning Business',
    businessTermPlural: 'Cleaning Businesses',
    revenueTerm: 'Annual Revenue',
    profitTerm: 'SDE',
    customMetrics: [
      {
        key: 'clientCount',
        label: 'Active Clients',
        description: 'Number of recurring clients',
        format: 'number',
      },
      {
        key: 'contractType',
        label: 'Contract Type',
        description: 'Residential, Commercial, or Mixed',
        format: 'text',
      },
      {
        key: 'recurringRevenue',
        label: 'Recurring Revenue %',
        description: 'Percentage of revenue from recurring contracts',
        format: 'percentage',
      },
      {
        key: 'employeeCount',
        label: 'Employees',
        description: 'Number of cleaning staff',
        format: 'number',
      },
    ],
  },

  custom: {
    // Industry-specific filters
    filters: {
      serviceArea: ['Urban', 'Suburban', 'Rural', 'Multi-location'],
      equipmentIncluded: true,
      vehiclesIncluded: true,
    },
  },
};
