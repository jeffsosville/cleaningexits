// pages/daily-cleaning.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { supabase } from "../lib/supabaseClient";

type Row = {
  id: string | null;
  title: string | null;
  city_state: string | null;
  asking_price: number | null;
  cash_flow: number | null;
  ebitda: number | null;
  summary: string | null;
  url: string | null;
  image_url: string | null;
  broker: string | null;
  broker_contact: string | null;
  scraped_at: string | null; // ISO
};

type Props = {
  rows: Row[];
  hadError: boolean;
  errMsg?: string | null;
};

const money = (n?: number | null) =>
  !n
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

// ---------- Time helpers (America/New_York) ----------
function toET(d: Date) {
  // Convert a Date to America/New_York "local" Date
  return new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
}

function isSameETDay(a: Date, b: Date) {
  const A = toET(a);
  const B = toET(b);
  return (
    A.getFullYear() === B.getFullYear() &&
    A.getMonth() === B.getMonth() &&
    A.getDate() === B.getDate()
  );
}

function isTodayET(iso: string) {
  if (!iso) return false;
  const now = new Date();
  const d = new Date(iso);
  return isSameETDay(now, d);
}

// ---------- Text filters (strict) ----------
const ALLOW = new RegExp(
  [
    "\\bclean(?:ing|ers?)\\b",
    "\\bjanitorial\\b",
    "\\bmaid(?:\\s*service)?\\b",
    "\\bhousekeep(?:ing)?\\b",
    "\\bcustodial\\b",
    "\\bwindow\\s*clean(?:ing|ers?)\\b",
    "\\bcarpet\\s*clean(?:ing|ers?)\\b",
    "\\btile\\s*(?:and\\s*grout\\s*)?clean(?:ing)?\\b",
    "\\bgrout\\s*clean(?:ing)?\\b",
    "\\bgutter\\s*clean(?:ing)?\\b",
    "pressure\\s*wash(?:ing)?",
    "power\\s*wash(?:ing)?",
    "\\bsoft\\s*wash(?:ing)?\\b",
  ].join("|"),
  "i"
);

const BLOCK = new RegExp(
  [
    "advertis",
    "marketing",
    "promo(?:tional)?",
    "branding",
    "printing",
    "printer",
    "screen\\s*print",
    "embroid",
    "apparel",
    "\\bsign(?:age)?\\b",
    "\\bseo\\b",
    "web\\s*design",
    "graphic\\s*design",
    // trades (exclude unless explicitly cleaning)
    "\\bconstruction\\b",
    "\\bcontractor\\b",
    "\\bremodel",
    "\\brestoration\\b",
    "\\broof(?:ing)?\\b",
    "\\bplumb(?:ing|er)\\b",
    "\\bhvac\\b",
    "\\belectrical\\b",
    "\\bstained\\s*glass\\b",
    "\\bglass\\b(?!\\s*clean)",
    // other non-cleaning services
    "\\bsecurity\\b",
    "\\bcatering\\b",
    "\\blandscap",
    "\\blawn\\b",
    "\\bpest\\b",
    "\\bpainting\\b",
  ].join("|"),
  "i"
);

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  // Pull a generous window (48h) to avoid timezone/cron drift
  const cutoffISO = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("daily_cleaning_raw")
    .select(
      "id,title,city_state,asking_price,cash_flow,ebitda,summary,url,image_url,broker,broker_contact,scraped_at"
    )
    .gte("scraped_at", cutoffISO)
    .order("scraped_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return {
      props: {
        rows: [],
        hadError: true,
        errMsg: error?.message ?? "Failed to query daily_cleaning_raw",
      },
    };
  }

  // De-dupe by url then id
  const seen = new Set<string>();
  const dedupeKey = (r: Row) =>
    r.url ? `u:${r.url}` : r.id ? `i:${r.id}` : `r:${Math.random()}`;

  const filtered = data
    // keep "today" in America/New_York
    .filter((r) => r.scraped_at && isTodayET(r.scraped_at))
    // content filters
    .filter((r) => {
      const text = `${r.title ?? ""}\n${r.summary ?? ""}`;
      if (!ALLOW.test(text)) return false;
      if (BLOCK.test(text)) return false;
      return true;
    })
    // de-dupe
    .filter((r) => {
      const k = dedupeKey(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  return {
    props: {
      rows: filtered,
      hadError: false,
      errMsg: null,
    },
  };
};

export default function DailyCleaning({ rows, hadError, errMsg }: Props) {
  const todayET = toET(new Date()).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
  });

  return (
    <>
      <Head>
        <title>Cleaning Exits — Today’s Listings</title>
        <meta
          name="description"
          content="Fresh, verified cleaning business listings added today. No franchises, no lead-gen noise."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Today’s Listings
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">
              {rows.length}
            </span>
          </h1>
          <p className="text-gray-600">
            Fresh additions for <strong>{todayET}</strong>. Strict cleaning-only filters applied.
          </p>
          <div className="mt-2">
            <Link href="/" className="underline text-emerald-700">
              ← Back to Home
            </Link>
          </div>
          {hadError && (
            <p className="mt-3 text-sm text-red-600">
              Couldn’t load from Supabase. {errMsg ?? "Check anon key, RLS policy, and env vars."}
            </p>
          )}
        </header>

        {/* Body */}
        {rows.length === 0 ? (
          <p className="text-gray-600">
            No new cleaning listings yet today. Try again later — or check the{" "}
            <Link href="/cleaning-index" className="underline text-emerald-700">
              Cleaning Index
            </Link>{" "}
            for recent deals.
          </p>
        ) : (
          <ul className="space-y-4">
            {rows.map((l) => (
              <li key={l.url ?? l.id ?? Math.random()} className="rounded-2xl border p-4 hover:shadow-sm transition">
                <div className="flex gap-4">
                  <img
                    src={l.image_url ?? "/default-listing.jpg"}
                    alt={l.title ?? ""}
                    className="w-24 h-24 rounded-lg object-cover bg-gray-100"
                  />
                  <div className="flex-1">
                    <a
                      href={l.url ?? "#"}
                      target={l.url ? "_blank" : "_self"}
                      rel="noreferrer"
                      className="font-semibold text-lg hover:underline"
                    >
                      {l.title ?? "Untitled listing"}
                    </a>
                    <div className="text-sm text-gray-500">{l.city_state ?? "—"}</div>
                    <div className="text-sm mt-1 text-gray-700 flex flex-wrap gap-3">
                      <span>Price {money(l.asking_price)}</span>
                      {l.cash_flow ? <span>Cash Flow {money(l.cash_flow)}</span> : null}
                      {l.ebitda ? <span>EBITDA {money(l.ebitda)}</span> : null}
                      <span className="text-gray-500">
                        Added{" "}
                        {l.scraped_at
                          ? toET(new Date(l.scraped_at)).toLocaleTimeString("en-US", {
                              timeZone: "America/New_York",
                            })
                          : ""}
                      </span>
                    </div>
                    {l.summary && <p className="text-sm text-gray-600 mt-2">{l.summary}</p>}
                    <div className="text-xs text-gray-500 mt-2">
                      Broker: {l.broker_contact || l.broker || "—"}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
