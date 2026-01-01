'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Card from '@/components/ui/card';
import { Copy, Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Minimum BTC deposit amount
const MIN_BTC_AMOUNT = 0.001;

interface DepositQuote {
  depositId: string;
  depositAddress: string;
  memo?: string;
  expectedOutput: string;
  expiresAt: number;
}

interface DepositFlowProps {
  className?: string;
  evmAddress?: string;
}

export function DepositFlow({ className, evmAddress }: DepositFlowProps) {
  const [btcAmount, setBtcAmount] = useState('');
  const [quote, setQuote] = useState<DepositQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Update countdown timer
  useEffect(() => {
    if (!quote?.expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((quote.expiresAt - now) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [quote?.expiresAt]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateAmount = useCallback((amount: string): string | null => {
    if (!amount) {
      return 'Amount is required';
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Invalid amount';
    }

    if (numAmount < MIN_BTC_AMOUNT) {
      return `Minimum deposit is ${MIN_BTC_AMOUNT} BTC`;
    }

    return null;
  }, []);

  const handleGetQuote = async () => {
    const validationError = validateAmount(btcAmount);
    if (validationError) {
      setError(validationError);
      return;
    }

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
        throw new Error(data.error || 'Failed to get quote');
      }

      const data = await response.json();
      setQuote({
        depositId: data.depositId,
        depositAddress: data.depositAddress,
        memo: data.memo,
        expectedOutput: data.expectedOutput,
        expiresAt: data.expiresAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAddress = async () => {
    if (!quote?.depositAddress) return;

    try {
      await navigator.clipboard.writeText(quote.depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = quote.depositAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setBtcAmount('');
    setQuote(null);
    setError(null);
    setTimeRemaining(null);
  };

  // Amount input step
  if (!quote) {
    return (
      <Card appearance="glass" className={cn('space-y-6', className)}>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Deposit BTC</h2>
          <p className="text-sm text-white/60">
            Send BTC and receive WBTC on Arbitrum
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="btc-amount" className="text-sm text-white/80">
              BTC Amount
            </Label>
            <Input
              id="btc-amount"
              type="number"
              step="0.00001"
              min="0"
              placeholder="0.00"
              value={btcAmount}
              onChange={(e) => {
                setBtcAmount(e.target.value);
                setError(null);
              }}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleGetQuote}
            disabled={isLoading || !btcAmount}
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
        <h2 className="text-xl font-semibold text-white">Deposit BTC</h2>
        <p className="text-sm text-white/60">
          Send exactly {btcAmount} BTC to the address below
        </p>
      </div>

      {/* Quote Display */}
      <div className="bg-white/5 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">You send</span>
          <span className="text-white font-medium">{btcAmount} BTC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Expected WBTC</span>
          <span className="text-[#ffa02d] font-medium">{quote.expectedOutput} WBTC</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center space-y-4">
        <div
          className="bg-white p-4 rounded-xl"
          data-testid="qr-code"
        >
          <QRCodeSVG
            value={quote.depositAddress}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Deposit Address */}
      <div className="space-y-2">
        <Label className="text-sm text-white/60">Deposit Address</Label>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white break-all font-mono"
            data-testid="deposit-address"
          >
            {quote.depositAddress}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyAddress}
            data-testid="copy-address-btn"
            className="shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Memo (if present) */}
      {quote.memo && (
        <div className="space-y-2">
          <Label className="text-sm text-white/60">Memo (Important!)</Label>
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono">
            {quote.memo}
          </div>
        </div>
      )}

      {/* Expiration Timer */}
      {timeRemaining !== null && timeRemaining > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-white/60">
          <Clock className="w-4 h-4" />
          <span>Quote expires in {formatTime(timeRemaining)}</span>
        </div>
      )}

      {/* Expired Message */}
      {timeRemaining === 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span>Quote has expired. Please get a new quote.</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={handleReset}
          className="flex-1"
        >
          Cancel
        </Button>
        {timeRemaining === 0 && (
          <Button
            onClick={handleGetQuote}
            className="flex-1"
          >
            Get New Quote
          </Button>
        )}
      </div>
    </Card>
  );
}
