'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import predictionMarketAbi from '@/lib/PredictionMarketABI.json';
import { type Abi, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACT_ADDRESS } from '@/lib/config';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, CheckCircle, Plus, Shield, Users } from 'lucide-react';
import Link from 'next/link';

const ADMIN_ROLE = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775';
const CONTRACT_ABI = predictionMarketAbi.abi as Abi;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
});

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    imageUri: '',
    endTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: isAdmin, isLoading: isCheckingRole } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasRole',
    args: [ADMIN_ROLE, address],
    query: { enabled: !!address },
  });

  const { data: marketsCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarketsCount',
  });

  const { writeContractAsync } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setTxHash(null);

  if (!formData.question || !formData.endTime) {
    setError('Question and end time are required');
    return;
  }

  const endTimestamp = Math.floor(new Date(formData.endTime).getTime() / 1000);
  if (endTimestamp <= Date.now() / 1000 + 3600) {
    setError('End time must be at least 1 hour in the future');
    return;
  }

  setIsSubmitting(true);
  try {
    let currentId: bigint;
    try {
      currentId = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'marketId',
      }) as bigint;
    } catch (err) {
      console.warn('Using fallback ID, contract read failed:', err);
      currentId = BigInt(Date.now());
    }

    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createMarket',
      args: [
        formData.question,
        formData.description || '',
        formData.imageUri || '',
        BigInt(endTimestamp),
      ],
    });
    setTxHash(hash);

    const { error: insertError } = await supabase.from('markets').insert({
      id: Number(currentId),
      question: formData.question,
      description: formData.description,
      image_uri: formData.imageUri,
      end_time: new Date(endTimestamp * 1000).toISOString(),
      category: 'Other',
      outcome: 0,
      total_yes: 0,
      total_no: 0,
      total_pool: 0,
      resolved: false,
      refunded: false,
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      setError(`Contract created, but failed to save metadata: ${insertError.message}`);
    } else {

      setFormData({ question: '', description: '', imageUri: '', endTime: '' });
    }
  } catch (err: any) {
    setError(err.message || 'Transaction failed');
  } finally {
    setIsSubmitting(false);
  }
};
 
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          Connect your wallet
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Please connect your wallet to access the admin panel.
        </p>
      </div>
    );
  }

  if (isCheckingRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          Access Denied
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don't have permission to view this page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage markets, view statistics, and control platform settings.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Markets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {marketsCount?.toString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900 dark:text-white">
              <Plus className="mr-2 h-5 w-5 text-blue-600" />
              Create New Market
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Question *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Will ETH reach $10,000 by end of 2026?"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about the market..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Image URI (optional)
                </label>
                <input
                  type="text"
                  value={formData.imageUri}
                  onChange={(e) => setFormData({ ...formData, imageUri: e.target.value })}
                  placeholder="https://... or ipfs://..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white [color-scheme:dark]"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Market will be active until this date/time (minimum 1 hour from now).
                </p>
              </div>

              {error && (
                <div className="flex items-center rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {error}
                </div>
              )}

              {txHash && (
                <div className="flex items-center rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Market created successfully! Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Market'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Admin Actions
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="mr-2 mt-1 block h-1.5 w-1.5 rounded-full bg-blue-600" />
                Create new prediction markets
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 block h-1.5 w-1.5 rounded-full bg-blue-600" />
                Manage oracle assignments
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 block h-1.5 w-1.5 rounded-full bg-blue-600" />
                View platform statistics
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Contract Info
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Address:</span>
                <p className="font-mono text-gray-700 dark:text-gray-300">
                  {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Your Role:</span>
                <p className="font-medium text-green-600 dark:text-green-400">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}