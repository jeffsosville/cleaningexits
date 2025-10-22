# Vertical Configuration System

A scalable, type-safe configuration system for managing multiple business verticals (Cleaning, Landscape, HVAC, etc.).

## 📁 Structure

```
config/
├── index.ts                    # Main export point
├── types.ts                    # TypeScript interfaces
├── verticals/
│   ├── index.ts               # Vertical exports
│   ├── registry.ts            # Hostname mappings & registry
│   ├── utils.ts               # Utility functions
│   ├── cleaning.vertical.ts   # Cleaning config
│   ├── landscape.vertical.ts  # Landscape config
│   └── hvac.vertical.ts       # HVAC config
└── README.md                  # This file
```

## 🚀 Quick Start

### Get Current Vertical (Server-side)

```typescript
import { getCurrentVertical } from '@/config';

export async function getServerSideProps({ req }) {
  const vertical = getCurrentVertical(req);

  return {
    props: {
      brandColor: vertical.info.brandColor,
      seoTitle: vertical.seo.metaTitle,
    },
  };
}
```

### Get Current Vertical (Client-side)

```typescript
import { getCurrentVerticalClient } from '@/config';

function MyComponent() {
  const vertical = getCurrentVerticalClient();

  return (
    <div style={{ color: vertical.info.brandColor }}>
      {vertical.info.name}
    </div>
  );
}
```

### Get Vertical by Slug

```typescript
import { getVerticalBySlug } from '@/config';

const cleaningConfig = getVerticalBySlug('cleaning');
console.log(cleaningConfig.info.name); // "Cleaning Services"
```

### Access Specific Vertical Config

```typescript
import { cleaningVertical, landscapeVertical, hvacVertical } from '@/config';

// Use directly
console.log(cleaningVertical.info.brandColor); // "#3B82F6"
console.log(landscapeVertical.valuationMultiples.sdeMedian); // 3.1
```

## 🎯 Configuration Options

Each vertical includes:

| Section | Description | Example |
|---------|-------------|---------|
| **Basic Info** | Name, domain, brand color, logo | `vertical.info.brandColor` |
| **SEO** | Meta tags, keywords, OG images | `vertical.seo.metaTitle` |
| **Categories** | Industry-specific categories | `vertical.categories` |
| **Valuations** | Revenue/SDE/EBITDA multiples | `vertical.valuationMultiples.sdeMedian` |
| **Broker Sources** | URLs to scrape for listings | `vertical.brokerSources` |
| **Email Templates** | Customized email content | `vertical.emailTemplates.welcome` |
| **Terminology** | Industry-specific terms | `vertical.terminology.businessTerm` |
| **Custom** | Vertical-specific config | `vertical.custom.filters` |

## 📝 Adding a New Vertical

### Step 1: Create Config File

Create `config/verticals/plumbing.vertical.ts`:

```typescript
import { VerticalConfig } from '../types';

export const plumbingVertical: VerticalConfig = {
  info: {
    name: 'Plumbing Services',
    slug: 'plumbing',
    domain: 'plumbingexits.com',
    brandColor: '#0EA5E9',
    logoPath: '/logos/plumbing-logo.svg',
    faviconPath: '/favicons/plumbing-favicon.ico',
  },

  seo: {
    metaTitle: 'Plumbing Businesses for Sale | {{name}}',
    metaDescription: 'Find profitable plumbing businesses...',
    keywords: ['plumbing business for sale', ...],
    ogImage: '/og-images/plumbing-og.jpg',
    twitterCard: 'summary_large_image',
  },

  categories: [
    { id: 'residential', name: 'Residential Plumbing', ... },
    { id: 'commercial', name: 'Commercial Plumbing', ... },
  ],

  valuationMultiples: {
    revenueMin: 0.45,
    revenueMax: 0.9,
    revenueMedian: 0.675,
    sdeMin: 2.3,
    sdeMax: 4.2,
    sdeMedian: 3.25,
  },

  brokerSources: [...],
  emailTemplates: {...},
  terminology: {...},
};
```

### Step 2: Add to Registry

Update `config/verticals/registry.ts`:

```typescript
import { plumbingVertical } from './plumbing.vertical';

export const verticalRegistry: VerticalRegistry = {
  verticals: {
    cleaning: cleaningVertical,
    landscape: landscapeVertical,
    hvac: hvacVertical,
    plumbing: plumbingVertical, // ✅ Add here
  },

  hostnameMappings: [
    // ... existing mappings
    { hostname: 'plumbingexits.com', verticalSlug: 'plumbing', isPrimary: true },
    { hostname: 'www.plumbingexits.com', verticalSlug: 'plumbing', isPrimary: false },
  ],

  defaultVertical: 'cleaning',
};
```

### Step 3: Export from Index

Update `config/verticals/index.ts`:

```typescript
export { plumbingVertical } from './plumbing.vertical';
```

Update `config/index.ts`:

```typescript
export {
  cleaningVertical,
  landscapeVertical,
  hvacVertical,
  plumbingVertical, // ✅ Add here
  // ...
} from './verticals';
```

**That's it!** Your new vertical is now fully integrated.

## 🛠️ Utility Functions

| Function | Usage | Description |
|----------|-------|-------------|
| `getVerticalBySlug(slug)` | `getVerticalBySlug('cleaning')` | Get config by slug |
| `getVerticalByHostname(hostname)` | `getVerticalByHostname('cleaningexits.com')` | Get config by domain |
| `getCurrentVertical(req)` | `getCurrentVertical(req)` | Server-side current vertical |
| `getCurrentVerticalClient()` | `getCurrentVerticalClient()` | Client-side current vertical |
| `getAllVerticals()` | `getAllVerticals()` | Get all vertical configs |
| `getAllVerticalSlugs()` | `getAllVerticalSlugs()` | Get all slugs |
| `isValidVertical(slug)` | `isValidVertical('hvac')` | Check if slug exists |
| `getPrimaryHostname(slug)` | `getPrimaryHostname('cleaning')` | Get primary domain |
| `getAllHostnames(slug)` | `getAllHostnames('landscape')` | Get all domains |

## 💡 Usage Examples

### Dynamic SEO Meta Tags

```typescript
import { getCurrentVertical } from '@/config';
import Head from 'next/head';

export default function Page({ vertical }) {
  return (
    <>
      <Head>
        <title>{vertical.seo.metaTitle.replace('{{name}}', vertical.info.name)}</title>
        <meta name="description" content={vertical.seo.metaDescription} />
        <meta name="keywords" content={vertical.seo.keywords.join(', ')} />
      </Head>
      {/* ... */}
    </>
  );
}

export async function getServerSideProps({ req }) {
  return { props: { vertical: getCurrentVertical(req) } };
}
```

### Dynamic Brand Colors

```typescript
import { getCurrentVerticalClient } from '@/config';

function Header() {
  const vertical = getCurrentVerticalClient();

  return (
    <header style={{ backgroundColor: vertical.info.brandColor }}>
      <img src={vertical.info.logoPath} alt={vertical.info.name} />
    </header>
  );
}
```

### Valuation Calculator

```typescript
import { getCurrentVertical } from '@/config';

function calculateValuation(revenue: number, sde: number, vertical: VerticalConfig) {
  const { valuationMultiples } = vertical;

  return {
    revenueMin: revenue * valuationMultiples.revenueMin,
    revenueMax: revenue * valuationMultiples.revenueMax,
    sdeMin: sde * valuationMultiples.sdeMin,
    sdeMax: sde * valuationMultiples.sdeMax,
  };
}
```

### Category Filters

```typescript
import { cleaningVertical } from '@/config';

function CategoryFilter() {
  return (
    <select>
      {cleaningVertical.categories.map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
```

### Send Vertical-Specific Email

```typescript
import { getCurrentVertical } from '@/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const vertical = getCurrentVertical(req);
  const { emailTemplates } = vertical;

  await resend.emails.send({
    from: `${emailTemplates.fromName} <${emailTemplates.fromEmail}>`,
    to: 'user@example.com',
    subject: emailTemplates.welcome.subject,
    html: `<h1>${emailTemplates.welcome.headerText}</h1>`,
  });

  res.status(200).json({ success: true });
}
```

## 🔒 Type Safety

All configurations are fully typed with TypeScript:

```typescript
import { VerticalConfig } from '@/config';

// ✅ Type-safe access
function processVertical(vertical: VerticalConfig) {
  // Autocomplete works!
  vertical.info.brandColor;
  vertical.valuationMultiples.sdeMedian;
  vertical.categories[0].name;
}

// ❌ TypeScript will catch errors
vertical.info.invalidProperty; // Error!
vertical.valuationMultiples.typo; // Error!
```

## 🎨 Customization

Each vertical can have custom configuration:

```typescript
export const cleaningVertical: VerticalConfig = {
  // ... standard config
  custom: {
    filters: {
      serviceArea: ['Urban', 'Suburban', 'Rural'],
      equipmentIncluded: true,
    },
    specialFeatures: ['certified-organic', 'eco-friendly'],
  },
};

// Access custom config
const filters = cleaningVertical.custom?.filters;
```

## 🌐 Multi-Domain Support

The system automatically maps hostnames to verticals:

```
cleaningexits.com     → Cleaning vertical
landscapeexits.com    → Landscape vertical
hvacexits.com         → HVAC vertical
localhost             → Cleaning (default for development)
```

## 📊 Best Practices

1. **Keep configs DRY**: Extract common patterns into helper functions
2. **Use the default vertical**: Set a sensible default for localhost/unknown domains
3. **Validate hostnames**: Add all variations (www, non-www, subdomains)
4. **Document custom fields**: Add comments for any `custom` configuration
5. **Update types first**: When adding new fields, update `types.ts` first
6. **Test both sides**: Verify server-side and client-side access
7. **Use path aliases**: Import from `@/config` instead of relative paths

## 🔄 Migration Guide

To migrate existing hardcoded values:

```typescript
// ❌ Before
const brandColor = '#3B82F6';
const metaTitle = 'Cleaning Businesses for Sale';

// ✅ After
import { getCurrentVertical } from '@/config';
const vertical = getCurrentVertical(req);
const brandColor = vertical.info.brandColor;
const metaTitle = vertical.seo.metaTitle;
```

## 📚 Reference

- **Types**: `config/types.ts`
- **Registry**: `config/verticals/registry.ts`
- **Utilities**: `config/verticals/utils.ts`
- **Examples**: This README

---

**Questions?** Check the inline comments in each config file or refer to the TypeScript interfaces in `types.ts`.
