// pages/listings.tsx
import React from 'react';
import Head from 'next/head';
import { ListingsGrid } from '../components/ListingsGrid';

export default function ListingsPage() {
  return (
    <>
      <Head>
        <title>Business Listings | Cleaning Exits - Profitable Opportunities Daily</title>
        <link rel="canonical" href="https://cleaningexits.com/listings" />
        <meta name="description" content="Browse commercial and residential cleaning businesses for sale, gathered from business broker websites and updated daily." />
        <meta name="keywords" content="business for sale, cleaning business, business opportunities, franchise opportunities, service business, profitable business" />
        <meta property="og:title" content="Business Listings | Cleaning Exits" />
        <meta property="og:description" content="Cleaning businesses for sale, gathered from broker websites and updated daily" />
        <meta property="og:type" content="website" />
      </Head>

      <ListingsGrid />
    </>
  );
}

