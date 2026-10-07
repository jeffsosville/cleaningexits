import { useEffect, useState } from 'react';
import Link from 'next/link';

type Featured = {
  id: string; title: string; category: string | null; price: number | null; cash_flow: number | null;
  location: string | null; status: string; listedOn: string; ctaHref: string;
};

const money = (n: number | null) => (n == null ? '—' : `$${n.toLocaleString('en-US')}`);

// Pinned at the top of the homepage: listings CleaningExits brokers itself.
export default function FeaturedListings() {
  const [items, setItems] = useState<Featured[]>([]);
  useEffect(() => {
    fetch('/api/featured').then((r) => r.json()).then((d) => setItems(d.listings || [])).catch(() => {});
  }, []);
  if (!items.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-bold text-gray-900">Exclusive CleaningExits listings</h2>
        <span className="text-sm text-gray-500">Brokered by us · NDA for the full CIM</span>
      </div>
      <div className="space-y-3">
        {items.map((l) => (
          <div key={l.id} className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">New · Exclusive</span>
                {l.status === 'under_loi' && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Under LOI</span>}
                {l.category && <span className="text-xs text-gray-500">{l.category}</span>}
              </div>
              <Link href={`/listing/${l.id}`} className="text-lg font-bold text-gray-900 hover:underline">{l.title}</Link>
              <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4">
                <span>Asking <span className="font-semibold text-gray-900">{money(l.price)}</span></span>
                {l.cash_flow != null && <span>Cash flow (SDE) <span className="font-semibold text-gray-900">{money(l.cash_flow)}</span></span>}
                {l.location && <span>{l.location}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/listing/${l.id}`} className="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 font-semibold hover:bg-white text-sm whitespace-nowrap">View listing</Link>
              <a href={l.ctaHref} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-sm whitespace-nowrap">Sign NDA</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
