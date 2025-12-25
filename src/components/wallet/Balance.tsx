"use client";

import MaskedValue from "@/components/ui/maskedValue";
import { formatCurrency } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface BalanceProps {
  amount: number;
  visible?: boolean;
  onToggleVisibility?: () => void;
  change24h?: number;
  changePercent24h?: number;
}

export default function Balance({
  amount,
  visible = true,
  onToggleVisibility,
  change24h = 0,
  changePercent24h = 0,
}: BalanceProps) {
  const isPositive = change24h >= 0;
  const changeColor = isPositive ? "text-green-400" : "text-red-400";
  const sign = isPositive ? "+" : "";

  return (
    <div className="px-4 pt-6">
      {/* WALLET Header */}
      <h1 className="text-white text-xl font-semibold mb-4">Wallet</h1>

      {/* Card with gradient border and interior gradient */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-amber-500/40 via-amber-600/20 to-indigo-500/20">
        {/* Interior gradient background - deep navy with subtle purple tint */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950">
          {/* Subtle left-side glow effect */}
          <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-indigo-900/40 via-indigo-950/20 to-transparent pointer-events-none" />

          <div className="relative p-5">
            {/* Label */}
            <p className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-2">
              Portfolio Balance
            </p>

            {/* Hero Balance with toggle icon */}
            <div className="flex items-center gap-3">
              <MaskedValue
                value={amount || 0}
                mask="long"
                visible={visible}
                className="text-4xl sm:text-5xl font-bold text-white"
              />
              {/* Custom visibility toggle */}
              <button
                onClick={onToggleVisibility}
                className="p-2 rounded-full border border-white/20 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                {visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* 24h Change - always display */}
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-sm font-medium ${changeColor}`}>
                {sign}{formatCurrency(Math.abs(change24h))} ({sign}{changePercent24h.toFixed(2)}%)
              </span>
              <span className="text-white/40 text-sm">24h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
