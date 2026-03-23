// components/CategoryFilter.tsx
'use client';
import React from 'react';

export type CategorySlug =
  | 'all'
  | 'commercial_cleaning'
  | 'residential_cleaning'
  | 'laundromat'
  | 'landscaping'
  | 'pool_service'
  | 'pressure_washing'
  | 'junk_removal'
  | 'dry_cleaner'
  | 'pest_control';

interface Category {
  slug: CategorySlug;
  label: string;
  emoji?: string;
}

const CATEGORIES: Category[] = [
  { slug: 'all',                  label: 'All',                  emoji: '🏢' },
  { slug: 'commercial_cleaning',  label: 'Commercial Cleaning',  emoji: '🧹' },
  { slug: 'residential_cleaning', label: 'Residential Cleaning', emoji: '🏠' },
  { slug: 'laundromat',           label: 'Laundromats',          emoji: '🧺' },
  { slug: 'landscaping',          label: 'Landscaping',          emoji: '🌿' },
  { slug: 'pool_service',         label: 'Pool Service',         emoji: '🏊' },
  { slug: 'pressure_washing',     label: 'Pressure Washing',     emoji: '💧' },
  { slug: 'junk_removal',         label: 'Junk Removal',         emoji: '🚛' },
  { slug: 'dry_cleaner',          label: 'Dry Cleaners',         emoji: '👔' },
  { slug: 'pest_control',         label: 'Pest Control',         emoji: '🐛' },
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
                  ${isSelected ? 'bg-emerald-500 text-emerald-100' : 'bg-gray-100 text-gray-500'}
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
