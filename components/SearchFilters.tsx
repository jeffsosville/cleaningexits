// components/SearchFilters.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface SearchFiltersProps {
  filters: {
    search: string;
    minPrice: string;
    maxPrice: string;
    location: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: any) => void;
  loading: boolean;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  loading
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Debounce search and location inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localFilters.search !== filters.search || localFilters.location !== filters.location) {
        onFilterChange(localFilters);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [localFilters.search, localFilters.location]);

  // Update local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'search' || field === 'location') {
      // For search and location, update local state (debounced)
      setLocalFilters({ ...localFilters, [field]: value });
    } else {
      // For other fields, update immediately
      const newFilters = { ...filters, [field]: value };
      setLocalFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sortBy: 'ingested_at',
      sortOrder: 'desc'
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Business
          </label>
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Business name, description..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={localFilters.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="City, State..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Price
          </label>
          <input
            type="number"
            value={localFilters.minPrice}
            onChange={(e) => handleInputChange('minPrice', e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Price
          </label>
          <input
            type="number"
            value={localFilters.maxPrice}
            onChange={(e) => handleInputChange('maxPrice', e.target.value)}
            placeholder="1,000,000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              const newFilters = { ...localFilters, sortBy, sortOrder };
              setLocalFilters(newFilters);
              onFilterChange(newFilters);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="ingested_at-desc">Newest First</option>
            <option value="ingested_at-asc">Oldest First</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="header-asc">Name: A to Z</option>
            <option value="header-desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={clearFilters}
          className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors"
          disabled={loading}
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};
