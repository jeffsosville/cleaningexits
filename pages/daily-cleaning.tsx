// pages/daily-cleaning.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { supabase } from "../lib/supabaseClient";

type Raw = Record<string, any>;

type Card = {
  key: string;
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
  scraped_at: string | null;
};

const parseMoneyNum = (v: any): number | null => {
  if (v == null) return null;
  if (typeof v === "number" && !isNaN(v)) return v;
  const s = String(v);
  const digits = s.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return isNaN(n) ? null : n;
};

const first = (...vals: any[]) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
};

const normalizeRow = (r: Raw): Card => {
  const title = first(
    r.title,
    r.header,
    r["diamondMetaData.headline"],
    r.dm_headline
  );

  const city_state = first(
    r.city_state,
    r.location,
    r["diamondMetaData.location"],
    r.dm_location
  );

  const asking_price = first(
    parseMoneyNum(r.asking_price),
    parseMoneyNum(r.price),
    parseMoneyNum(r["diamondMetaData.askingPrice"])
  );

  const cash_flow = first(
    parseMoneyNum(r.cash_flow),
    parseMoneyNum(r["cashFlow"])
  );

  const ebitda = first(
    parseMoneyNum(r.ebitda),
    parseMoneyNum(r["EBITDA"]),
    parseMoneyNum(r["ebitda_num"])
  );

  const summary = first(
    r.summary,
    r.description,
    r["diamondMetaData.checkboxAdTagline"]
  );

  const url = first(
    r.url,
    r.external_url,
    r["externalUrl"],
    r["urlStub"]
  );

  const image_url = first(
    r.image_url,
    r.img,
    "/default-listing.jpg"
  );

  const broker = first(
    r.broker,
    r["brokerCompany"]
  );

  const broker_contact = first(
    r.broker_contact,
    r["brokerContactFullName"]
  );

  const scraped_at = first(
    r.scraped_at,
    r.ingested_at,   // in case your view named it this way
    r.created_at     // fallback if present
  );

  const key = String(
    first(r.id, r.listNumber, `${url}|${title}|${city_state}`) ?? Math.random()
  );

  return {
    key,
    title,
    city_state,
    asking_price,
    cash_flow,
    ebitda,
    summary,
    url,
    image_url,
    broker,
    broker_contact,
    scraped_at,
  };
};

const money = (n?: number | null) =>
  !n ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const getServerSideProps: GetServerSideProps = async () => {
  // ---- inline helpers (no imports) ----
  // Midnight today in America/New_York
  const tz = "America/New_York";
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(now); // e.g. 2025-09-25

  // Build a Date from the local midnight string, then convert to ISO
  const [yyyy, mm, dd] = todayStr.split("-");
  const midnightLocal = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0));
  // Convert to ISO; the server will compare timestamps consistently
  const midnightISO = midnightLocal.toISOString();

  // include headers with "cleaning" or "janitorial"
  const includeOr = "header.ilike.%cleaning%,header.ilike.%janitorial%";
  // exclude obvious misses (add to this as you see noise)
  const EXCLUDES = ["%dry%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%", "%convenience%", "%grocery%", "%bakery%"];

  // ---- query (schema-correct) ----
  let q = supabase
    .from("daily_listings")
    .select("header, location, price, cashFlow, ebitda, description, externalUrl, img, brokerCompany, brokerContactFullName, scraped_at")
    .or(includeOr)
    .gte("scraped_at", midnightISO);

  for (const x of EXCLUDES) q = q.not("header", "ilike", x);

  const { data, error } = await q
    .order("scraped_at", { ascending: false })
    .limit(50);

  // number parsing
  const toNum = (v: any): number | null => {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(String(v).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  // map rows to your Card shape
  const rows = (data ?? []).map((r: any) => ({
    key: String(r.externalUrl ?? r.header ?? Math.random()),
    title: r.header ?? null,
    city_state: r.location ?? null,
    asking_price: toNum(r.price),
    cash_flow: toNum(r.cashFlow),
    ebitda: toNum(r.ebitda),
    summary: r.description ?? null,
    url: r.externalUrl ?? null,
    image_url: r.img ?? "/default-listing.jpg",
    broker: r.brokerCompany ?? null,
    broker_contact: r.brokerContactFullName ?? null,
    scraped_at: r.scraped_at ?? null,
  }));

  return {
    props: {
      rows,
      hadError: !!error,
      errMsg: error?.message ?? null,
    },
  };
};


export default function DailyCleaning({
  rows,
  hadError,
  errMsg,
}: {
  rows: Card[];
  hadError: boolean;
  errMsg?: string | null;
}) {
  const today = new Date().toLocaleDateString();
  return (
    <>
      <Head><title>Cleaning Exits — Today’s Listings</title></Head>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Today’s Listings</h1>
          <p className="text-gray-600">Fresh additions from {today}. Verified filters applied.</p>
          <div className="mt-2">
            <Link href="/" className="underline text-emerald-700">← Back to Home</Link>
          </div>
          {hadError && (
            <p className="mt-3 text-sm text-red-600">
              Couldn’t load from Supabase. {errMsg ?? "Check grants/RLS and env vars."}
            </p>
          )}
        </header>

        {rows.length === 0 ? (
          <p className="text-gray-600">No new listings yet today. Check back later.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((l) => (
              <li key={l.key} className="rounded-2xl border p-4 hover:shadow-sm transition">
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
                        Added {l.scraped_at ? new Date(l.scraped_at).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    {l.summary && <p className="text-sm text-gray-600 mt-2">{l.summary}</p>}
                    <div className="text-xs text-gray-500 mt-2">Broker: {l.broker_contact || l.broker || "—"}</div>
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
