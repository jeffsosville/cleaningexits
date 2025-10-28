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
  price: number | null;
  cash_flow: number | null;
  revenue: number | null;
  listing_url: string | null;
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
    price: r.price,
    cash_flow: r.cash_flow,
    revenue: r.revenue,
    listing_url: r.listing_url,
  }));

  return { props: { listings } };
};

export default function Top10({ listings }: { listings: Listing[] }) {
  return (
    <div className="min-h-screen p-8">
      <Head>
        <title>Top 10 | CleaningExits</title>
      </Head>
      
      <h1 className="text-4xl font-bold mb-8">Top 10 Cleaning Businesses</h1>
      
      <div className="space-y-4">
        {listings.map((listing, i) => (
          <div key={listing.id} className="border p-6 rounded-lg">
            <div className="text-2xl font-bold mb-2">#{i + 1}</div>
            <h2 className="text-xl font-bold mb-2">{listing.title}</h2>
            <p className="mb-2">Price: {money(listing.price)}</p>
            <p className="mb-2">Cash Flow: {money(listing.cash_flow)}</p>
            {listing.listing_id && (
              <Link href={`/listing/${listing.listing_id}`} className="text-blue-600 hover:underline">
                View Details →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
