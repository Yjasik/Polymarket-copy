'use client';

import Link from 'next/link';
import { Market } from '@/types';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatNumber, formatCompact } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const { id, question, imageUri, yesPrice = 0.5, totalPool, resolved, endTime, outcome } = market;
  
  const yesPercent = (yesPrice * 100).toFixed(1);
  const noPercent = ((1 - yesPrice) * 100).toFixed(1);
  
  return (
    <Link href={`/market/${id}`}>
      <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-950">
        {imageUri && (
          <div className="mb-3 h-32 w-full overflow-hidden rounded-md">
            <img
              src={imageUri}
              alt={question}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">
          {question}
        </h3>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="flex items-center text-green-600 dark:text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                Yes {yesPercent}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center text-red-600 dark:text-red-400">
                <TrendingDown className="mr-1 h-3 w-3" />
                No {noPercent}%
              </span>
            </div>
          </div>
          
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${yesPercent}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Volume: {formatCompact(totalPool)} ETH</span>
            <CountdownTimer targetTimestamp={endTime} />
          </div>
        </div>
        
        {resolved && (
          <div className="absolute right-2 top-2">
            <StatusBadge outcome={outcome} />
          </div>
        )}
      </div>
    </Link>
  );
}