import { createElement as h } from 'react';
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Listing = {
  id: string;
  listing_id: string | null;
  title: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  price: number | null;
  cash_flow: number | null;
  revenue: number | null;
  description: string | null;
  listing_url: string | null;
  broker_account: string | null;
};

type Props = {
  listings: Listing[];
};

const money = (n?: number | null) =>
  !n ? "N/A" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const getServerSideProps: GetServerSideProps = async () => {
  const { data } = await supabase.from("top_10_commercial_cleaning").select("*").limit(10);
  
  const listings = (data ?? []).map((r: any) => ({
    id: r.listing_id,
    listing_id: r.listing_id,
    title: r.title,
    city: r.city,
    state: r.state,
    location: r.location,
    price: r.price,
    cash_flow: r.cash_flow,
    revenue: r.revenue,
    description: r.description,
    listing_url: r.listing_url,
    broker_account: r.broker_account,
  }));

  return { props: { listings } };
};

export default function Top10({ listings }: Props) {
  return h('div', { className: 'min-h-screen' },
    listings.map((listing, i) => 
      h('div', { key: listing.id, className: 'p-4 border mb-4' },
        h('h2', { className: 'text-xl font-bold' }, listing.title),
        h('p', null, `Price: ${money(listing.price)}`),
        listing.listing_id && h(Link, { href: `/listing/${listing.listing_id}` }, 'View Details')
      )
    )
  );
}
