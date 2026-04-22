// import { MarketCard } from '@/components/market/MarketCard';
// frontend/src/app/page.tsx
import Link from 'next/link';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-600/10" />
        <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-purple-300/20 blur-[100px] dark:bg-purple-600/10" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-blue-200/10 blur-[120px] dark:bg-blue-800/5" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Predict the Future,{' '}
            <span className="text-blue-600 dark:text-blue-400">Earn Rewards</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 dark:text-gray-300 sm:text-lg">
            Trade on the outcome of real‑world events. Yes or No.
            <br className="hidden sm:block" /> Simple, transparent, and decentralized.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Explore Markets
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              View Dashboard
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200/80 bg-white/70 p-4 text-center backdrop-blur-sm dark:border-gray-800/80 dark:bg-gray-950/70">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Trade Any Event</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Buy Yes or No shares on sports, politics, crypto, and more.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/70 p-4 text-center backdrop-blur-sm dark:border-gray-800/80 dark:bg-gray-950/70">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Fully Decentralized</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Smart contracts on Ethereum ensure trustless resolution and payouts.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/70 p-4 text-center backdrop-blur-sm dark:border-gray-800/80 dark:bg-gray-950/70">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Real‑time Updates</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Prices and volumes update instantly as trades happen on‑chain.
              </p>
            </div>
          </div>
        </section>

        {/* Latest Markets Section */}
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Markets</h2>
            <Link
              href="/marketplace"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View all markets
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        </section>
      </div>
    </div>
  );
}

// Клиентский компонент для отображения рынков с блокчейна
// import { LatestMarketsSection } from '@/components/market/LatestMarketsSection';