// pages/listing/[id].tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Listing = {
  id?: string | number | null;
  header: string | null;
  location: string | null;
  price: string | number | null;
  cashFlow: string | number | null;
  ebitda: string | number | null;
  description: string | null;
  externalUrl: string | null;
  img: string | null;
  brokerCompany?: string | null;
  brokerContactFullName?: string | null;
  brokerPhone?: string | null;
  brokerEmail?: string | null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = ctx.params?.id as string;
  if (!id) return { notFound: true };

  // decode base64 → externalUrl
  let externalUrl = "";
  try {
    externalUrl = Buffer.from(decodeURIComponent(id), "base64").toString("utf8");
  } catch {
    return { notFound: true };
  }

  // fetch listing by externalUrl
  const { data, error } = await supabase
    .from("daily_listings")
    .select(
      "id, header, location, price, cashFlow, ebitda, description, externalUrl, img, brokerCompany, brokerContactFullName, brokerPhone, brokerEmail"
    )
    .eq("externalUrl", externalUrl)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  if (!data) {
    return {
      redirect: { destination: externalUrl || "/", permanent: false },
    };
  }

  return {
    props: { listing: data },
  };
};

export default function ListingDetail({ listing }: { listing: Listing }) {
  const [gateEmail, setGateEmail] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!gateEmail) return;
      setUnlocking(true);
      try {
        // Save/Upsert subscriber
        await supabase.from("email_subscriptions").upsert(
          [
            {
              email: gateEmail,
              source: "listing_gate",
              created_at: new Date().toISOString(),
            },
          ],
          { onConflict: "email" }
        );

        // Log unlock event
        await supabase.from("listing_contact_unlocks").insert([
          {
            email: gateEmail,
            listing_id: (listing.id ?? listing.externalUrl ?? "unknown").toString(),
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
    [gateEmail, listing]
  );

  const money = (v: any) =>
    v == null
      ? "—"
      : Number(v.toString().replace(/[^0-9.-]/g, "")).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        });

  return (
    <>
      <Head>
        <title>{listing.header ?? "Listing"} — Cleaning Exits</title>
      </Head>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold">{listing.header ?? "Listing"}</h1>
        {listing.location && (
          <div className="text-gray-600 mt-1">{listing.location}</div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
          <span>Price {money(listing.price)}</span>
          {listing.cashFlow && <span>Cash flow {money(listing.cashFlow)}</span>}
          {!listing.cashFlow && listing.ebitda && (
            <span>EBITDA {money(listing.ebitda)}</span>
          )}
        </div>

        {listing.img && (
          <img src={listing.img} alt="" className="mt-4 rounded-xl border" />
        )}

        {listing.description && (
          <p className="mt-4 text-gray-800 whitespace-pre-line">
            {listing.description}
          </p>
        )}

        {/* GATE */}
        {!unlocked && (
          <div className="max-w-2xl mx-auto my-8 p-8 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Get Broker Contact Info</h2>
            <p className="text-gray-600 mb-6">
              Enter your email to see the broker&apos;s contact details for this
              listing. We&apos;ll also send you new cleaning businesses as
              they&apos;re listed.
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

            <p className="text-sm text-gray-500 mt-3">
              ✓ No spam · Unsubscribe anytime
            </p>
          </div>
        )}

        {/* Confirmation + Broker */}
        {unlocked && (
          <>
            <div className="max-w-2xl mx-auto my-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
              ✓ Saved! We&apos;ll email you when new businesses match your
              criteria.
            </div>

            <section className="max-w-2xl mx-auto space-y-2 mt-6">
              <div className="text-sm text-gray-500">Broker</div>
              <div className="text-lg font-semibold">
                {listing.brokerCompany ?? "—"}
              </div>
              {listing.brokerContactFullName && (
                <div className="text-gray-700">
                  {listing.brokerContactFullName}
                </div>
              )}
              {listing.brokerPhone && <div>{listing.brokerPhone}</div>}
              {listing.brokerEmail && (
                <a
                  className="text-emerald-700 underline"
                  href={`mailto:${listing.brokerEmail}`}
                >
                  {listing.brokerEmail}
                </a>
              )}
              {listing.externalUrl && (
                <div className="pt-2">
                  <a
                    className="underline text-gray-600"
                    href={listing.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View original listing →
                  </a>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
