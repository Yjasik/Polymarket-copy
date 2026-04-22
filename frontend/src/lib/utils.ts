import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string | bigint, decimals: number = 2): string {
  const num = typeof value === 'bigint' ? Number(value) : Number(value);
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatCompact(value: number | bigint): string {
  const num = typeof value === 'bigint' ? Number(value) : value;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(num);
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatEther(wei: bigint, fractionDigits: number = 4): string {
  const ether = Number(wei) / 1e18;
  return formatNumber(ether, fractionDigits);
}

export function parseEther(ether: string): bigint {
  const [int, frac = ''] = ether.split('.');
  const wei = BigInt(int) * BigInt(1e18);
  const fracWei = BigInt(frac.padEnd(18, '0').slice(0, 18));
  return wei + fracWei;
}

export function formatDate(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getTimeRemaining(targetTimestamp: number | bigint): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = Math.floor(Date.now() / 1000);
  const target = Number(targetTimestamp);
  const diff = target - now;
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  
  return { days, hours, minutes, seconds, isExpired: false };
}

export function formatTimeRemaining(targetTimestamp: number | bigint): string {
  const { days, hours, minutes, isExpired } = getTimeRemaining(targetTimestamp);
  if (isExpired) return 'Ended';
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function calculatePercentage(part: number | bigint, total: number | bigint): number {
  const p = Number(part);
  const t = Number(total);
  if (t === 0) return 0;
  return (p / t) * 100;
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}