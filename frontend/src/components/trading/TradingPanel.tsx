// frontend/src/components/trading/TradingPanel.tsx
'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import predictionMarketAbi from '@/lib/PredictionMarketABI.json';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface TradingPanelProps {
  marketId: bigint;
  totalYes: bigint;
  totalNo: bigint;
  totalPool: bigint;
  onSuccess?: () => void;
  onTransactionConfirmed?: (txHash: string, amount: string, outcome: boolean) => void;
}

export function TradingPanel({
  marketId,
  totalYes,
  totalNo,
  totalPool,
  onSuccess,
  onTransactionConfirmed,
}: TradingPanelProps) {
  const { isConnected } = useAccount();
  const [outcome, setOutcome] = useState<boolean>(true); // true = Yes
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync, data: txHash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Цены исходов
  const yesPrice = totalPool > 0n ? Number(totalYes) / Number(totalPool) : 0.5;
  const noPrice = 1 - yesPrice;
  const selectedPrice = outcome ? yesPrice : noPrice;

  // Ожидаемая выплата
  const potentialPayout = amount && !isNaN(Number(amount))
    ? (parseFloat(amount) / selectedPrice).toFixed(4)
    : '0';

  const handleSubmit = async () => {
    setError(null);
    if (!isConnected) {
      setError('Connect your wallet');
      return;
    }
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) {
      setError('Enter a valid amount');
      return;
    }
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: predictionMarketAbi.abi,
        functionName: 'makeBet',
        args: [marketId, outcome],
        value: parseEther(amount),
      });
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    }
  };

  // После подтверждения транзакции
  if (isConfirmed && txHash) {
    onTransactionConfirmed?.(txHash, amount, outcome);
    onSuccess?.();
  }

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-gray-950 dark:border-gray-800 space-y-4">
      <h3 className="text-lg font-semibold">Trade</h3>

      {/* Выбор исхода */}
      <div>
        <label className="text-sm font-medium">Choose outcome</label>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setOutcome(true)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border transition-colors ${
              outcome
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
          >
            Yes {(yesPrice * 100).toFixed(1)}%
          </button>
          <button
            type="button"
            onClick={() => setOutcome(false)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border transition-colors ${
              !outcome
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
          >
            No {(noPrice * 100).toFixed(1)}%
          </button>
        </div>
      </div>

      {/* Сумма ставки */}
      <div>
        <label className="text-sm font-medium">Amount (ETH)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        {amount && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Potential payout if correct: {potentialPayout} ETH
          </p>
        )}
      </div>

      {/* Статусы */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {txHash && !isConfirmed && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Transaction submitted...</span>
        </div>
      )}
      {isConfirmed && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Bet placed successfully!</span>
        </div>
      )}

      {/* Кнопка */}
      <button
        onClick={handleSubmit}
        disabled={!isConnected || isWriting || isConfirming || !amount}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {!isConnected
          ? 'Connect wallet'
          : isWriting || isConfirming
          ? 'Confirming...'
          : 'Place Bet'}
      </button>
    </div>
  );
}