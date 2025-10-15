// pages/unsubscribe.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function Unsubscribe() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<"loading" | "confirming" | "unsubscribed" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchSubscriber = async () => {
      try {
        const res = await fetch(`/api/unsubscribe?token=${token}`);
        const data = await res.json();

        if (res.ok && data.subscriber) {
          setEmail(data.subscriber.email);
          setStatus("confirming");
        } else {
          setStatus("error");
          setMessage(data.error || "Invalid unsubscribe link.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    fetchSubscriber();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    
    setStatus("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus("unsubscribed");
        setMessage("You've been unsubscribed from all emails.");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "Failed to unsubscribe.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  };

  return (
    <>
      <Head>
        <title>Unsubscribe — Cleaning Exits</title>
      </Head>

      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          {status === "loading" && (
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          )}

          {status === "confirming" && (
            <div className="text-center">
              <div className="text-6xl mb-4">😢</div>
              <h1 className="text-2xl font-bold mb-3">Sorry to see you go!</h1>
              <p className="text-gray-600 mb-2">
                Unsubscribing: <strong>{email}</strong>
              </p>
              <p className="text-gray-500 mb-8 text-sm">
                You'll no longer receive the Weekly Top 10 emails.
              </p>
              
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  onClick={handleUnsubscribe}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Yes, Unsubscribe
                </button>
                <Link
                  href="/"
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                >
                  Never Mind, Keep Me Subscribed
                </Link>
              </div>
            </div>
          )}

          {status === "unsubscribed" && (
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h1 className="text-2xl font-bold mb-3">You're Unsubscribed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-6">
                Changed your mind? You can always resubscribe.
              </p>
              <Link
                href="/subscribe"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Subscribe Again
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold mb-3">Oops!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                href="/"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Go Home
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
