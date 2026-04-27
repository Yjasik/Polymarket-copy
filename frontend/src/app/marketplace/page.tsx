'use client';

import { useState } from 'react';
import { MarketGrid } from '@/components/market/MarketGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMarkets } from '@/hooks/useMarkets';
import { Filter, Search } from 'lucide-react';

const categories = ['All', 'Sports', 'Politics', 'Crypto', 'World'];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'volume' | 'endingSoon'>('newest');

  const { markets, isLoading, error } = useMarkets({
    category: activeCategory === 'All' ? undefined : activeCategory,
    sortBy,
  });

  const filteredMarkets = markets?.filter((market) =>
    market.question.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketplace</h1>

        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <button className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-end">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="newest">Newest</option>
          <option value="volume">Highest Volume</option>
          <option value="endingSoon">Ending Soon</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Failed to load markets. Please try again later.
        </div>
      ) : filteredMarkets.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          No markets found. {searchTerm && 'Try a different search term.'}
        </div>
      ) : (
        <MarketGrid markets={filteredMarkets} />
      )}
    </div>
  );
}