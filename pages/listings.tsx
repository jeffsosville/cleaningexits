// pages/listings.tsx
// Server-renders the first page of listings. This page used to ship an empty
// shell that fetched /api/listings in the browser, so AI crawlers (which don't
// run JavaScript) saw a loading skeleton and "Discover 0 ... listings".
import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { ListingsGrid } from '../components/ListingsGrid';
import { queryListings } from '@/lib/listingsQuery';

// Same params ListingsGrid sends on its first client fetch, so the server page
// and the client page agree on order.
const FIRST_PAGE = new URLSearchParams({
  page: '1',
  limit: '20',
  sortBy: 'ingested_at',
  sortOrder: 'desc',
});

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
  try {
    const data = await queryListings(FIRST_PAGE);
    return { props: { initial: { listings: data.listings, pagination: data.pagination } } };
  } catch (e) {
    console.error('listings SSR error:', e);
    // Fall back to the client fetch rather than failing the page.
    return { props: { initial: null } };
  }
};

export default function ListingsPage({ initial }: { initial: any }) {
  return (
    <>
      <Head>
        <title>Cleaning Businesses for Sale | Cleaning Exits</title>
        <link rel="canonical" href="https://cleaningexits.com/listings" />
        <meta name="description" content="Browse commercial and residential cleaning businesses for sale, gathered from business broker websites and updated daily." />
        <meta property="og:title" content="Cleaning Businesses for Sale | Cleaning Exits" />
        <meta property="og:description" content="Cleaning businesses for sale, gathered from broker websites and updated daily" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://cleaningexits.com/og-default.png" />
      </Head>

      <ListingsGrid initial={initial} />
    </>
  );
}
