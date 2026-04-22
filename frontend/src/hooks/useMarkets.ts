// frontend/src/hooks/useMarkets.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReadContracts } from 'wagmi';
import { formatEther } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import predictionMarketAbi from '@/lib/PredictionMarketABI.json';
import { type Abi } from 'viem';
import { CONTRACT_ADDRESS } from '@/constants/contract';
import { Market } from '@/types';
import { formatTimeRemaining } from '@/lib/utils';

interface UseMarketsOptions {
  category?: string;
  limit?: number;
  sortBy?: 'newest' | 'volume' | 'endingSoon';
  filterResolved?: boolean;
}

interface UseMarketsResult {
  markets: Market[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const CONTRACT_ABI = predictionMarketAbi.abi as Abi;

export function useMarkets(options: UseMarketsOptions = {}): UseMarketsResult {
  const { category, limit = 20, sortBy = 'newest', filterResolved = false } = options;
  const [supabaseMarkets, setSupabaseMarkets] = useState<any[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);
  const [supabaseError, setSupabaseError] = useState<Error | null>(null);

  // Загрузка метаданных из Supabase
  const fetchSupabaseMarkets = useCallback(async () => {
    setIsLoadingSupabase(true);
    try {
      let query = supabase
        .from('markets')
        .select('*')
        .order(sortBy === 'newest' ? 'created_at' : sortBy === 'volume' ? 'volume_24h' : 'end_time', { ascending: sortBy === 'endingSoon' });
      
      if (category) {
        query = query.eq('category', category);
      }
      if (filterResolved) {
        query = query.eq('resolved', false);
      }
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setSupabaseMarkets(data || []);
    } catch (err) {
      setSupabaseError(err as Error);
    } finally {
      setIsLoadingSupabase(false);
    }
  }, [category, limit, sortBy, filterResolved]);

  useEffect(() => {
    fetchSupabaseMarkets();
  }, [fetchSupabaseMarkets]);

  // Формируем массив ID для мультивызова контракта
  const marketIds = useMemo(() => supabaseMarkets.map(m => BigInt(m.id)), [supabaseMarkets]);

  // Мультивызов getMarket для получения актуальных ончейн-данных
  const contracts = marketIds.map(id => ({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI ,
    functionName: 'getMarket',
    args: [id],
  }));

  const { data: onchainData, isLoading: isLoadingOnchain, error: onchainError } = useReadContracts({
    contracts,
    query: { enabled: marketIds.length > 0 },
  });

  // Объединяем данные Supabase и блокчейна
  const markets = useMemo(() => {
    if (!supabaseMarkets.length) return [];
    
    return supabaseMarkets.map((meta, index) => {
      const onchain = onchainData?.[index]?.result;
      
      // Если ончейн-данные ещё не загружены, используем кэшированные из Supabase
      const totalYes = onchain ? (onchain as any)[4] : BigInt(meta.total_yes || 0);
      const totalNo = onchain ? (onchain as any)[5] : BigInt(meta.total_no || 0);
      const totalPool = onchain ? (onchain as any)[6] : BigInt(meta.total_pool || 0);
      const resolved = onchain ? (onchain as any)[7] : meta.resolved;
      const refunded = onchain ? (onchain as any)[8] : meta.refunded;
      
      const outcomeMap = ['Undecided', 'Yes', 'No', 'Cancelled'];
      const outcome = onchain ? outcomeMap[Number((onchain as any)[3])] : outcomeMap[meta.outcome] || 'Undecided';
      
      // Вычисляем цену Yes (вероятность)
      const yesPrice = totalPool > 0 ? Number(totalYes) / Number(totalPool) : 0.5;
      const noPrice = 1 - yesPrice;
      
      return {
        id: BigInt(meta.id),
        question: meta.question,
        description: meta.description || '',
        imageUri: meta.image_uri || '',
        endTime: BigInt(Math.floor(new Date(meta.end_time).getTime() / 1000)),
        outcome,
        totalYes,
        totalNo,
        totalPool,
        resolved,
        refunded,
        category: meta.category,
        createdAt: meta.created_at,
        volume24h: BigInt(meta.volume_24h || 0),
        lastTradePrice: meta.last_trade_price,
        yesPrice,
        noPrice,
        volumeFormatted: formatEther(totalPool, 2),
        timeRemaining: formatTimeRemaining(BigInt(Math.floor(new Date(meta.end_time).getTime() / 1000))),
      } as Market;
    });
  }, [supabaseMarkets, onchainData]);

  const isLoading = isLoadingSupabase || (isLoadingOnchain && marketIds.length > 0);
  const error = supabaseError || (onchainError as Error | null);

  return {
    markets,
    isLoading,
    error,
    refetch: fetchSupabaseMarkets,
  };
}