// frontend/src/hooks/useMarketActions.ts
'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { parseEther } from 'viem';
import predictionMarketAbi from '@/lib/PredictionMarketABI.json';
import { type Abi } from 'viem';
import { CONTRACT_ADDRESS } from '@/lib/config';

interface UseMarketActionsOptions {
  marketId: bigint;
  onSuccess?: (action: string, txHash: string) => void;
  onError?: (action: string, error: Error) => void;
}

export const CONTRACT_ABI = predictionMarketAbi.abi as Abi;

export function useMarketActions(options: UseMarketActionsOptions) {
  const { marketId, onSuccess, onError } = options;
  const { address } = useAccount();
  
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const { writeContractAsync, data: txHash, isPending: isWriting } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isLoading = isWriting || isConfirming;

  const handleError = (action: string, err: any) => {
    console.error(`${action} error:`, err);
    const message = err?.shortMessage || err?.message || `${action} failed`;
    toast.error(message);
    setPendingAction(null);
    onError?.(action, err as Error);
  };

  const handleSuccess = (action: string, hash: string) => {
    toast.success(`${action} submitted! Waiting for confirmation...`);
    setPendingAction(action);
  };

  const handleConfirmation = (action: string, hash: string) => {
    toast.success(`${action} successful!`);
    setPendingAction(null);
    onSuccess?.(action, hash);
  };

  // Сделать ставку (Yes или No)
  const placeBet = async (outcome: boolean, amountEth: string) => {
    const action = `Bet ${outcome ? 'Yes' : 'No'}`;
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!amountEth || parseFloat(amountEth) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const value = parseEther(amountEth);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'makeBet',
        args: [marketId, outcome],
        value,
      });
      handleSuccess(action, hash);
    } catch (err) {
      handleError(action, err);
    }
  };

  // Забрать выигрыш
  const claimWinnings = async () => {
    const action = 'Claim Winnings';
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimWinnings',
        args: [marketId],
      });
      handleSuccess(action, hash);
    } catch (err) {
      handleError(action, err);
    }
  };

  // Разрешить рынок (только для оракула/админа)
  const resolveMarket = async (outcomeYes: boolean) => {
    const action = `Resolve Market (${outcomeYes ? 'Yes' : 'No'})`;
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'resolveMarket',
        args: [marketId, outcomeYes],
      });
      handleSuccess(action, hash);
    } catch (err) {
      handleError(action, err);
    }
  };

  // Обработка подтверждения транзакции
  if (isConfirmed && txHash && pendingAction) {
    handleConfirmation(pendingAction, txHash);
  }

  return {
    placeBet,
    claimWinnings,
    resolveMarket,
    isLoading,
    isWriting,
    isConfirming,
    pendingAction,
    txHash,
  };
}