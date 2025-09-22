// components/ListingCard.tsx
'use client';

import React from 'react';
import { Listing } from '../types/listings';

interface ListingCardProps {
  listing: Listing;
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

  const formatCashFlow = (cashFlow: string) => {
    if (!cashFlow) return null;
    const num = parseFloat(cashFlow.replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return cashFlow;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getBizBuySellUrl = () => {
    return `https://www.bizbuysell.com/business/${listing.urlStub}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {listing.img && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={listing.img}
            alt={listing.header || 'Business listing'}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {listing.hotProperty === 'true' && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                🔥 HOT
              </span>
            )}
            {listing.recentlyAdded === 'true' && (
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

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Added {new Date(listing.ingested_at).toLocaleDateString()}
          </div>
          <a
            href={getBizBuySellUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            View Details →
          </a>
        </div>
      </div>
    </div>
  );
};
