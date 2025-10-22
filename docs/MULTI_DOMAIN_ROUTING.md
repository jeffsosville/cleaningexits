# Multi-Domain Routing Setup

This document explains how the multi-domain routing system works and how to use it throughout the application.

## Overview

The application supports multiple domains pointing to the same Next.js app, with each domain representing a different vertical (business category):

- **cleaningexits.com** → Cleaning Services vertical
- **landscapeexits.com** → Landscape Services vertical
- **hvacexits.com** → HVAC Services vertical
- **localhost** → Defaults to Cleaning (for development)

## Architecture

The multi-domain routing system consists of four main components:

### 1. Vertical Configuration (`/config/verticals/`)

Each vertical has its own configuration file defining:
- Basic info (name, slug, domain, branding)
- SEO metadata
- Industry categories
- Valuation multiples
- Broker data sources
- Email templates
- Industry terminology

**Example:**
```typescript
// config/verticals/cleaning.vertical.ts
export const cleaningVertical: VerticalConfig = {
  info: {
    name: 'Cleaning Services',
    slug: 'cleaning',
    domain: 'cleaningexits.com',
    brandColor: '#3B82F6',
    logoPath: '/logos/cleaning-logo.svg',
  },
  // ... more configuration
};
```

### 2. Middleware (`/middleware.ts`)

The Next.js middleware automatically:
- Detects the incoming domain from request headers
- Maps the domain to a vertical using the registry
- Injects vertical information into request headers
- Handles production domains and localhost
- Provides fallback to default vertical

### 3. React Context (`/contexts/VerticalContext.tsx`)

Provides vertical configuration to all client-side components via React Context.

### 4. Server Utils (`/lib/verticalServerUtils.ts`)

Utilities for accessing vertical data in server-side contexts like `getServerSideProps`.

## Usage

### Client-Side Usage

#### Basic Usage with Hook

Use the `useVertical()` hook to access vertical data in any component:

```tsx
import { useVertical } from '../contexts/VerticalContext';

function MyComponent() {
  const { vertical, isLoading } = useVertical();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ color: vertical.info.brandColor }}>
        {vertical.info.name}
      </h1>
      <p>Welcome to {vertical.info.domain}</p>

      {/* Access categories */}
      <ul>
        {vertical.categories.map(cat => (
          <li key={cat.id}>{cat.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### Using the HOC Pattern

For class components or when you prefer HOC:

```tsx
import { withVertical } from '../contexts/VerticalContext';
import { VerticalConfig } from '../config/types';

interface MyComponentProps {
  vertical: VerticalConfig;
}

function MyComponent({ vertical }: MyComponentProps) {
  return <h1>{vertical.info.name}</h1>;
}

export default withVertical(MyComponent);
```

#### Direct Access (Outside React)

If you need to access vertical configuration outside of React components:

```typescript
import { getCurrentVerticalClient } from '../config/verticals/utils';

// Only works in browser
const vertical = getCurrentVerticalClient();
console.log(vertical.info.name);
```

### Server-Side Usage

#### In getServerSideProps (Simple)

```tsx
import { GetServerSidePropsContext } from 'next';
import { getVerticalFromContext } from '../lib/verticalServerUtils';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const vertical = getVerticalFromContext(context);

  return {
    props: {
      vertical, // Automatically available in VerticalProvider
      pageTitle: `Welcome to ${vertical.info.name}`,
    },
  };
};
```

#### Using the HOF Pattern

For cleaner code, use the `withVerticalSSR` helper:

```tsx
import { withVerticalSSR } from '../lib/verticalServerUtils';

export const getServerSideProps = withVerticalSSR(async (context, vertical) => {
  // Vertical is automatically injected as the second parameter

  // Fetch data specific to this vertical
  const listings = await supabase
    .from('listings')
    .select('*')
    .eq('vertical', vertical.info.slug)
    .limit(10);

  return {
    props: {
      listings,
      // vertical is automatically added to props
    },
  };
});
```

#### Vertical-Specific Pages

Restrict a page to only certain verticals:

```tsx
import { GetServerSidePropsContext } from 'next';
import { isVertical } from '../lib/verticalServerUtils';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  // Only show this page for the cleaning vertical
  if (!isVertical(context, 'cleaning')) {
    return { notFound: true };
  }

  return { props: {} };
};
```

#### In API Routes

Access vertical information from middleware headers:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentVertical } from '../config/verticals/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const vertical = getCurrentVertical(req);

  // Use vertical configuration
  res.json({
    vertical: vertical.info.name,
    slug: vertical.info.slug,
    categories: vertical.categories,
  });
}
```

### Common Use Cases

#### Dynamic Branding

```tsx
import { useVertical } from '../contexts/VerticalContext';

function Header() {
  const { vertical } = useVertical();

  return (
    <header style={{ backgroundColor: vertical.info.brandColor }}>
      <img src={vertical.info.logoPath} alt={vertical.info.name} />
      <nav>
        {/* Navigation items */}
      </nav>
    </header>
  );
}
```

#### SEO Metadata

```tsx
import Head from 'next/head';
import { useVertical } from '../contexts/VerticalContext';

function MyPage() {
  const { vertical } = useVertical();

  return (
    <>
      <Head>
        <title>{vertical.seo.metaTitle}</title>
        <meta name="description" content={vertical.seo.metaDescription} />
        <meta property="og:image" content={vertical.seo.ogImage} />
      </Head>
      {/* Page content */}
    </>
  );
}
```

#### Vertical-Specific Filtering

```tsx
import { useVertical } from '../contexts/VerticalContext';

function CategoryFilter() {
  const { vertical } = useVertical();

  return (
    <select>
      <option value="">All Categories</option>
      {vertical.categories.map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
```

#### Email Templates

```tsx
import { withVerticalSSR } from '../lib/verticalServerUtils';
import { Resend } from 'resend';

export const getServerSideProps = withVerticalSSR(async (context, vertical) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: vertical.emailTemplates.welcome.from,
    to: 'user@example.com',
    subject: vertical.emailTemplates.welcome.subject,
    html: vertical.emailTemplates.welcome.body,
  });

  return { props: {} };
});
```

## Development

### Adding a New Vertical

1. **Create vertical configuration file:**
   ```bash
   cp config/verticals/cleaning.vertical.ts config/verticals/mynewvertical.vertical.ts
   ```

2. **Edit the configuration** with your vertical's data

3. **Register in registry:**
   ```typescript
   // config/verticals/registry.ts
   import { myNewVertical } from './mynewvertical.vertical';

   export const verticalRegistry: VerticalRegistry = {
     verticals: {
       cleaning: cleaningVertical,
       landscape: landscapeVertical,
       hvac: hvacVertical,
       mynewvertical: myNewVertical, // Add here
     },
     hostnameMappings: [
       // ... existing mappings
       { hostname: 'mynewvertical.com', verticalSlug: 'mynewvertical', isPrimary: true },
     ],
     defaultVertical: 'cleaning',
   };
   ```

4. **Export from index:**
   ```typescript
   // config/verticals/index.ts
   export { myNewVertical } from './mynewvertical.vertical';
   ```

### Local Development

By default, `localhost` maps to the `cleaning` vertical. To test other verticals locally:

1. **Option 1: Update registry temporarily:**
   ```typescript
   // config/verticals/registry.ts
   { hostname: 'localhost', verticalSlug: 'landscape', isPrimary: false },
   ```

2. **Option 2: Add to hosts file:**
   ```bash
   # /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
   127.0.0.1 landscapeexits.local
   127.0.0.1 hvacexits.local
   ```

   Then add to registry:
   ```typescript
   { hostname: 'landscapeexits.local', verticalSlug: 'landscape', isPrimary: false },
   ```

3. **Option 3: Use query parameter (future enhancement):**
   Add middleware support for `?vertical=landscape` query parameter

### Testing

Test vertical detection:

```bash
# Test cleaning (default)
curl http://localhost:3000 -H "Host: localhost"

# Test landscape
curl http://localhost:3000 -H "Host: landscapeexits.com"

# Test HVAC
curl http://localhost:3000 -H "Host: hvacexits.com"
```

## Troubleshooting

### "useVertical must be used within a VerticalProvider"

**Cause:** Component is not wrapped in `<VerticalProvider>`

**Solution:** Ensure `_app.tsx` has the provider:
```tsx
export default function App({ Component, pageProps }: AppProps) {
  return (
    <VerticalProvider>
      <Component {...pageProps} />
    </VerticalProvider>
  );
}
```

### Vertical is null or undefined

**Cause:**
- Domain not registered in `hostnameMappings`
- Middleware not running
- Client-side detection failing

**Solution:**
1. Check `config/verticals/registry.ts` for domain mapping
2. Verify `middleware.ts` exists in project root
3. Check browser console for errors

### Wrong vertical showing

**Cause:** Domain not properly mapped or using cached data

**Solution:**
1. Clear browser cache
2. Check hostname mapping in registry
3. Restart dev server

## Performance Considerations

- Middleware runs on every request but is extremely lightweight
- Vertical config is cached after first load
- No external API calls required
- All configuration is bundled at build time

## Security

- No sensitive data in vertical configurations (all public)
- Domain validation prevents unauthorized access
- Middleware headers are read-only
- Default fallback prevents undefined states

## Future Enhancements

Potential additions to the system:

- [ ] Query parameter override for testing (`?vertical=landscape`)
- [ ] Admin UI for managing vertical configurations
- [ ] A/B testing support per vertical
- [ ] Vertical-specific feature flags
- [ ] Analytics per vertical
- [ ] Automated vertical switching based on user preferences
- [ ] Multi-vertical user accounts
- [ ] Cross-vertical listing search

## Related Documentation

- [Vertical Configuration README](../config/README.md)
- [Next.js Middleware Docs](https://nextjs.org/docs/advanced-features/middleware)
- [React Context API](https://react.dev/reference/react/useContext)
