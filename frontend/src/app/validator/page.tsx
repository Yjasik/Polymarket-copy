'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import predictionMarketAbi from '@/lib/PredictionMarketABI.json';
import { type Abi } from 'viem';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { useMarkets } from '@/hooks/useMarkets';
import { AlertCircle, CheckCircle, Shield, Clock, BarChart3, Search, Filter } from 'lucide-react';
import Link from 'next/link';

const CONTRACT_ABI = predictionMarketAbi.abi as Abi;
const ORACLE_ROLE = '0x68e79a7bf1e0bc45d0a330c573bc367f9cf464fd326078812f301165fbda4ef1';

export default function ValidatorPage() {
  const { address, isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [winningOutcome, setWinningOutcome] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: isOracle, isLoading: isCheckingRole } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasRole',
    args: [ORACLE_ROLE, address],
    query: { enabled: !!address },
  });

  const { markets, isLoading: isLoadingMarkets, error: marketsError } = useMarkets({ limit: 100 });

  const resolvableMarkets = markets?.filter(
    (m) => !m.resolved && Date.now() / 1000 >= Number(m.endTime)
  );

  const filteredMarkets = resolvableMarkets?.filter((m) =>
    m.question.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const handleResolve = async () => {
    setError(null);
    if (!selectedMarketId || winningOutcome === null) {
      setError('Please select a market and outcome');
      return;
    }
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'resolveMarket',
        args: [BigInt(selectedMarketId), winningOutcome],
      });
      setSelectedMarketId('');
      setWinningOutcome(null);
    } catch (err: any) {
      setError(err.message || 'Resolution failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold">Connect your wallet</h2>
        <p className="mt-2 text-gray-500">You need to connect as an oracle to resolve markets.</p>
      </div>
    );
  }

  if (isCheckingRole || isLoadingMarkets) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isOracle) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
        <p className="mt-2 text-gray-500">You don't have oracle permissions.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Oracle Validator</h1>
        <p className="mt-2 text-gray-500">
          Resolve markets that have reached their end time.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 dark:bg-gray-950 dark:border-gray-800 mb-8">
        <h2 className="font-semibold mb-4">Resolve a Market</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Market ID</label>
            <input
              type="number"
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(e.target.value)}
              placeholder="Enter market ID"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Winning Outcome</label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setWinningOutcome(true)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border ${
                  winningOutcome === true
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setWinningOutcome(false)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border ${
                  winningOutcome === false
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          {txHash && !isConfirmed && (
            <div className="text-sm text-blue-500">Transaction submitted...</div>
          )}
          {isConfirmed && (
            <div className="text-sm text-green-600">Market resolved successfully!</div>
          )}

          <button
            onClick={handleResolve}
            disabled={isTxPending || isConfirming || !selectedMarketId || winningOutcome === null}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isTxPending || isConfirming ? 'Confirming...' : 'Resolve Market'}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pending Resolution</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search markets..."
              className="pl-9 pr-3 py-2 border rounded-md text-sm dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
        </div>

        {filteredMarkets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="mx-auto h-12 w-12" />
            <p className="mt-4">No markets awaiting resolution.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMarkets.map((market) => (
              <div
                key={market.id.toString()}
                className="rounded-lg border bg-white p-4 dark:bg-gray-950 dark:border-gray-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{market.question}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>ID: {market.id.toString()}</span>
                      <span>Volume: {formatEther(market.totalPool)} ETH</span>
                      <span>Ended: <CountdownTimer targetTimestamp={market.endTime} /></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedMarketId(market.id.toString());
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="rounded-md bg-purple-100 px-3 py-1 text-sm text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}