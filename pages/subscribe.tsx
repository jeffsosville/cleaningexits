// pages/subscribe.tsx
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Thanks! Check your email to confirm your subscription.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <title>Subscribe — Cleaning Exits</title>
      </Head>

      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center mb-8">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm">
            ← Back to home
          </Link>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-3xl font-bold mb-3">Get the Weekly Top 10</h1>
            <p className="text-gray-600 text-lg">
              Every Monday, receive the top 10 cleaning business listings directly in your inbox.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                disabled={status === "loading"}
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Curated Top 10 every Monday morning</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No spam, ever — unsubscribe anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified listings only — no franchise funnels</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Join buyers who trust Cleaning Exits for verified opportunities
        </p>
      </main>
    </>
  );
}
