// pages/subscribe.tsx
// CHANGES FROM PREVIOUS VERSION:
// 1. Added buyer profile fields: name, budget, states, category, timeline, financing
// 2. All fields sent to /api/subscribe (backward compatible — email still required, rest optional)
// 3. State multi-select picker
// 4. Personalized success screen

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

const BUDGETS = ["Under $100K","$100K – $250K","$250K – $500K","$500K – $1M","Over $1M"];

const CATEGORIES = [
  { value: "commercial_cleaning",  label: "Commercial Cleaning" },
  { value: "residential_cleaning", label: "Residential Cleaning" },
  { value: "laundromat",           label: "Laundromat" },
  { value: "landscaping",          label: "Landscaping" },
  { value: "pool_service",         label: "Pool Service" },
  { value: "pressure_washing",     label: "Pressure Washing" },
  { value: "junk_removal",         label: "Junk Removal" },
  { value: "dry_cleaner",          label: "Dry Cleaner" },
  { value: "pest_control",         label: "Pest Control" },
  { value: "any",                  label: "Any / Open" },
];

const TIMELINES = ["ASAP (0–3 months)","3–6 months","6–12 months","Just researching"];
const FINANCING = ["Cash buyer","SBA loan pre-approved","Exploring financing","Not sure yet"];
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function Subscribe() {
  const [form, setForm] = useState({
    firstName: "", email: "", budget: "", states: [] as string[],
    category: "commercial_cleaning", timeline: "", financing: "", notes: "",
  });
  const [status,  setStatus]  = useState<"idle"|"loading"|"success"|"error">("idle");
  const [message, setMessage] = useState("");

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const toggleState = (s: string) =>
    setForm((f) => ({
      ...f,
      states: f.states.includes(s) ? f.states.filter((x) => x !== s) : [...f.states, s],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:      form.email,
          first_name: form.firstName,
          budget:     form.budget,
          states:     form.states.join(", "),
          category:   form.category,
          timeline:   form.timeline,
          financing:  form.financing,
          notes:      form.notes,
          source:     "cleaningexits.com/subscribe",
        }),
      });
      const data = await res.json();
      if (res.ok) { setStatus("success"); }
      else { setStatus("error"); setMessage(data.error || "Something went wrong."); }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <>
        <Head><title>You're in — Cleaning Exits</title></Head>
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-2xl border bg-white p-10 shadow-sm">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-3">You're on the list.</h1>
            <p className="text-gray-600 text-lg mb-2">Check your email to confirm your subscription.</p>
            <p className="text-gray-500 text-sm mb-8">First digest drops next Monday — listings matched to your profile.</p>
            <Link href="/cleaning-index?category=commercial_cleaning"
              className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition">
              Browse listings now →
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Get the Weekly Top 10 — Cleaning Exits</title>
        <meta name="description" content="Free weekly digest of the top 10 cleaning businesses for sale, ranked by days on market and buyer demand." />
      </Head>
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center mb-8">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm">← Back to home</Link>
        </div>
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-3xl font-bold mb-3">Get the Weekly Top 10</h1>
            <p className="text-gray-600 text-lg">Top 10 cleaning businesses ranked by DOM + buyer demand. Every Monday. Free.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input type="text" placeholder="Jane" value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" placeholder="you@example.com" value={form.email} required
                  onChange={(e) => set("email", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">What type of business?</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium mb-2">Budget range</label>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <button key={b} type="button" onClick={() => set("budget", b)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      form.budget === b
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* States */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Target states <span className="text-gray-400 font-normal">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {US_STATES.map((s) => (
                  <button key={s} type="button" onClick={() => toggleState(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                      form.states.includes(s)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
              {form.states.length > 0 && (
                <p className="text-xs text-emerald-600 mt-1">{form.states.length} state{form.states.length > 1 ? "s" : ""} selected</p>
              )}
            </div>

            {/* Timeline + Financing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Timeline to buy</label>
                <select value={form.timeline} onChange={(e) => set("timeline", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white">
                  <option value="">Select...</option>
                  {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Financing</label>
                <select value={form.financing} onChange={(e) => set("financing", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white">
                  <option value="">Select...</option>
                  {FINANCING.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Anything specific? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="e.g. seller financing preferred, min $100K cash flow..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none" />
            </div>

            <button type="submit" disabled={status === "loading"}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50">
              {status === "loading" ? "Subscribing..." : "Send me matching listings →"}
            </button>

            {message && (
              <div className="p-4 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">{message}</div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t space-y-2 text-sm text-gray-600">
            {["Top 10 verified listings every Monday","Ranked by days on market + buyer demand","No spam, ever — unsubscribe anytime"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">Join buyers who trust Cleaning Exits for verified opportunities</p>
      </main>
    </>
  );
}
