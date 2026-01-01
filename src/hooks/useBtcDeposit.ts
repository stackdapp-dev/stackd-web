'use client';

import { useState, useCallback } from 'react';

export interface DepositQuote {
  depositId: string;
  depositAddress: string;
  memo?: string;
  expectedOutput: string;
  expiresAt: number;
  fees?: {
    network: string;
    protocol: string;
    total: string;
  };
}

export interface DepositStatus {
  status: 'pending' | 'detected' | 'confirming' | 'completed' | 'failed';
  confirmations?: number;
  txHash?: string;
  error?: string;
}

export function useBtcDeposit() {
  const [quote, setQuote] = useState<DepositQuote | null>(null);
  const [status, setStatus] = useState<DepositStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateDeposit = useCallback(async (btcAmount: string, evmAddress?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/btc/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ btcAmount, evmAddress }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate deposit');
      }

      const data = await response.json();
      setQuote({
        depositId: data.depositId,
        depositAddress: data.depositAddress,
        memo: data.memo,
        expectedOutput: data.expectedOutput,
        expiresAt: data.expiresAt,
        fees: data.fees,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate deposit';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (depositId: string) => {
    try {
      const response = await fetch(`/api/btc/status/${depositId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check status');
      }

      const data = await response.json();
      setStatus({
        status: data.status,
        confirmations: data.confirmations,
        txHash: data.txHash,
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
    initiateDeposit,
    checkStatus,
    reset,
    quote,
    depositStatus: status,
    isLoading,
    error,
  };
}
