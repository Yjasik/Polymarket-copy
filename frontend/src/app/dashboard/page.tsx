'use client';

import { useMemo } from 'react';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import { formatEther } from 'viem';
import { useMarkets } from '@/hooks/useMarkets';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import predictionMarketAbi from '@/lib/PredictionMarketABI.json';
import { type Abi } from 'viem';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { Market } from '@/types';
import { AlertCircle, Coins, History, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const CONTRACT_ABI = predictionMarketAbi.abi as Abi;

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { markets, isLoading: isLoadingMarkets, error: marketsError } = useMarkets({ limit: 50, filterResolved: false }); // загружаем все неразрешённые, но также добавим и разрешённые позже

  const marketIds = useMemo(() => markets?.map((m) => m.id) ?? [], [markets]);

  const { data: betsData, isLoading: isLoadingBets, error: betsError } = useReadContracts({
    contracts: marketIds.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getUserBets',
      args: [id, address],
    })),
    query: { enabled: marketIds.length > 0 && !!address },
  });

  const userBets = useMemo(() => {
    if (!markets || !betsData) return [];
    return markets
      .map((market, index) => {
        const result = betsData[index];
        if (result.error || !result.result) return null;
        const [betYes, betNo] = result.result as [bigint, bigint];
        if (betYes === 0n && betNo === 0n) return null; // нет ставок
        return {
          market,
          betYes,
          betNo,
        };
      })
      .filter(Boolean) as { market: Market; betYes: bigint; betNo: bigint }[];
  }, [markets, betsData]);

  const totalVolume = useMemo(
    () => userBets.reduce((sum, b) => sum + b.betYes + b.betNo, 0n),
    [userBets]
  );

  const handleClaim = async (marketId: bigint) => {
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimWinnings',
        args: [marketId],
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto py-12 text-center">
        <History className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold">Connect your wallet</h2>
        <p className="mt-2 text-gray-500">View your prediction history and earnings.</p>
      </div>
    );
  }

  const isLoading = isLoadingMarkets || isLoadingBets;
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (marketsError || betsError) {
    return (
      <div className="container mx-auto py-12 text-center text-red-500">
        <AlertCircle className="mx-auto h-12 w-12" />
        <p className="mt-4">Failed to load your data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-500">
          Your prediction portfolio and activity.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4 text-center">
          <Coins className="mx-auto h-5 w-5 text-blue-500" />
          <p className="mt-1 text-sm text-gray-500">Total Volume</p>
          <p className="text-xl font-bold">{formatEther(totalVolume)} ETH</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <TrendingUp className="mx-auto h-5 w-5 text-green-500" />
          <p className="mt-1 text-sm text-gray-500">Active Bets</p>
          <p className="text-xl font-bold">{userBets.filter(b => !b.market.resolved).length}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <History className="mx-auto h-5 w-5 text-purple-500" />
          <p className="mt-1 text-sm text-gray-500">Claimable</p>
          <p className="text-xl font-bold">
            {userBets.filter(b => b.market.resolved && (b.market.outcome === 'Yes' ? b.betYes > 0 : b.betNo > 0)).length}
          </p>
        </div>
      </div>

      {userBets.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <History className="mx-auto h-12 w-12" />
          <p className="mt-4">No bets yet.</p>
          <Link href="/marketplace" className="mt-2 inline-block text-blue-600 hover:underline">
            Explore markets
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 font-medium">Market</th>
                  <th className="px-4 py-3 font-medium">Your Position</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {userBets.map(({ market, betYes, betNo }) => {
                  const myOutcome = betYes > 0n ? 'Yes' : 'No';
                  const myAmount = betYes > 0n ? betYes : betNo;
                  const isResolved = market.resolved;
                  const won =
                    isResolved &&
                    ((market.outcome === 'Yes' && myOutcome === 'Yes') ||
                      (market.outcome === 'No' && myOutcome === 'No'));

                  return (
                    <tr key={market.id.toString()} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-4 py-3">
                        <Link
                          href={`/market/${market.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {market.question}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            myOutcome === 'Yes'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {myOutcome}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{formatEther(myAmount)} ETH</td>
                      <td className="px-4 py-3">
                        {isResolved ? (
                          won ? (
                            <span className="text-green-600">Won</span>
                          ) : (
                            <span className="text-red-600">Lost</span>
                          )
                        ) : (
                          <span className="text-yellow-600">Open</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isResolved && won && (
                          <button
                            onClick={() => handleClaim(market.id)}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Claim
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}