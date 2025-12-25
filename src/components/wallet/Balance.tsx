"use client";

import MaskedValue from "@/components/ui/maskedValue";
import { formatCurrency } from "@/lib/utils";

interface BalanceProps {
  amount: number;
  visible?: boolean;
  onToggleVisibility?: () => void;
  change24h?: number;
  changePercent24h?: number;
}

export default function Balance({
  amount,
  visible,
  onToggleVisibility,
  change24h = 0,
  changePercent24h = 0,
}: BalanceProps) {
  const isPositive = change24h >= 0;
  const changeColor = isPositive ? "text-green-400" : "text-red-400";
  const sign = isPositive ? "+" : "";

  return (
    <div className="px-4 pt-6">
      {/* Card with gradient border */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-amber-500/50 via-amber-600/30 to-purple-600/30">
        <div className="bg-slate-900/90 rounded-2xl p-5">
          {/* Label */}
          <p className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-2">
            Total Balance
          </p>

          {/* Hero Balance */}
          <MaskedValue
            value={amount || 0}
            mask="long"
            showToggle
            visible={visible}
            onToggle={onToggleVisibility}
            className="text-4xl sm:text-5xl font-bold text-white"
            buttonClassName="ml-2 text-white/40 hover:text-white transition-colors"
          />

          {/* 24h Change */}
          {(change24h !== 0 || changePercent24h !== 0) && (
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-sm font-medium ${changeColor}`}>
                {sign}{formatCurrency(Math.abs(change24h))} ({sign}{changePercent24h.toFixed(2)}%)
              </span>
              <span className="text-white/40 text-sm">24h</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
