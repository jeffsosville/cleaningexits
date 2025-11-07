import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

type Listing = {
  id: string;                 // link target: UUID if we can resolve it, else the slug
  listing_id: string | null;  // original Top-10 slug
  title: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  cash_flow: number | null;
  revenue: number | null;
  listing_url: string | null;
};

const money = (n?: number | null) =>
  !n ? "N/A" : n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export const getServerSideProps: GetServerSideProps = async () => {
  // Server-only client with service role to avoid RLS surprises (never export this from module scope)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // 1) Load the Top-10 rows
  const { data: top10, error: t10Err } = await admin
    .from("top_10_commercial_cleaning")
    .select("*")
    .limit(10);

  if (t10Err || !top10) {
    // Don’t 404 the page; just render empty to avoid NextData 404s
    return { props: { listings: [] as Listing[] } };
  }

  // 2) Try to resolve each Top-10 slug to its merge UUID (if your view doesn’t expose merge_id)
  const slugs = top10
    .map((r: any) => r.listing_id)
    .filter(Boolean) as string[];

  let uuidBySlug: Record<string, string> = {};

  if (slugs.length) {
    const { data: mergeRows } = await admin
      .from("cleaning_listings_merge")
      .select("id, listing_id")
      .in("listing_id", slugs);

    if (mergeRows) {
      for (const r of mergeRows) {
        if (r.listing_id && r.id) uuidBySlug[r.listing_id] = r.id;
      }
    }
  }

  // 3) Build listings; prefer UUID link target when available
  const listings: Listing[] = top10.map((r: any) => {
    const linkId =
      r.merge_id || // if your view passes a merge_id column, prefer it
      uuidBySlug[r.listing_id as string] || // mapping we just fetched
      r.id || // in case the view passes through the merge id as id
      r.listing_id; // final fallback: the slug

    return {
      id: linkId as string,
      listing_id: r.listing_id ?? null,
      title: r.title ?? null,
      city: r.city ?? null,
      state: r.state ?? null,
      price: r.price ?? null,
      cash_flow: r.cash_flow ?? null,
      revenue: r.revenue ?? null,
      listing_url: r.listing_url ?? null,
    };
  });

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

            {/* Always link with the resolved id (UUID when available; slug as fallback) */}
            <Link href={`/listing/${listing.id}`} className="text-blue-600 hover:underline">
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}


