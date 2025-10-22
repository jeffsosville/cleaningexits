import { VerticalConfig } from '../types';
import { verticalRegistry } from './registry';

/**
 * Get vertical configuration by slug
 *
 * @param slug - The vertical slug (e.g., 'cleaning', 'landscape')
 * @returns The vertical configuration or null if not found
 */
export function getVerticalBySlug(slug: string): VerticalConfig | null {
  return verticalRegistry.verticals[slug] || null;
}

/**
 * Get vertical configuration by hostname
 *
 * @param hostname - The hostname to look up (e.g., 'cleaningexits.com')
 * @returns The vertical configuration or the default vertical if not found
 */
export function getVerticalByHostname(hostname: string): VerticalConfig {
  // Normalize hostname (remove port, convert to lowercase)
  const normalizedHostname = hostname.split(':')[0].toLowerCase();

  // Find matching hostname mapping
  const mapping = verticalRegistry.hostnameMappings.find(
    (m) => m.hostname === normalizedHostname
  );

  // Return matched vertical or default
  const slug = mapping?.verticalSlug || verticalRegistry.defaultVertical;
  return verticalRegistry.verticals[slug];
}

/**
 * Get the current vertical based on the current request hostname
 * For use in server-side contexts (getServerSideProps, API routes)
 *
 * @param req - Next.js request object (optional)
 * @returns The vertical configuration
 */
export function getCurrentVertical(req?: { headers: { host?: string } }): VerticalConfig {
  if (req?.headers.host) {
    return getVerticalByHostname(req.headers.host);
  }

  // Fallback to default vertical
  return verticalRegistry.verticals[verticalRegistry.defaultVertical];
}

/**
 * Get the current vertical based on window.location (client-side only)
 *
 * @returns The vertical configuration
 */
export function getCurrentVerticalClient(): VerticalConfig {
  if (typeof window === 'undefined') {
    throw new Error('getCurrentVerticalClient can only be used in the browser');
  }

  return getVerticalByHostname(window.location.hostname);
}

/**
 * Get all available verticals
 *
 * @returns Array of all vertical configurations
 */
export function getAllVerticals(): VerticalConfig[] {
  return Object.values(verticalRegistry.verticals);
}

/**
 * Get all vertical slugs
 *
 * @returns Array of vertical slugs
 */
export function getAllVerticalSlugs(): string[] {
  return Object.keys(verticalRegistry.verticals);
}

/**
 * Check if a slug is a valid vertical
 *
 * @param slug - The slug to check
 * @returns True if valid, false otherwise
 */
export function isValidVertical(slug: string): boolean {
  return slug in verticalRegistry.verticals;
}

/**
 * Get primary hostname for a vertical
 *
 * @param slug - The vertical slug
 * @returns The primary hostname or null if not found
 */
export function getPrimaryHostname(slug: string): string | null {
  const mapping = verticalRegistry.hostnameMappings.find(
    (m) => m.verticalSlug === slug && m.isPrimary
  );
  return mapping?.hostname || null;
}

/**
 * Get all hostnames for a vertical
 *
 * @param slug - The vertical slug
 * @returns Array of hostnames
 */
export function getAllHostnames(slug: string): string[] {
  return verticalRegistry.hostnameMappings
    .filter((m) => m.verticalSlug === slug)
    .map((m) => m.hostname);
}
