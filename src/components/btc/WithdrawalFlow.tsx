'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Card from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateBtcAddress } from '@/lib/btc/addressValidator';

// Minimum WBTC withdrawal amount
const MIN_WBTC_AMOUNT = 0.001;

interface WithdrawalQuote {
  withdrawalId: string;
  expectedOutput: string;
  approvalRequired: boolean;
  approvalTx?: {
    to: string;
    data: string;
  };
}

interface WithdrawalFlowProps {
  className?: string;
  wbtcBalance?: string;
  onApprove?: (tx: { to: string; data: string }) => Promise<string>;
  onWithdraw?: () => Promise<string>;
}

export function WithdrawalFlow({
  className,
  wbtcBalance,
  onApprove,
  onWithdraw,
}: WithdrawalFlowProps) {
  const [wbtcAmount, setWbtcAmount] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressTouched, setAddressTouched] = useState(false);
  const [quote, setQuote] = useState<WithdrawalQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for insufficient balance
  const insufficientBalance = wbtcBalance !== undefined &&
    parseFloat(wbtcAmount || '0') > parseFloat(wbtcBalance);

  // Validate BTC address on blur
  const handleAddressBlur = useCallback(() => {
    setAddressTouched(true);
    if (!btcAddress.trim()) {
      setAddressError(null);
      return;
    }

    const result = validateBtcAddress(btcAddress);
    if (!result.valid) {
      setAddressError('Invalid BTC address');
    } else if (result.network === 'testnet') {
      setAddressError('Testnet addresses not supported');
    } else {
      setAddressError(null);
    }
  }, [btcAddress]);

  // Clear address error when typing
  useEffect(() => {
    if (addressTouched && addressError) {
      // Don't clear immediately, wait for blur
    }
  }, [btcAddress, addressTouched, addressError]);

  const validateAmount = useCallback((amount: string): string | null => {
    if (!amount) {
      return 'Amount is required';
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Invalid amount';
    }

    if (numAmount < MIN_WBTC_AMOUNT) {
      return `Minimum withdrawal is ${MIN_WBTC_AMOUNT} WBTC`;
    }

    return null;
  }, []);

  const canSubmit = wbtcAmount &&
    btcAddress &&
    !addressError &&
    !insufficientBalance &&
    !validateAmount(wbtcAmount);

  const handleGetQuote = async () => {
    const amountError = validateAmount(wbtcAmount);
    if (amountError) {
      setError(amountError);
      return;
    }

    // Validate address
    const result = validateBtcAddress(btcAddress);
    if (!result.valid) {
      setAddressError('Invalid BTC address');
      setAddressTouched(true);
      return;
    }

    if (result.network === 'testnet') {
      setAddressError('Testnet addresses not supported');
      setAddressTouched(true);
      return;
    }

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
        throw new Error(data.error || 'Failed to get quote');
      }

      const data = await response.json();
      setQuote({
        withdrawalId: data.withdrawalId,
        expectedOutput: data.expectedOutput,
        approvalRequired: data.approvalRequired,
        approvalTx: data.approvalTx,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quote?.approvalTx || !onApprove) return;

    setIsApproving(true);
    setError(null);

    try {
      await onApprove(quote.approvalTx);
      // Update quote to reflect approval is complete
      setQuote((prev) => prev ? { ...prev, approvalRequired: false } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsApproving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;

    setIsLoading(true);
    setError(null);

    try {
      await onWithdraw();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWbtcAmount('');
    setBtcAddress('');
    setQuote(null);
    setError(null);
    setAddressError(null);
    setAddressTouched(false);
  };

  // Input step
  if (!quote) {
    return (
      <Card appearance="glass" className={cn('space-y-6', className)}>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Withdraw BTC</h2>
          <p className="text-sm text-white/60">
            Send WBTC and receive BTC
          </p>
        </div>

        <div className="space-y-4">
          {/* WBTC Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="wbtc-amount" className="text-sm text-white/80">
              WBTC Amount
            </Label>
            <Input
              id="wbtc-amount"
              type="number"
              step="0.00001"
              min="0"
              placeholder="0.00"
              value={wbtcAmount}
              onChange={(e) => {
                setWbtcAmount(e.target.value);
                setError(null);
              }}
              className="bg-white/5 border-white/10 text-white"
            />
            {wbtcBalance && (
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Available: {wbtcBalance} WBTC</span>
                <button
                  type="button"
                  onClick={() => setWbtcAmount(wbtcBalance)}
                  className="text-[#ffa02d] hover:underline"
                >
                  Max
                </button>
              </div>
            )}
            {insufficientBalance && (
              <p className="text-xs text-red-400">Insufficient balance</p>
            )}
          </div>

          {/* BTC Address Input */}
          <div className="space-y-2">
            <Label htmlFor="btc-address" className="text-sm text-white/80">
              BTC Address
            </Label>
            <Input
              id="btc-address"
              type="text"
              placeholder="bc1q..."
              value={btcAddress}
              onChange={(e) => {
                setBtcAddress(e.target.value);
                if (addressTouched) {
                  setAddressError(null);
                }
              }}
              onBlur={handleAddressBlur}
              className={cn(
                'bg-white/5 border-white/10 text-white',
                addressError && addressTouched && 'border-red-500/50'
              )}
            />
            {addressError && addressTouched && (
              <p className="text-xs text-red-400">{addressError}</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleGetQuote}
            disabled={isLoading || !canSubmit}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting Quote...
              </>
            ) : (
              'Get Quote'
            )}
          </Button>
        </div>
      </Card>
    );
  }

  // Quote display step
  return (
    <Card appearance="glass" className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Confirm Withdrawal</h2>
        <p className="text-sm text-white/60">
          Review your withdrawal details
        </p>
      </div>

      {/* Quote Display */}
      <div className="bg-white/5 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">You send</span>
          <span className="text-white font-medium">{wbtcAmount} WBTC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Expected BTC</span>
          <span className="text-[#ffa02d] font-medium">{quote.expectedOutput} BTC</span>
        </div>
        <div className="border-t border-white/10 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Destination</span>
            <span className="text-white font-mono text-xs">
              {btcAddress.slice(0, 10)}...{btcAddress.slice(-8)}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {quote.approvalRequired ? (
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve WBTC'
            )}
          </Button>
        ) : (
          <Button
            onClick={handleWithdraw}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Withdrawing...
              </>
            ) : (
              'Confirm Withdrawal'
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={handleReset}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}
