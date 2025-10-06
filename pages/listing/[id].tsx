// pages/listing/[id].tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { useCallback, useMemo, useState } from "react";
import { supabase as clientSupabase } from "../../lib/supabaseClient"; // browser-side
import { createClient } from "@supabase/supabase-js"; // SSR-only

type Listing = {
  id: string;
  header: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  revenue: number | null;
  cash_flow: number | null;
  notes: string | null;
  url: string | null;
  image_url: string | null;
  broker_id?: string | null;
};

function money(n?: number | null) {
  return n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
}

function decodeIdToUrl(id: string): string | null {
  try {
    return Buffer.from(decodeURIComponent(id), "base64").toString("utf8");
  } catch {
    return null;
  }
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = ctx.params?.id as string | undefined;
  if (!id) return { notFound: true };

  const listingUrl = decodeIdToUrl(id);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  let data: any = null;
  let error: any = null;

  if (listingUrl) {
    ({ data, error } = await supabase
      .from("listings")
      .select(
        "id, title, city, state, price, revenue, cash_flow, description, listing_url, image_url, broker_id"
      )
      .eq("listing_url", listingUrl)
      .maybeSingle());
  } else {
    ({ data, error } = await supabase
      .from("listings")
      .select(
        "id, title, city, state, price, revenue, cash_flow, description, listing_url, image_url, broker_id"
      )
      .eq("id", id)
      .maybeSingle());
  }

  if (error || !data) return { notFound: true };

  const listing: Listing = {
    id: String(data.id),
    header: data.title ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    price: data.price ?? null,
    revenue: data.revenue ?? null,
    cash_flow: data.cash_flow ?? null,
    notes: data.description ?? null,
    url: data.listing_url ?? null,
    image_url: data.image_url ?? null,
    broker_id: data.broker_id ?? null,
  };

  // pass through the ?from param so the back link is smart
  const from = (ctx.query?.from as string) || "";

  return { props: { listing, from } };
};

export default function ListingDetail({
  listing,
  from,
}: {
  listing: Listing;
  from?: string;
}) {
  const [gateEmail, setGateEmail] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const back = useMemo(() => {
    switch (from) {
      case "top10":
        return { href: "/top10", label: "← Back to Top 10" };
      case "daily":
        return { href: "/daily-cleaning", label: "← Back to Today’s Listings" };
      case "index":
        return { href: "/cleaning-index", label: "← Back to the Index" };
      default:
        return { href: "/", label: "← Back to Listings" };
    }
  }, [from]);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!gateEmail) return;
      setUnlocking(true);
      try {
        // Save/Upsert subscriber
        await clientSupabase
          .from("email_subscriptions")
          .upsert(
            [
              {
                email: gateEmail,
                source: "listing_gate",
                created_at: new Date().toISOString(),
              },
            ],
            { onConflict: "email" }
          );

        // Log unlock event (add a 'source' column in SQL if you want to store `from`)
        await clientSupabase.from("listing_contact_unlocks").insert([
          {
            email: gateEmail,
            listing_id: listing.id,
            occurred_at: new Date().toISOString(),
          },
        ]);

        setUnlocked(true);
      } catch (err) {
        console.error(err);
        alert("Couldn’t unlock. Please try again.");
      } finally {
        setUnlocking(false);
      }
    },
    [gateEmail, listing.id]
  );

  return (
    <>
      <Head>
        <title>{listing.header ?? "Listing"} — Cleaning Exits</title>
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Back link */}
        <div className="mb-4">
          <Link
            href={back.href}
            className="inline-flex items-center text-emerald-700 hover:text-emerald-900"
          >
            {back.label}
          </Link>
        </div>

        {/* Title + location */}
        <h1 className="text-3xl font-bold">{listing.header ?? "Listing"}</h1>
        {(listing.city || listing.state) && (
          <div className="text-gray-600 mt-1">
            {[listing.city, listing.state].filter(Boolean).join(", ")}
          </div>
        )}

        {/* Quick stats */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
          <span>Price {money(listing.price)}</span>
          {listing.cash_flow ? (
            <span>Cash flow {money(listing.cash_flow)}</span>
          ) : null}
          {listing.revenue ? <span>Revenue {money(listing.revenue)}</span> : null}
        </div>

        {/* Image */}
        {listing.image_url && (
          <img src={listing.image_url} alt="" className="mt-4 rounded-xl border" />
        )}

        {/* Description */}
        {listing.notes && (
          <p className="mt-4 text-gray-800 whitespace-pre-line">{listing.notes}</p>
        )}

        {/* Gate */}
        {!unlocked && (
          <div className="max-w-2xl mx-auto my-8 p-8 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Get Broker Contact Info</h2>
            <p className="text-gray-600 mb-6">
              Enter your email to see the broker&apos;s contact details for this listing.
              We&apos;ll also send you new cleaning businesses as they&apos;re listed.
            </p>

            <form onSubmit={handleEmailSubmit} className="flex gap-3">
              <input
                type="email"
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg"
                required
              />
              <button
                type="submit"
                disabled={unlocking}
                className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                {unlocking ? "Unlocking…" : "View Contact"}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-3">✓ No spam · Unsubscribe anytime</p>
          </div>
        )}

        {/* After submit: confirmation + contact */}
        {unlocked && (
          <>
            <div className="max-w-2xl mx-auto my-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
              ✓ Saved! We&apos;ll email you when new businesses match your criteria.
            </div>

            <section className="max-w-2xl mx-auto space-y-2 mt-6">
              {listing.url && (
                <div className="pt-1">
                  <a
                    className="underline text-emerald-700"
                    href={listing.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View original listing →
                  </a>
                </div>
              )}
              {listing.broker_id && (
                <div className="text-sm text-gray-600">
                  Broker record: <span className="font-mono">{listing.broker_id}</span>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
