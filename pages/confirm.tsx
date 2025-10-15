// pages/confirm.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function Confirm() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    const confirm = async () => {
      try {
        const res = await fetch("/api/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Your subscription is confirmed! You'll receive the Top 10 every Monday.");
        } else {
          setStatus("error");
          setMessage(data.error || "Invalid or expired confirmation link.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    confirm();
  }, [token]);

  return (
    <>
      <Head>
        <title>Confirm Subscription — Cleaning Exits</title>
      </Head>

      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          {status === "loading" && (
            <>
              <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Confirming your subscription...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-3">You're all set!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                href="/"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Go to Homepage
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold mb-3">Oops!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                href="/subscribe"
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Try Again
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}
