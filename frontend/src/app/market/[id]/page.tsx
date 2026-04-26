// frontend/src/app/market/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useEffect, useState } from 'react';
import predictionMarketAbi from '@/lib/PredictionMarketABI.json';
import { type Abi } from 'viem';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Clock, BarChart3, ImageOff } from 'lucide-react';
import Link from 'next/link';

const CONTRACT_ABI = predictionMarketAbi.abi as Abi;

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = BigInt(params.id as string);
  const { address, isConnected } = useAccount();

  // ---- Supabase: загрузка image_uri ----
  const [metaImage, setMetaImage] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    const fetchMeta = async () => {
      setMetaLoading(true);
      const { data, error } = await supabase
        .from('markets')
        .select('image_uri')
        .eq('id', Number(marketId))
        .single();
      if (!error && data) {
        setMetaImage(data.image_uri);
      }
      setMetaLoading(false);
    };
    fetchMeta();
  }, [marketId]);

  // ---- Блокчейн ----
  const { data: marketData, isLoading: isLoadingMarket, error: marketError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarket',
    args: [marketId],
  });

  const { data: userBetsData, refetch: refetchBets } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserBets',
    args: [marketId, address],
    query: { enabled: !!address },
  });

  const { writeContractAsync, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const [betAmount, setBetAmount] = useState('');
  const [betOutcome, setBetOutcome] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Типизация возвращаемых кортежей
  type MarketDataTuple = [string, string, bigint, number, bigint, bigint, bigint, boolean, boolean];
  const market = marketData
    ? {
        question: (marketData as MarketDataTuple)[0],
        description: (marketData as MarketDataTuple)[1],
        endTime: (marketData as MarketDataTuple)[2],
        outcome: (marketData as MarketDataTuple)[3],
        totalYes: (marketData as MarketDataTuple)[4],
        totalNo: (marketData as MarketDataTuple)[5],
        totalPool: (marketData as MarketDataTuple)[6],
        resolved: (marketData as MarketDataTuple)[7],
        refunded: (marketData as MarketDataTuple)[8],
      }
    : null;

  type UserBetsTuple = [bigint, bigint];
  const userBetYes = userBetsData ? (userBetsData as UserBetsTuple)[0] : 0n;
  const userBetNo = userBetsData ? (userBetsData as UserBetsTuple)[1] : 0n;

  const totalPool = market?.totalPool ?? 0n;
  const yesPrice = totalPool > 0n ? Number(market?.totalYes ?? 0n) / Number(totalPool) : 0.5;
  const noPrice = 1 - yesPrice;

  // Обработчики
  const handleBet = async () => {
    setError(null);
    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'makeBet',
        args: [marketId, betOutcome],
        value: parseEther(betAmount),
      });
      setBetAmount('');
      refetchBets();
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    }
  };

  const handleClaim = async () => {
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimWinnings',
        args: [marketId],
      });
      refetchBets();
    } catch (err: any) {
      setError(err.message || 'Claim failed');
    }
  };

  // UI: загрузка
  if (isLoadingMarket || metaLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (marketError || !market) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold">Market not found</h2>
        <Link href="/marketplace" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const outcomeMap = ['Undecided', 'Yes', 'No', 'Cancelled'];
  const outcomeStr = outcomeMap[market.outcome] || 'Undecided';

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Link href="/marketplace" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
        ← Back to markets
      </Link>

      {/* Заголовок и изображение */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{market.question}</h1>
        {market.description && (
          <p className="mt-2 text-gray-500 dark:text-gray-400">{market.description}</p>
        )}

        {/* Изображение, если загружено из Supabase */}
        {metaImage ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <img
              src={metaImage}
              alt={market.question}
              className="w-full max-h-80 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <ImageOff className="h-4 w-4" />
            No image available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная колонка */}
        <div className="lg:col-span-2 space-y-6">
          {/* Информационная карточка */}
          <div className="rounded-lg border bg-white p-6 dark:bg-gray-950 dark:border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Ends</p>
                  <CountdownTimer targetTimestamp={market.endTime} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Volume</p>
                  <p className="font-semibold">{formatEther(totalPool)} ETH</p>
                </div>
              </div>
              {market.resolved && (
                <StatusBadge outcome={outcomeStr as any} />
              )}
            </div>

            {/* Прогресс-бар вероятности */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">Yes {(yesPrice * 100).toFixed(1)}%</span>
                <span className="text-red-600 dark:text-red-400">No {(noPrice * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${yesPrice * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatEther(market.totalYes)} ETH</span>
                <span>{formatEther(market.totalNo)} ETH</span>
              </div>
            </div>
          </div>

          {/* Ставки пользователя */}
          {isConnected && (userBetYes > 0n || userBetNo > 0n) && (
            <div className="rounded-lg border bg-white p-6 dark:bg-gray-950 dark:border-gray-800">
              <h3 className="font-semibold mb-3">Your Position</h3>
              <div className="flex gap-4">
                {userBetYes > 0n && (
                  <div className="flex-1 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-sm text-green-700 dark:text-green-400">Yes</p>
                    <p className="text-lg font-bold">{formatEther(userBetYes)} ETH</p>
                  </div>
                )}
                {userBetNo > 0n && (
                  <div className="flex-1 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-400">No</p>
                    <p className="text-lg font-bold">{formatEther(userBetNo)} ETH</p>
                  </div>
                )}
              </div>
              {market.resolved && !market.refunded && (
                <div className="mt-3">
                  {(market.outcome === 1 && userBetYes > 0n) || (market.outcome === 2 && userBetNo > 0n) ? (
                    <button
                      onClick={handleClaim}
                      disabled={isTxPending || isConfirming}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isTxPending || isConfirming ? 'Processing...' : 'Claim Winnings'}
                    </button>
                  ) : (
                    <p className="text-sm text-red-500">You lost this bet</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Боковая колонка – форма ставки */}
        {!market.resolved && (
          <div className="rounded-lg border bg-white p-6 dark:bg-gray-950 dark:border-gray-800">
            <h3 className="font-semibold mb-4">Place a Bet</h3>
            {!isConnected ? (
              <p className="text-sm text-gray-500">Connect wallet to bet.</p>
            ) : (
              <div className="space-y-4">
                {/* Выбор исхода */}
                <div>
                  <label className="text-sm font-medium">Choose outcome</label>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBetOutcome(true)}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border ${
                        betOutcome === true
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      Yes {(yesPrice * 100).toFixed(1)}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setBetOutcome(false)}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border ${
                        betOutcome === false
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      No {(noPrice * 100).toFixed(1)}%
                    </button>
                  </div>
                </div>

                {/* Сумма ETH */}
                <div>
                  <label className="text-sm font-medium">Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </div>
                )}
                {txHash && !isConfirmed && (
                  <div className="text-sm text-blue-500">Transaction submitted... waiting for confirmation</div>
                )}
                {isConfirmed && (
                  <div className="text-sm text-green-600">Bet placed successfully!</div>
                )}

                <button
                  onClick={handleBet}
                  disabled={isTxPending || isConfirming || !betAmount}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isTxPending || isConfirming ? 'Confirming...' : 'Place Bet'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}