'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Listing = {
  header: string;
  location: string;
  price: number;
  cashFlow: number | null;
  ebitda: number | null;
  description: string;
  brokerContactFullName: string;
  brokerCompany: string;
  externalUrl: string | null;
  listNumber: number;
};

export default function Listings() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

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
        .order('price', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching listings:', error);
      } else {
        setListings(data as Listing[]);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold mb-8">Today’s Cleaning Listings</h2>
      <ul className="space-y-8">
        {listings.map((listing) => (
          <li
            key={listing.listNumber}
            className="border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold">
              {listing.externalUrl ? (
                <a
                  href={listing.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {listing.header}
                </a>
              ) : (
                listing.header
              )}
            </h3>
            <p className="text-gray-600">{listing.location}</p>

            <div className="mt-2 space-y-1">
              {listing.price && (
                <p>💰 Asking Price: ${Number(listing.price).toLocaleString()}</p>
              )}
              {listing.cashFlow && !isNaN(Number(listing.cashFlow)) && (
                <p>💵 Cash Flow: ${Number(listing.cashFlow).toLocaleString()}</p>
              )}
              {listing.ebitda && !isNaN(Number(listing.ebitda)) && (
                <p>📈 EBITDA: ${Number(listing.ebitda).toLocaleString()}</p>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-700">{listing.description}</p>

            <div className="mt-4 text-sm text-gray-500">
              {listing.brokerContactFullName} — {listing.brokerCompany}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
