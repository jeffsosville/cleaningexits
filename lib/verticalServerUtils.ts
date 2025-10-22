import { GetServerSidePropsContext } from 'next';
import { getCurrentVertical } from '../config/verticals/utils';
import { VerticalConfig } from '../config/types';

/**
 * Server-side utilities for working with vertical configurations
 *
 * These utilities help inject vertical data into pages via getServerSideProps
 */

/**
 * Get the current vertical configuration from server-side context
 *
 * This function extracts the vertical configuration based on the request hostname
 * and can be used in getServerSideProps to pass vertical data to pages.
 *
 * @param context - Next.js GetServerSidePropsContext
 * @returns The vertical configuration
 *
 * @example
 * ```tsx
 * export const getServerSideProps = async (context: GetServerSidePropsContext) => {
 *   const vertical = getVerticalFromContext(context);
 *
 *   return {
 *     props: {
 *       vertical,
 *       title: `Welcome to ${vertical.info.name}`,
 *     },
 *   };
 * };
 * ```
 */
export function getVerticalFromContext(context: GetServerSidePropsContext): VerticalConfig {
  return getCurrentVertical(context.req);
}

/**
 * Get the vertical slug from request headers (set by middleware)
 *
 * @param context - Next.js GetServerSidePropsContext
 * @returns The vertical slug or null if not found
 */
export function getVerticalSlugFromHeaders(context: GetServerSidePropsContext): string | null {
  const slug = context.req.headers['x-vertical-slug'];
  return typeof slug === 'string' ? slug : null;
}

/**
 * Higher-order function to wrap getServerSideProps and automatically inject vertical
 *
 * @param handler - Your getServerSideProps function
 * @returns A new getServerSideProps function with vertical injected
 *
 * @example
 * ```tsx
 * export const getServerSideProps = withVerticalSSR(async (context, vertical) => {
 *   // Your logic here - vertical is automatically available
 *   const listings = await fetchListings(vertical.info.slug);
 *
 *   return {
 *     props: {
 *       listings,
 *       // vertical is automatically included in props
 *     },
 *   };
 * });
 * ```
 */
export function withVerticalSSR<P extends Record<string, any>>(
  handler: (
    context: GetServerSidePropsContext,
    vertical: VerticalConfig
  ) => Promise<{ props: P } | { redirect: any } | { notFound: boolean }>
) {
  return async (context: GetServerSidePropsContext) => {
    const vertical = getVerticalFromContext(context);
    const result = await handler(context, vertical);

    // If result has props, inject vertical into them
    if ('props' in result) {
      return {
        ...result,
        props: {
          ...result.props,
          vertical,
        },
      };
    }

    // Return redirect or notFound as-is
    return result;
  };
}

/**
 * Check if the current request is for a specific vertical
 *
 * @param context - Next.js GetServerSidePropsContext
 * @param slug - The vertical slug to check against
 * @returns True if the request is for the specified vertical
 *
 * @example
 * ```tsx
 * export const getServerSideProps = async (context: GetServerSidePropsContext) => {
 *   if (!isVertical(context, 'cleaning')) {
 *     return { notFound: true };
 *   }
 *
 *   // This page is only for cleaning vertical
 *   return { props: {} };
 * };
 * ```
 */
export function isVertical(context: GetServerSidePropsContext, slug: string): boolean {
  const vertical = getVerticalFromContext(context);
  return vertical.info.slug === slug;
}
