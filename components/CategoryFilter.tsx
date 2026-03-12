// components/CategoryFilter.tsx
'use client';

import React from 'react';

export type CategorySlug = 
  | 'all'
  | 'laundromat';

interface Category {
  slug: CategorySlug;
  label: string;
  emoji?: string;
}

const CATEGORIES: Category[] = [
  { slug: 'all', label: 'All', emoji: '🏢' },
  { slug: 'laundromat', label: 'Laundromats', emoji: '🧺' },
];

interface CategoryFilterProps {
  selectedCategory: CategorySlug;
  onCategoryChange: (category: CategorySlug) => void;
  categoryCounts?: Record<CategorySlug, number>;
  loading?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  loading = false,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-2 min-w-max">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.slug;
          const count = categoryCounts?.[category.slug];
          
          return (
            <button
              key={category.slug}
              onClick={() => onCategoryChange(category.slug)}
              disabled={loading}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${isSelected
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {category.emoji && <span>{category.emoji}</span>}
              <span>{category.label}</span>
              {count !== undefined && (
                <span className={`
                  ml-1 px-1.5 py-0.5 rounded-full text-xs
                  ${isSelected 
                    ? 'bg-emerald-500 text-emerald-100' 
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { CATEGORIES };
