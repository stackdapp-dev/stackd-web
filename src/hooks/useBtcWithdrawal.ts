'use client';

import { useState, useCallback } from 'react';

export interface WithdrawalQuote {
  withdrawalId: string;
  expectedOutput: string;
  btcAddress: string;
  approvalRequired: boolean;
  approvalTx?: {
    to: string;
    data: string;
  };
  estimatedTime?: string;
  fees?: {
    network: string;
    protocol: string;
    total: string;
  };
}

export interface WithdrawalStatus {
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  btcTxHash?: string;
  error?: string;
}

export function useBtcWithdrawal() {
  const [quote, setQuote] = useState<WithdrawalQuote | null>(null);
  const [status, setStatus] = useState<WithdrawalStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const initiateWithdrawal = useCallback(async (wbtcAmount: string, btcAddress: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/btc/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wbtcAmount, btcAddress }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate withdrawal');
      }

      const data = await response.json();
      setQuote({
        withdrawalId: data.withdrawalId,
        expectedOutput: data.expectedOutput,
        btcAddress: data.btcAddress,
        approvalRequired: data.approvalRequired,
        approvalTx: data.approvalTx,
        estimatedTime: data.estimatedTime,
        fees: data.fees,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate withdrawal';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveWbtc = useCallback(async (onApprove: (tx: { to: string; data: string }) => Promise<string>) => {
    if (!quote?.approvalTx) {
      throw new Error('No approval transaction available');
    }

    setIsApproving(true);
    setError(null);

    try {
      const txHash = await onApprove(quote.approvalTx);
      setStatus((prev) => ({
        ...prev,
        status: 'approved',
        txHash,
      }));
      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve WBTC';
      setError(errorMessage);
      throw err;
    } finally {
      setIsApproving(false);
    }
  }, [quote]);

  const executeSwap = useCallback(async (onExecute: () => Promise<string>) => {
    setIsSwapping(true);
    setError(null);

    try {
      const txHash = await onExecute();
      setStatus((prev) => ({
        ...prev,
        status: 'processing',
        txHash,
      }));
      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute swap';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSwapping(false);
    }
  }, []);

  const checkStatus = useCallback(async (withdrawalId: string) => {
    try {
      const response = await fetch(`/api/btc/status/${withdrawalId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check status');
      }

      const data = await response.json();
      setStatus({
        status: data.status,
        txHash: data.txHash,
        btcTxHash: data.btcTxHash,
        error: data.error,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setQuote(null);
    setStatus(null);
    setError(null);
  }, []);

  return {
    initiateWithdrawal,
    approveWbtc,
    executeSwap,
    checkStatus,
    reset,
    quote,
    status,
    isLoading,
    isApproving,
    isSwapping,
    error,
  };
}
