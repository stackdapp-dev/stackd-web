'use client';

import { cn } from '@/lib/utils';
import Card from '@/components/ui/card';
import { ArrowDown, Clock, Info } from 'lucide-react';

interface Fee {
  network: string;
  protocol: string;
  total: string;
}

interface QuoteDisplayProps {
  inputAmount: string;
  inputToken: string;
  outputAmount: string;
  outputToken: string;
  estimatedTime?: string;
  fees?: Fee;
  className?: string;
}

export function QuoteDisplay({
  inputAmount,
  inputToken,
  outputAmount,
  outputToken,
  estimatedTime,
  fees,
  className,
}: QuoteDisplayProps) {
  return (
    <Card appearance="glass" className={cn('space-y-4', className)}>
      {/* Input Amount */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/60">You send</span>
        <span className="text-lg font-medium text-white">
          {inputAmount} {inputToken}
        </span>
      </div>

      {/* Arrow Divider */}
      <div className="flex justify-center">
        <div className="p-2 bg-white/5 rounded-full">
          <ArrowDown className="w-4 h-4 text-[#ffa02d]" />
        </div>
      </div>

      {/* Output Amount */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/60">
          {outputToken === 'WBTC' ? 'Expected WBTC' : 'Expected BTC'}
        </span>
        <span className="text-lg font-medium text-[#ffa02d]">
          {outputAmount} {outputToken}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Fees */}
      {fees && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/60">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Network fee
            </span>
            <span>{fees.network}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Protocol fee
            </span>
            <span>{fees.protocol}</span>
          </div>
          <div className="flex justify-between text-white/80 font-medium">
            <span>Total fees</span>
            <span>{fees.total}</span>
          </div>
        </div>
      )}

      {/* Estimated Time */}
      {estimatedTime && (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Clock className="w-4 h-4" />
          <span>Estimated time: {estimatedTime}</span>
        </div>
      )}
    </Card>
  );
}
