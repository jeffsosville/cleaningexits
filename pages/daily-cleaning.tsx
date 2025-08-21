// pages/daily-cleaning.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Listing = {
  listNumber: number;
  header: string | null;
  location: string | null;
  price: number | null;
  cashFlow: number | string | null;
  ebitda: number | string | null;
  description: string | null;
  brokerContactFullName: string | null;
  brokerCompany: string | null;
  externalUrl: string | null;
};

export default function DailyCleaning() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      setError('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    (async () => {
      const { data, error } = await supabase
        .from('daily_listings')
        .select(`
          listNumber,
          header,
          location,
          price,
          cashFlow,
          ebitda,
          description,
          brokerContactFullName,
          brokerCompany,
          externalUrl
        `)
        // quick heuristic to bias toward “today-ish” & bigger deals
        .order('price', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        setError(error.message);
      } else {
        console.log('✅ Supabase data:', data);
        setListings((data ?? []) as Listing[]);
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-6">🧽 Daily Verified Cleaning Listings</h1>

      {error && <p className="text-red-600">Error: {error}</p>}
      {!error && listings.length === 0 && (
        <p className="text-gray-500">No listings yet. (Check console for fetch logs.)</p>
      )}

      <ul className="space-y-6">
        {listings.map((l) => (
          <li key={l.listNumber} className="border rounded-xl p-5 shadow-sm">
            <h2 className="text-xl font-semibold">
              {l.externalUrl ? (
                <a
                  href={l.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {l.header ?? 'Untitled Listing'}
                </a>
              ) : (
                l.header ?? 'Untitled Listing'
              )}
            </h2>

            <p className="text-gray-600">{l.location ?? 'Unknown location'}</p>

            <div className="mt-2 space-y-1 text-sm">
              {l.price != null && (
                <p>💰 Asking Price: ${Number(l.price).toLocaleString()}</p>
              )}
              {l.cashFlow && !Number.isNaN(Number(l.cashFlow)) && (
                <p>💵 Cash Flow: ${Number(l.cashFlow).toLocaleString()}</p>
              )}
              {l.ebitda && !Number.isNaN(Number(l.ebitda)) && (
                <p>📈 EBITDA: ${Number(l.ebitda).toLocaleString()}</p>
              )}
            </div>

            {(l.brokerContactFullName || l.brokerCompany) && (
              <p className="mt-3 text-sm text-gray-700">
                Broker:{' '}
                <strong>
                  {l.brokerContactFullName ?? 'Unknown'}
                  {l.brokerCompany ? ` (${l.brokerCompany})` : ''}
                </strong>
              </p>
            )}

            {l.description && (
              <p className="mt-3 text-sm text-gray-700">{l.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
