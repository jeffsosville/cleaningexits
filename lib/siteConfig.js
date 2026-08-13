// lib/siteConfig.js
// Single source of truth for per-vertical copy and thresholds.
// Set NEXT_PUBLIC_VERTICAL=cleaning | vending in each site's env.

const CONFIGS = {
  cleaning: {
    vertical: 'cleaning',
    siteName: 'CleaningExits',
    domain: 'https://cleaningexits.com',
    // What owners call themselves. Used in headlines and <title>.
    businessNoun: 'cleaning business',
    businessNounPlural: 'cleaning businesses',
    industryLabel: 'Commercial & Residential Cleaning',
    // Seller-intent H1s
    valuationH1: 'What is my cleaning business worth?',
    valuationLede:
      'Most valuation guides quote a range someone made up in 2015. This one is calculated from live and closed listings, updated as the market moves.',
    // Vertical-specific value drivers shown on the valuation page.
    drivers: [
      {
        title: 'Recurring contracts',
        body: 'Buyers pay for contracted monthly revenue, not one-off jobs. A book weighted toward multi-year commercial contracts prices above one built on residential turnover.',
      },
      {
        title: 'Owner dependence',
        body: 'If you still clean, quote, or hold the key customer relationships, a buyer is purchasing a job. Supervisors and a working manager move you up the range.',
      },
      {
        title: 'Customer concentration',
        body: 'One account above roughly a quarter of revenue is the most common reason a cleaning deal reprices during diligence.',
      },
      {
        title: 'Labor stability',
        body: 'Documented crews, legal classification, and low turnover reduce the risk a buyer inherits. Undocumented 1099 crews are a discount.',
      },
    ],
    // Geo pages only ship above this active-listing count.
    geoThreshold: 15,
    accent: '#0F6B4F',
  },
  vending: {
    vertical: 'vending',
    siteName: 'VendingExits',
    domain: 'https://vendingexits.com',
    businessNoun: 'vending route',
    businessNounPlural: 'vending routes',
    industryLabel: 'Vending & Micro Markets',
    valuationH1: 'What is my vending route worth?',
    valuationLede:
      'Route valuations get quoted as rules of thumb passed between operators. These figures come from actual listings and closed sales, with the sample size shown for every number.',
    drivers: [
      {
        title: 'Location agreements',
        body: 'Written, assignable contracts with real terms are the asset. Handshake placements transfer poorly and buyers discount them heavily.',
      },
      {
        title: 'Machine age and card readers',
        body: 'A fleet that already takes cards is worth more than one a buyer has to retrofit. Age of equipment sets the capital expenditure the buyer models on day one.',
      },
      {
        title: 'Route density',
        body: 'Stops per mile drives the labor cost of running the route. A tight geographic footprint prices above a scattered one with the same revenue.',
      },
      {
        title: 'Commission structure',
        body: 'What you pay locations comes straight out of the buyer\u2019s margin. Below-market commissions that are due for renegotiation get priced in.',
      },
    ],
    geoThreshold: 15,
    accent: '#7A3E9D',
  },
};

export function getSiteConfig() {
  const v = process.env.NEXT_PUBLIC_VERTICAL || 'cleaning';
  const cfg = CONFIGS[v];
  if (!cfg) throw new Error(`Unknown NEXT_PUBLIC_VERTICAL: ${v}`);
  return cfg;
}

export default CONFIGS;
