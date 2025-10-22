import { VerticalConfig } from '../types';

/**
 * HVAC Services Vertical Configuration
 */
export const hvacVertical: VerticalConfig = {
  info: {
    name: 'HVAC Services',
    slug: 'hvac',
    domain: 'hvacexits.com',
    brandColor: '#EF4444', // Red
    logoPath: '/logos/hvac-logo.svg',
    faviconPath: '/favicons/hvac-favicon.ico',
  },

  seo: {
    metaTitle: 'HVAC Businesses for Sale | {{name}}',
    metaDescription:
      'Browse HVAC businesses for sale including heating, cooling, and ventilation companies. Find profitable HVAC contractors with established customer bases and verified financials.',
    keywords: [
      'hvac business for sale',
      'heating and cooling business',
      'hvac company acquisition',
      'air conditioning business',
      'hvac contractor for sale',
      'heating business for sale',
      'ventilation company',
      'hvac service business',
      'hvac installation business',
      'commercial hvac business',
    ],
    ogImage: '/og-images/hvac-og.jpg',
    twitterCard: 'summary_large_image',
  },

  categories: [
    {
      id: 'full-service',
      name: 'Full Service HVAC',
      description: 'Complete heating, cooling, and ventilation services',
      icon: 'wind',
    },
    {
      id: 'residential',
      name: 'Residential HVAC',
      description: 'Home heating and cooling systems',
      icon: 'home',
    },
    {
      id: 'commercial',
      name: 'Commercial HVAC',
      description: 'Large-scale commercial systems and facilities',
      icon: 'building',
    },
    {
      id: 'installation',
      name: 'HVAC Installation',
      description: 'New system sales and installation',
      icon: 'tool',
    },
    {
      id: 'maintenance',
      name: 'Maintenance & Repair',
      description: 'Service contracts and repair work',
      icon: 'wrench',
    },
    {
      id: 'refrigeration',
      name: 'Refrigeration',
      description: 'Commercial refrigeration systems',
      icon: 'snowflake',
    },
    {
      id: 'ductwork',
      name: 'Ductwork & Ventilation',
      description: 'Air duct installation and cleaning',
      icon: 'box',
    },
    {
      id: 'specialty',
      name: 'Specialty Systems',
      description: 'Geothermal, solar HVAC, and specialty installations',
      icon: 'zap',
    },
  ],

  valuationMultiples: {
    revenueMin: 0.5,
    revenueMax: 1.0,
    revenueMedian: 0.75,
    sdeMin: 2.5,
    sdeMax: 4.5,
    sdeMedian: 3.5,
    ebitdaMin: 4.0,
    ebitdaMax: 6.5,
    ebitdaMedian: 5.25,
  },

  brokerSources: [
    {
      name: 'BizBuySell',
      url: 'https://www.bizbuysell.com/businesses-for-sale/hvac-businesses/',
      active: true,
      scraperConfig: {
        rateLimit: 30,
      },
    },
    {
      name: 'BizQuest',
      url: 'https://www.bizquest.com/businesses-for-sale/hvac/',
      active: true,
      scraperConfig: {
        rateLimit: 20,
      },
    },
    {
      name: 'HVAC Trader',
      url: 'https://www.hvactrader.com/businesses',
      active: false,
    },
  ],

  emailTemplates: {
    welcome: {
      subject: 'Welcome to HVACExits - Your HVAC Business Marketplace',
      headerText: 'Welcome to HVACExits!',
      ctaText: 'Browse HVAC Businesses',
    },
    weeklyTop10: {
      subject: 'Top 10 HVAC Businesses This Week | HVACExits',
      headerText: 'This Week\'s Top HVAC Business Opportunities',
      introText:
        'Here are the most promising HVAC businesses listed this week. Each includes detailed financial data, customer contracts, and equipment inventories.',
    },
    newListing: {
      subject: 'New HVAC Business Listed: {{businessName}}',
      headerText: 'New Opportunity Alert',
    },
    priceChange: {
      subject: 'Price Reduced: {{businessName}}',
      headerText: 'Price Drop Alert',
    },
    fromEmail: 'listings@hvacexits.com',
    fromName: 'HVACExits',
  },

  terminology: {
    businessTerm: 'HVAC Business',
    businessTermPlural: 'HVAC Businesses',
    revenueTerm: 'Annual Revenue',
    profitTerm: 'SDE',
    customMetrics: [
      {
        key: 'serviceContracts',
        label: 'Service Contracts',
        description: 'Number of active maintenance agreements',
        format: 'number',
      },
      {
        key: 'installationRevenue',
        label: 'Installation Revenue %',
        description: 'Percentage from new installations vs. service',
        format: 'percentage',
      },
      {
        key: 'technicianCount',
        label: 'Technicians',
        description: 'Number of certified HVAC technicians',
        format: 'number',
      },
      {
        key: 'avgTicket',
        label: 'Average Ticket',
        description: 'Average service call value',
        format: 'currency',
      },
      {
        key: 'certifications',
        label: 'Certifications',
        description: 'EPA, NATE, and manufacturer certifications',
        format: 'text',
      },
    ],
  },

  custom: {
    filters: {
      serviceArea: ['Urban', 'Suburban', 'Rural', 'Multi-location'],
      equipmentIncluded: true,
      vehiclesIncluded: true,
      revenueType: ['Service', 'Installation', 'Mixed'],
      certifications: ['EPA Universal', 'NATE Certified', 'Manufacturer Certified'],
    },
  },
};
