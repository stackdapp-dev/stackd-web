"use client";

import { usePnLCalculations } from "@/hooks/usePnLCalculations";
import { formatCurrency, cn } from "@/lib/utils";

/**
 * Format a large currency value with abbreviation for millions
 */
function formatLargeValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "$0";
  }

  const abs = Math.abs(value);
  if (abs >= 1000000) {
    const millions = value / 1000000;
    return `$${millions.toFixed(1)}M`;
  }

  // Don't abbreviate values under 1 million - show full formatted number
  return formatCurrency(value, 2, "$", false);
}

/**
 * Format PnL value with sign
 */
function formatPnLValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "$0.00";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatCurrency(Math.abs(value), 2, "$", false)}`;
}

/**
 * Format percentage with sign
 */
function formatPnLPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "0.00%";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

/**
 * Get color class based on value
 */
function getColorClass(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return "text-white/60";
  }
  return value > 0 ? "text-green-500" : "text-red-500";
}

export function PnLOverviewCard() {
  const {
    totalValue,
    totalPnL,
    totalPnLPercent,
    change24h,
    isLoading,
  } = usePnLCalculations();

  if (isLoading) {
    return (
      <div
        data-testid="pnl-overview-card"
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <div data-testid="pnl-loading-skeleton" className="animate-pulse space-y-4">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-10 w-40 bg-white/10 rounded" />
          <div className="flex gap-4">
            <div className="h-6 w-24 bg-white/10 rounded" />
            <div className="h-6 w-20 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="pnl-overview-card"
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
    >
      {/* Card Title */}
      <h3 className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-4">
        Total PnL
      </h3>

      {/* Total Portfolio Value */}
      <div className="mb-4">
        <p className="text-white/60 text-xs mb-1">Portfolio Value</p>
        <p
          data-testid="total-portfolio-value"
          className="text-3xl font-bold text-white"
        >
          {formatLargeValue(totalValue)}
        </p>
      </div>

      {/* Total PnL */}
      <div className="flex items-center gap-3 mb-4">
        <span
          data-testid="total-pnl"
          className={cn("text-xl font-semibold", getColorClass(totalPnL))}
        >
          {formatPnLValue(totalPnL)}
        </span>
        <span
          data-testid="total-pnl-percent"
          className={cn("text-sm", getColorClass(totalPnLPercent))}
        >
          {formatPnLPercent(totalPnLPercent)}
        </span>
      </div>

      {/* 24h Change */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-white/40 text-xs mb-2">24h Change</p>
        <div className="flex items-center gap-2">
          <span
            data-testid="change-24h-amount"
            className={cn("text-sm font-medium", getColorClass(change24h?.amount))}
          >
            {formatPnLValue(change24h?.amount)}
          </span>
          <span
            data-testid="change-24h-percent"
            className={cn("text-sm", getColorClass(change24h?.percent))}
          >
            {formatPnLPercent(change24h?.percent)}
          </span>
        </div>
      </div>
    </div>
  );
}
