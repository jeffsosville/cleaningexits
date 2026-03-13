import { VerticalConfig } from '../types';

/**
 * Plumbing Services Vertical Configuration
 */
export const plumbingVertical: VerticalConfig = {
  info: {
    name: 'Plumbing Services',
    slug: 'plumbing',
    domain: 'plumbingexits.com',
    brandColor: '#0EA5E9', // Sky Blue
    logoPath: '/logos/plumbing-logo.svg',
    faviconPath: '/favicons/plumbing-favicon.ico',
  },

  seo: {
    metaTitle: 'Plumbing Businesses for Sale | {{name}}',
    metaDescription:
      'Browse plumbing businesses for sale including residential, commercial, and specialty plumbing contractors. Find established plumbing companies with strong customer bases and verified financials.',
    keywords: [
      'plumbing business for sale',
      'plumbing company acquisition',
      'plumbing contractor for sale',
      'residential plumbing business',
      'commercial plumbing company',
      'plumbing service business for sale',
      'drain cleaning business',
      'pipe repair company',
      'water heater business',
      'plumbing route for sale',
    ],
    ogImage: '/og-images/plumbing-og.jpg',
    twitterCard: 'summary_large_image',
  },

  categories: [
    {
      id: 'full-service',
      name: 'Full Service Plumbing',
      description: 'Complete residential and commercial plumbing services',
      icon: 'droplet',
    },
    {
      id: 'residential',
      name: 'Residential Plumbing',
      description: 'Home plumbing repair, installation, and maintenance',
      icon: 'home',
    },
    {
      id: 'commercial',
      name: 'Commercial Plumbing',
      description: 'Large-scale commercial and industrial plumbing',
      icon: 'building',
    },
    {
      id: 'drain-sewer',
      name: 'Drain & Sewer',
      description: 'Drain cleaning, sewer lining, and pipe repair',
      icon: 'git-merge',
    },
    {
      id: 'water-heater',
      name: 'Water Heater Services',
      description: 'Water heater installation, repair, and tankless systems',
      icon: 'thermometer',
    },
    {
      id: 'remodel',
      name: 'Remodel & New Construction',
      description: 'Rough-in and finish plumbing for remodels and new builds',
      icon: 'tool',
    },
    {
      id: 'emergency',
      name: '24/7 Emergency Plumbing',
      description: 'Emergency plumbing response services',
      icon: 'alert-circle',
    },
    {
      id: 'water-treatment',
      name: 'Water Treatment',
      description: 'Water softeners, filtration, and purification systems',
      icon: 'filter',
    },
  ],

  valuationMultiples: {
    revenueMin: 0.45,
    revenueMax: 0.95,
    revenueMedian: 0.7,
    sdeMin: 2.5,
    sdeMax: 4.5,
    sdeMedian: 3.5,
    ebitdaMin: 3.5,
    ebitdaMax: 6.0,
    ebitdaMedian: 4.75,
  },

  brokerSources: [
    {
      name: 'BizBuySell',
      url: 'https://www.bizbuysell.com/businesses-for-sale/plumbing-businesses/',
      active: true,
      scraperConfig: {
        rateLimit: 30,
      },
    },
    {
      name: 'BizQuest',
      url: 'https://www.bizquest.com/businesses-for-sale/plumbing/',
      active: true,
      scraperConfig: {
        rateLimit: 20,
      },
    },
    {
      name: 'BusinessBroker.net',
      url: 'https://www.businessbroker.net/businesses-for-sale/plumbing/',
      active: false,
    },
  ],

  emailTemplates: {
    welcome: {
      subject: 'Welcome to PlumbingExits - Your Plumbing Business Marketplace',
      headerText: 'Welcome to PlumbingExits!',
      ctaText: 'Browse Plumbing Businesses',
    },
    weeklyTop10: {
      subject: 'Top 10 Plumbing Businesses This Week | PlumbingExits',
      headerText: "This Week's Top Plumbing Business Opportunities",
      introText:
        'Here are the most promising plumbing businesses listed this week. Each includes technician count, service contract details, and verified financials.',
    },
    newListing: {
      subject: 'New Plumbing Business Listed: {{businessName}}',
      headerText: 'New Opportunity Alert',
    },
    priceChange: {
      subject: 'Price Reduced: {{businessName}}',
      headerText: 'Price Drop Alert',
    },
    fromEmail: 'listings@plumbingexits.com',
    fromName: 'PlumbingExits',
  },

  terminology: {
    businessTerm: 'Plumbing Business',
    businessTermPlural: 'Plumbing Businesses',
    revenueTerm: 'Annual Revenue',
    profitTerm: 'SDE',
    customMetrics: [
      {
        key: 'technicianCount',
        label: 'Technicians',
        description: 'Number of licensed plumbers and apprentices',
        format: 'number',
      },
      {
        key: 'serviceContractRevenue',
        label: 'Service Contract Revenue %',
        description: 'Percentage from recurring maintenance agreements',
        format: 'percentage',
      },
      {
        key: 'avgTicket',
        label: 'Average Ticket',
        description: 'Average service call or job value',
        format: 'currency',
      },
      {
        key: 'commercialVsResidential',
        label: 'Commercial/Residential Mix',
        description: 'Revenue split between commercial and residential work',
        format: 'text',
      },
      {
        key: 'licenses',
        label: 'Licenses & Certifications',
        description: 'Master plumber licenses and specialty certifications',
        format: 'text',
      },
    ],
  },

  custom: {
    filters: {
      serviceArea: ['Urban', 'Suburban', 'Rural', 'Multi-location'],
      equipmentIncluded: true,
      vehiclesIncluded: true,
      revenueType: ['Service & Repair', 'New Construction', 'Commercial', 'Mixed'],
      specialties: ['Drain/Sewer', 'Water Heater', 'Remodel', 'Emergency', 'Water Treatment'],
    },
  },
};
