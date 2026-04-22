import { MarketOutcome } from '@/types';

interface StatusBadgeProps {
  outcome: MarketOutcome;
}

export function StatusBadge({ outcome }: StatusBadgeProps) {
  const getStyles = () => {
    switch (outcome) {
      case 'Yes':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'No':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStyles()}`}>
      {outcome}
    </span>
  );
}