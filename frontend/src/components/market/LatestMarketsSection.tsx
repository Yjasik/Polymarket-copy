'use client';

import { useMarkets } from '@/hooks/useMarkets';
import { MarketGrid } from './MarketGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function LatestMarketsSection() {
  const { markets, isLoading, error } = useMarkets({
    limit: 3,
    sortBy: 'newest',
    filterResolved: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        Failed to load markets. Please try again later.
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No markets available yet. Check back soon!
      </div>
    );
  }

  return <MarketGrid markets={markets} />;
}