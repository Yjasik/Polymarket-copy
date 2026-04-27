'use client';

import { Market } from '@/types';
import { MarketCard } from './MarketCard';

interface MarketGridProps {
  markets: Market[];
}

export function MarketGrid({ markets }: MarketGridProps) {
  if (!markets.length) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No markets to display.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {markets.map((market) => (
        <MarketCard key={market.id.toString()} market={market} />
      ))}
    </div>
  );
}