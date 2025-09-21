// pages/listings.tsx
import React from 'react';
import Head from 'next/head';
import { ListingsGrid } from '../components/ListingsGrid';

export default function ListingsPage() {
  return (
    <>
      <Head>
        <title>Business Listings | Cleaning Exits - Profitable Opportunities Daily</title>
        <meta name="description" content="Browse thousands of profitable business opportunities including cleaning services, franchises, and service businesses. Updated daily with new listings from the marketplace." />
        <meta name="keywords" content="business for sale, cleaning business, business opportunities, franchise opportunities, service business, profitable business" />
        <meta property="og:title" content="Business Listings | Cleaning Exits" />
        <meta property="og:description" content="Browse thousands of profitable business opportunities updated daily" />
        <meta property="og:type" content="website" />
      </Head>
      
      <ListingsGrid />
    </>
  );
}
