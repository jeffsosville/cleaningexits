import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getVerticalByHostname } from './config/verticals/utils';

/**
 * Next.js Middleware for Multi-Domain Routing
 *
 * This middleware:
 * 1. Detects the incoming domain from request headers
 * 2. Maps the domain to a vertical identifier using the vertical registry
 * 3. Injects vertical context into request headers
 * 4. Handles both production domains and localhost development
 * 5. Provides default fallback if domain is not recognized
 */
export function middleware(request: NextRequest) {
  // Extract hostname from the request
  const hostname = request.headers.get('host') || '';

  // Get the vertical configuration based on hostname
  // This automatically handles:
  // - Production domains (cleaningexits.com, landscapeexits.com, hvacexits.com)
  // - www. subdomains
  // - localhost for development
  // - Fallback to default vertical if domain not recognized
  const vertical = getVerticalByHostname(hostname);

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Inject vertical information into request headers
  // These headers will be available in getServerSideProps, API routes, and other server-side contexts
  requestHeaders.set('x-vertical-slug', vertical.info.slug);
  requestHeaders.set('x-vertical-name', vertical.info.name);
  requestHeaders.set('x-vertical-domain', vertical.info.domain);
  requestHeaders.set('x-vertical-brand-color', vertical.info.brandColor);

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add vertical information to response headers (accessible in client-side)
  response.headers.set('x-vertical-slug', vertical.info.slug);
  response.headers.set('x-vertical-name', vertical.info.name);
  response.headers.set('x-vertical-domain', vertical.info.domain);

  return response;
}

/**
 * Configure which routes the middleware should run on
 *
 * This configuration excludes:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon and other static assets
 *
 * The middleware will run on all pages and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
