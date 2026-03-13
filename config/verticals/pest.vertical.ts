import { VerticalConfig } from '../types';

/**
 * Pest Control Vertical Configuration
 */
export const pestVertical: VerticalConfig = {
  info: {
    name: 'Pest Control',
    slug: 'pest',
    domain: 'pestexits.com',
    brandColor: '#16A34A', // Green
    logoPath: '/logos/pest-logo.svg',
    faviconPath: '/favicons/pest-favicon.ico',
  },

  seo: {
    metaTitle: 'Pest Control Businesses for Sale | {{name}}',
    metaDescription:
      'Browse pest control businesses for sale including exterminating, termite, and wildlife removal companies. Find profitable pest control routes with recurring revenue and verified financials.',
    keywords: [
      'pest control business for sale',
      'exterminating business for sale',
      'termite company for sale',
      'pest control route for sale',
      'pest control company acquisition',
      'bug spray business for sale',
      'wildlife removal business',
      'rodent control business',
      'fumigation company for sale',
      'commercial pest control business',
    ],
    ogImage: '/og-images/pest-og.jpg',
    twitterCard: 'summary_large_image',
  },

  categories: [
    {
      id: 'general-pest',
      name: 'General Pest Control',
      description: 'Full-service residential and commercial pest management',
      icon: 'shield',
    },
    {
      id: 'termite',
      name: 'Termite Control',
      description: 'Termite inspection, treatment, and prevention services',
      icon: 'bug',
    },
    {
      id: 'rodent',
      name: 'Rodent Control',
      description: 'Rat, mouse, and rodent exclusion and removal',
      icon: 'alert-triangle',
    },
    {
      id: 'wildlife',
      name: 'Wildlife Removal',
      description: 'Humane wildlife trapping and exclusion services',
      icon: 'feather',
    },
    {
      id: 'fumigation',
      name: 'Fumigation',
      description: 'Whole-structure fumigation and tent treatments',
      icon: 'wind',
    },
    {
      id: 'mosquito',
      name: 'Mosquito & Lawn',
      description: 'Outdoor mosquito, tick, and lawn pest programs',
      icon: 'sun',
    },
    {
      id: 'bed-bug',
      name: 'Bed Bug Treatment',
      description: 'Residential and commercial bed bug extermination',
      icon: 'moon',
    },
    {
      id: 'commercial',
      name: 'Commercial Pest Control',
      description: 'Food service, hospitality, and facility pest management',
      icon: 'building',
    },
  ],

  valuationMultiples: {
    revenueMin: 0.6,
    revenueMax: 1.2,
    revenueMedian: 0.9,
    sdeMin: 2.5,
    sdeMax: 4.5,
    sdeMedian: 3.5,
    ebitdaMin: 4.0,
    ebitdaMax: 7.0,
    ebitdaMedian: 5.5,
  },

  brokerSources: [
    {
      name: 'BizBuySell',
      url: 'https://www.bizbuysell.com/businesses-for-sale/pest-control-businesses/',
      active: true,
      scraperConfig: {
        rateLimit: 30,
      },
    },
    {
      name: 'BizQuest',
      url: 'https://www.bizquest.com/businesses-for-sale/pest-control/',
      active: true,
      scraperConfig: {
        rateLimit: 20,
      },
    },
    {
      name: 'BusinessBroker.net',
      url: 'https://www.businessbroker.net/businesses-for-sale/pest-control/',
      active: false,
    },
  ],

  emailTemplates: {
    welcome: {
      subject: 'Welcome to PestExits - Your Pest Control Business Marketplace',
      headerText: 'Welcome to PestExits!',
      ctaText: 'Browse Pest Control Businesses',
    },
    weeklyTop10: {
      subject: 'Top 10 Pest Control Businesses This Week | PestExits',
      headerText: "This Week's Top Pest Control Business Opportunities",
      introText:
        'Here are the most promising pest control businesses listed this week. Each includes route details, recurring contract breakdowns, and verified financials.',
    },
    newListing: {
      subject: 'New Pest Control Business Listed: {{businessName}}',
      headerText: 'New Opportunity Alert',
    },
    priceChange: {
      subject: 'Price Reduced: {{businessName}}',
      headerText: 'Price Drop Alert',
    },
    fromEmail: 'listings@pestexits.com',
    fromName: 'PestExits',
  },

  terminology: {
    businessTerm: 'Pest Control Business',
    businessTermPlural: 'Pest Control Businesses',
    revenueTerm: 'Annual Revenue',
    profitTerm: 'SDE',
    customMetrics: [
      {
        key: 'recurringAccounts',
        label: 'Recurring Accounts',
        description: 'Number of active service agreement customers',
        format: 'number',
      },
      {
        key: 'recurringRevenue',
        label: 'Recurring Revenue %',
        description: 'Percentage of revenue from service contracts vs. one-time jobs',
        format: 'percentage',
      },
      {
        key: 'technicianCount',
        label: 'Technicians',
        description: 'Number of licensed pest control technicians',
        format: 'number',
      },
      {
        key: 'avgMonthlyRoute',
        label: 'Avg Monthly Route Value',
        description: 'Average monthly recurring revenue per route',
        format: 'currency',
      },
      {
        key: 'licenses',
        label: 'State Licenses',
        description: 'State pest control applicator licenses held',
        format: 'text',
      },
    ],
  },

  custom: {
    filters: {
      serviceArea: ['Urban', 'Suburban', 'Rural', 'Multi-location'],
      equipmentIncluded: true,
      vehiclesIncluded: true,
      revenueType: ['Recurring Contracts', 'One-time Treatments', 'Mixed'],
      specialties: ['General Pest', 'Termite', 'Wildlife', 'Fumigation', 'Mosquito'],
    },
  },
};
