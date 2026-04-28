// components/ListingCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';

interface ListingCardProps {
  listing: any;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const formatPrice = (price: number) => {
    if (!price) return 'Price on Request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatCashFlow = (cashFlow: string | number) => {
    if (!cashFlow) return null;
    const num = typeof cashFlow === 'string' 
      ? parseFloat(cashFlow.replace(/[^0-9.-]+/g, ''))
      : cashFlow;
    if (isNaN(num)) return cashFlow;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getListingUrl = () => {
    // Always route through our internal listing detail page first
    if (listing.id) {
      return `/listing/${listing.id}`;
    }
    if (listing.surrogate_key) {
      return `/listing/${listing.surrogate_key}`;
    }
    if (listing.listing_id) {
      return `/listing/${listing.listing_id}`;
    }
    // Fallback to external if no ID found (shouldn't happen)
    return listing.urlStub || `https://www.bizbuysell.com/business/listing/${listing.listNumber}`;
  };

  const getImageUrl = () => {
    if (!listing.img) return null;
    try {
      const imgArray = typeof listing.img === 'string' ? JSON.parse(listing.img) : listing.img;
      return Array.isArray(imgArray) ? imgArray[0] : listing.img;
    } catch {
      return listing.img;
    }
  };

  // DOM color: green=fresh <30d, yellow=normal <90d, orange=aging <365d, red=stale
  const domColor = (dom: number) => {
    if (dom < 30)  return 'bg-green-100 text-green-700';
    if (dom < 90)  return 'bg-yellow-100 text-yellow-700';
    if (dom < 365) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const imageUrl = getImageUrl();
  const listingUrl = getListingUrl();
  const isInternalLink = listingUrl.startsWith('/listing/');

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={listing.header || 'Business listing'}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {listing.hotProperty === true && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                🔥 HOT
              </span>
            )}
            {listing.recentlyAdded === true && (
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                ✨ NEW
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 pr-2">
            {listing.header || 'Business Opportunity'}
          </h3>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">
              {formatPrice(listing.price)}
            </div>
            {listing.listNumber && (
              <div className="text-xs text-gray-500">
                #{listing.listNumber}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {listing.location || 'Location not specified'}
        </div>

        {listing.description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-3">
            {listing.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          {listing.cashFlow && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-green-800 mb-1">Cash Flow</div>
              <div className="text-sm font-bold text-green-600">
                {formatCashFlow(listing.cashFlow)}
              </div>
            </div>
          )}
          {listing.ebitda && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-blue-800 mb-1">EBITDA</div>
              <div className="text-sm font-bold text-blue-600">
                {formatCashFlow(listing.ebitda)}
              </div>
            </div>
          )}
        </div>

        {listing.brokerContactFullName && (
          <div className="text-xs text-gray-600 mb-4 p-2 bg-gray-50 rounded">
            <span className="font-medium">Broker:</span> {listing.brokerContactFullName}
            {listing.brokerCompany && (
              <div className="text-gray-500">{listing.brokerCompany}</div>
            )}
          </div>
        )}

        {/* ── DOM + Views + Relisted + Price Reduced badges ── */}
        {(listing.days_on_market || listing.listing_views || listing.relisted || listing.price_reduced) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-gray-100">
            {listing.days_on_market && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${domColor(listing.days_on_market)}`}>
                🕐 {listing.days_on_market}d on market
              </span>
            )}
            {listing.listing_views && listing.listing_views > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                👁 {listing.listing_views.toLocaleString()} views
              </span>
            )}
            {listing.relisted && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                🔄 Relisted
              </span>
            )}
            {listing.price_reduced && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                ↓ Price Cut
              </span>
            )}
          </div>
        )}
        {/* ── END badges ── */}

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {listing.ingested_at 
              ? `Added ${new Date(listing.ingested_at).toLocaleDateString()}`
              : 'Recently added'
            }
          </div>
          
          {isInternalLink ? (
            <Link
              href={listingUrl}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              View Details →
            </Link>
          ) : (
            <a
              href={listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              View Details →
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
