/**
 * Vertical Configuration Types
 *
 * Defines the structure for multi-vertical business configuration.
 * Each vertical (Cleaning, Landscape, HVAC, etc.) will implement this interface.
 */

/**
 * Basic information about the vertical
 */
export interface VerticalBasicInfo {
  /** Display name of the vertical (e.g., "Cleaning Services") */
  name: string;
  /** Short identifier used in code (e.g., "cleaning") */
  slug: string;
  /** Primary domain for this vertical */
  domain: string;
  /** Primary brand color (hex code) */
  brandColor: string;
  /** Path to the logo file (relative to /public) */
  logoPath: string;
  /** Path to favicon (relative to /public) */
  faviconPath: string;
}

/**
 * SEO metadata configuration
 */
export interface VerticalSEO {
  /** Default meta title template (use {{name}} for dynamic replacement) */
  metaTitle: string;
  /** Default meta description */
  metaDescription: string;
  /** SEO keywords for the industry */
  keywords: string[];
  /** Open Graph image path (relative to /public) */
  ogImage: string;
  /** Twitter card type */
  twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
}

/**
 * Business category within the vertical
 */
export interface VerticalCategory {
  /** Category identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category description */
  description: string;
  /** Icon name (from your icon library) */
  icon?: string;
}

/**
 * Valuation multiples for business pricing
 */
export interface ValuationMultiples {
  /** Minimum revenue multiple */
  revenueMin: number;
  /** Maximum revenue multiple */
  revenueMax: number;
  /** Median revenue multiple */
  revenueMedian: number;
  /** Minimum SDE (Seller's Discretionary Earnings) multiple */
  sdeMin: number;
  /** Maximum SDE multiple */
  sdeMax: number;
  /** Median SDE multiple */
  sdeMedian: number;
  /** Minimum EBITDA multiple */
  ebitdaMin?: number;
  /** Maximum EBITDA multiple */
  ebitdaMax?: number;
  /** Median EBITDA multiple */
  ebitdaMedian?: number;
}

/**
 * Data source for broker listings
 */
export interface BrokerDataSource {
  /** Broker name */
  name: string;
  /** Base URL for scraping */
  url: string;
  /** Whether this source is currently active */
  active: boolean;
  /** Scraper configuration (optional) */
  scraperConfig?: {
    /** CSS selectors or XPath for data extraction */
    selectors?: Record<string, string>;
    /** Rate limiting (requests per minute) */
    rateLimit?: number;
    /** Additional headers for requests */
    headers?: Record<string, string>;
  };
}

/**
 * Email template customization
 */
export interface EmailTemplates {
  /** Welcome email template */
  welcome: {
    subject: string;
    headerText: string;
    ctaText: string;
  };
  /** Weekly top 10 listings email */
  weeklyTop10: {
    subject: string;
    headerText: string;
    introText: string;
  };
  /** New listing alert */
  newListing: {
    subject: string;
    headerText: string;
  };
  /** Price change alert */
  priceChange: {
    subject: string;
    headerText: string;
  };
  /** From email address */
  fromEmail: string;
  /** From name */
  fromName: string;
}

/**
 * Industry-specific terminology mapping
 */
export interface IndustryTerminology {
  /** What you call a business listing (e.g., "Business", "Service", "Company") */
  businessTerm: string;
  /** Plural form */
  businessTermPlural: string;
  /** What you call revenue (e.g., "Revenue", "Sales", "Gross Income") */
  revenueTerm: string;
  /** What you call profit (e.g., "SDE", "EBITDA", "Net Profit") */
  profitTerm: string;
  /** Industry-specific metrics to display */
  customMetrics?: Array<{
    key: string;
    label: string;
    description: string;
    format?: 'currency' | 'percentage' | 'number' | 'text';
  }>;
}

/**
 * Main vertical configuration interface
 */
export interface VerticalConfig {
  /** Basic vertical information */
  info: VerticalBasicInfo;
  /** SEO configuration */
  seo: VerticalSEO;
  /** Available categories in this vertical */
  categories: VerticalCategory[];
  /** Valuation multiples for pricing */
  valuationMultiples: ValuationMultiples;
  /** Broker data sources to scrape */
  brokerSources: BrokerDataSource[];
  /** Email template customizations */
  emailTemplates: EmailTemplates;
  /** Industry-specific terminology */
  terminology: IndustryTerminology;
  /** Additional custom configuration (optional) */
  custom?: Record<string, any>;
}

/**
 * Hostname to vertical mapping
 */
export interface VerticalHostnameMapping {
  /** Hostname (e.g., "cleaningexits.com") */
  hostname: string;
  /** Vertical slug */
  verticalSlug: string;
  /** Whether this is the primary domain for this vertical */
  isPrimary: boolean;
}

/**
 * Global verticals registry
 */
export interface VerticalRegistry {
  /** Map of vertical slug to configuration */
  verticals: Record<string, VerticalConfig>;
  /** Hostname mappings */
  hostnameMappings: VerticalHostnameMapping[];
  /** Default vertical slug (fallback) */
  defaultVertical: string;
}
