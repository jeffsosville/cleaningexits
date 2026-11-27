// components/RelatedLinks.tsx
import Link from 'next/link';
import type { ListingContext } from '@/lib/listingContext';

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

// Shared with OurListingDetail: state/city links plus nearby listings.
export default function RelatedLinks({ context }: { context: ListingContext }) {
  if (!context || (!context.state && !context.related.length)) return null;
  return (
    <section className="bg-white p-6 rounded-lg border">
      <h2 className="font-bold text-gray-900 mb-3 text-lg">
        {context.state ? `More cleaning businesses for sale in ${context.state.name}` : 'More cleaning businesses for sale'}
      </h2>
      {context.related.length > 0 && (
        <ul className="space-y-2 mb-4">
          {context.related.map((r) => (
            <li key={r.id}>
              <Link href={`/listing/${r.id}`} className="text-emerald-700 hover:underline">
                {r.title || 'Cleaning business'}
              </Link>
              <span className="text-gray-500 text-sm">
                {[r.city, r.price ? money(r.price) : null].filter(Boolean).join(' · ') ? ` — ${[r.city, r.price ? money(r.price) : null].filter(Boolean).join(' · ')}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        {context.state && <Link href={context.state.href} className="text-emerald-700 hover:underline">All {context.state.name} listings →</Link>}
        {context.city && <Link href={context.city.href} className="text-emerald-700 hover:underline">Cleaning businesses in {context.city.name} →</Link>}
        <Link href="/listings" className="text-emerald-700 hover:underline">All listings →</Link>
      </div>
    </section>
  );
}
