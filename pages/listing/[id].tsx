// pages/listing/[id].tsx
import { useRouter } from "next/router";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await supabase.from("email_subscriptions").upsert([
      { email, source: "listing-gate", created_at: new Date().toISOString() }
    ]);
    setSubmitted(true);
  };

  if (!id) return <p>Loading…</p>;

  return (
    <main className="max-w-2xl mx-auto my-8 p-8 bg-gray-50 border-2 border-gray-200 rounded-lg">
      {!submitted ? (
        <>
          <h2 className="text-2xl font-bold mb-2">Get Broker Contact Info</h2>
          <p className="text-gray-600 mb-6">
            Enter your email to see the broker's contact details for this listing.
            We'll also send you new cleaning businesses as they're listed.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg"
              required
            />
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
            >
              View Contact
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-3">
            ✓ No spam · Unsubscribe anytime
          </p>
        </>
      ) : (
        <>
          <p className="text-emerald-700 mb-4">
            ✓ Saved! We'll email you when new businesses match your criteria.
          </p>
          {/* TODO: Query Supabase for the listing details and broker contact here */}
          <p>Here’s where broker info and listing details will show.</p>
        </>
      )}
    </main>
  );
}
