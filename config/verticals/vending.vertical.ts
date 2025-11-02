import { VerticalConfig } from '../types';

/**
 * Vending Machine Services Vertical Configuration
 */
export const vendingVertical: VerticalConfig = {
  info: {
    name: 'Vending Machine Businesses',
    slug: 'vending',
    domain: 'vendingexits.com',
    brandColor: '#F59E0B', // Amber/Orange
    logoPath: '/logos/vending-logo.svg',
    faviconPath: '/favicons/vending-favicon.ico',
  },

  seo: {
    metaTitle: 'Vending Machine Businesses for Sale | {{name}}',
    metaDescription:
      'Find profitable vending machine businesses for sale. Browse beverage vending, snack machines, combo vending routes, ATM businesses, and specialty vending operations. Verified listings with financial details and route information.',
    keywords: [
      'vending machine business for sale',
      'vending route for sale',
      'vending machine route',
      'snack vending business',
      'beverage vending machines',
      'combo vending machines',
      'ATM business for sale',
      'vending machine franchise',
      'bulk vending business',
      'micro market business',
      'healthy vending machines',
      'vending machine investment',
    ],
    ogImage: '/og-images/vending-og.jpg',
    twitterCard: 'summary_large_image',
  },

  categories: [
    {
      id: 'beverage',
      name: 'Beverage Vending',
      description: 'Soda, water, energy drinks, and cold beverage machines',
      icon: 'droplet',
    },
    {
      id: 'snack',
      name: 'Snack Vending',
      description: 'Chips, candy, crackers, and snack food machines',
      icon: 'star',
    },
    {
      id: 'combo',
      name: 'Combo Vending',
      description: 'Full-line machines offering both snacks and beverages',
      icon: 'briefcase',
    },
    {
      id: 'healthy',
      name: 'Healthy Vending',
      description: 'Fresh food, salads, and health-conscious options',
      icon: 'heart',
    },
    {
      id: 'specialty',
      name: 'Specialty Vending',
      description: 'Coffee, ice cream, hot food, and unique vending solutions',
      icon: 'sparkles',
    },
    {
      id: 'bulk',
      name: 'Bulk Vending',
      description: 'Gumball, toy, and quarter-operated bulk vending machines',
      icon: 'circle',
    },
    {
      id: 'atm',
      name: 'ATM Business',
      description: 'ATM placement and operation businesses',
      icon: 'credit-card',
    },
    {
      id: 'micro-market',
      name: 'Micro Markets',
      description: 'Self-checkout convenience store kiosks',
      icon: 'shopping-cart',
    },
  ],

  valuationMultiples: {
    revenueMin: 0.4,
    revenueMax: 0.8,
    revenueMedian: 0.6,
    sdeMin: 2.5,
    sdeMax: 4.0,
    sdeMedian: 3.25,
    ebitdaMin: 3.5,
    ebitdaMax: 5.5,
    ebitdaMedian: 4.5,
  },

  brokerSources: [
    {
      name: 'BizBuySell',
      url: 'https://www.bizbuysell.com/businesses-for-sale/vending-machines/',
      active: true,
      scraperConfig: {
        rateLimit: 30,
      },
    },
    {
      name: 'BizQuest',
      url: 'https://www.bizquest.com/businesses-for-sale/vending/',
      active: true,
      scraperConfig: {
        rateLimit: 20,
      },
    },
    {
      name: 'BusinessBroker.net',
      url: 'https://www.businessbroker.net/businesses-for-sale/vending/',
      active: false,
    },
  ],

  emailTemplates: {
    welcome: {
      subject: 'Welcome to VendingExits - Your Vending Machine Business Marketplace',
      headerText: 'Welcome to VendingExits!',
      ctaText: 'Browse Vending Businesses',
    },
    weeklyTop10: {
      subject: 'Top 10 Vending Machine Businesses This Week | VendingExits',
      headerText: 'This Week\'s Top Vending Business Opportunities',
      introText:
        'Here are the most promising vending machine businesses listed this week. Each has been verified and includes detailed financial information and route details.',
    },
    newListing: {
      subject: 'New Vending Business Listed: {{businessName}}',
      headerText: 'New Opportunity Alert',
    },
    priceChange: {
      subject: 'Price Reduced: {{businessName}}',
      headerText: 'Price Drop Alert',
    },
    fromEmail: 'listings@vendingexits.com',
    fromName: 'VendingExits',
  },

  terminology: {
    businessTerm: 'Vending Business',
    businessTermPlural: 'Vending Businesses',
    revenueTerm: 'Annual Revenue',
    profitTerm: 'SDE',
    customMetrics: [
      {
        key: 'machineCount',
        label: 'Number of Machines',
        description: 'Total vending machines in operation',
        format: 'number',
      },
      {
        key: 'locationCount',
        label: 'Number of Locations',
        description: 'Total placement locations/accounts',
        format: 'number',
      },
      {
        key: 'routeFrequency',
        label: 'Service Frequency',
        description: 'How often routes are serviced (weekly, bi-weekly, etc.)',
        format: 'text',
      },
      {
        key: 'machineAge',
        label: 'Average Machine Age',
        description: 'Average age of machines in years',
        format: 'number',
      },
      {
        key: 'revenuePerMachine',
        label: 'Revenue per Machine',
        description: 'Average monthly revenue per machine',
        format: 'currency',
      },
      {
        key: 'contractType',
        label: 'Location Contracts',
        description: 'Percentage of locations with formal contracts',
        format: 'percentage',
      },
      {
        key: 'productMix',
        label: 'Product Mix',
        description: 'Breakdown of products sold (snacks, beverages, etc.)',
        format: 'text',
      },
    ],
  },

  custom: {
    // Industry-specific filters
    filters: {
      locationTypes: ['Office Buildings', 'Schools', 'Hospitals', 'Manufacturing', 'Retail', 'Multi-location'],
      machinesIncluded: true,
      inventoryIncluded: true,
      vehicleIncluded: false,
      routeType: ['Full-time', 'Part-time', 'Passive Income'],
    },
  },
};
