"use client";

import { useMemo } from "react";
import { usePnLCalculations } from "@/hooks/usePnLCalculations";
import TokenIcon from "@/components/common/TokenIcon";
import { formatCurrency, cn } from "@/lib/utils";

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

interface AssetRowProps {
  symbol: string;
  name?: string;
  amount: number;
  percent: number;
  usdValue: number;
  performance?: "best" | "worst" | null;
}

function AssetRow({ symbol, amount, percent, usdValue, performance }: AssetRowProps) {
  return (
    <div
      data-testid={`asset-row-${symbol}`}
      data-symbol={symbol}
      data-performance={performance || undefined}
      className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div data-testid="asset-icon">
          <TokenIcon symbol={symbol} width={32} height={32} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{symbol}</span>
            {performance === "best" && (
              <span
                data-testid="best-performer-badge"
                className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400"
              >
                Best
              </span>
            )}
            {performance === "worst" && (
              <span
                data-testid="worst-performer-badge"
                className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400"
              >
                Worst
              </span>
            )}
          </div>
          <span
            data-testid="asset-usd-value"
            className="text-white/40 text-sm"
          >
            {formatCurrency(usdValue, 2, "$", false)}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p
          data-testid="asset-pnl-amount"
          className={cn("font-medium", getColorClass(amount))}
        >
          {formatPnLValue(amount)}
        </p>
        <p
          data-testid="asset-pnl-percent"
          className={cn("text-sm", getColorClass(percent))}
        >
          {formatPnLPercent(percent)}
        </p>
      </div>
    </div>
  );
}

export function PnLByAssetCard() {
  const { byAsset, isLoading } = usePnLCalculations();

  // Sort assets by percent (descending) and determine best/worst performers
  const sortedAssets = useMemo(() => {
    if (!byAsset || byAsset.length === 0) return [];

    const sorted = [...byAsset].sort((a, b) => b.percent - a.percent);

    // Mark best and worst performers
    return sorted.map((asset, index) => {
      let performance: "best" | "worst" | null = null;

      if (sorted.length === 1) {
        // Single asset with positive PnL is "best"
        if (asset.percent > 0) performance = "best";
      } else if (sorted.length > 1) {
        // First (highest percent) is best
        if (index === 0) performance = "best";
        // Last (lowest percent) is worst (only if negative)
        if (index === sorted.length - 1 && asset.percent < 0) performance = "worst";
      }

      return { ...asset, performance };
    });
  }, [byAsset]);

  if (isLoading) {
    return (
      <div
        data-testid="pnl-by-asset-card"
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <div data-testid="asset-pnl-loading-skeleton" className="space-y-4">
          <div className="h-4 w-28 bg-white/10 rounded skeleton-shimmer" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full skeleton-shimmer" />
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-white/10 rounded skeleton-shimmer" />
                  <div className="h-3 w-20 bg-white/10 rounded skeleton-shimmer" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="h-4 w-16 bg-white/10 rounded skeleton-shimmer" />
                <div className="h-3 w-12 bg-white/10 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sortedAssets || sortedAssets.length === 0) {
    return (
      <div
        data-testid="pnl-by-asset-card"
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <h3 className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-4">
          PnL by Asset
        </h3>
        <div
          data-testid="empty-assets-message"
          className="text-center py-8 text-white/60"
        >
          <p>No assets found</p>
          <p className="text-sm mt-2">Deposit assets to see PnL breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="pnl-by-asset-card"
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
    >
      <h3 className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-4">
        PnL by Asset
      </h3>

      <div className="divide-y divide-white/5">
        {sortedAssets.map((asset) => (
          <AssetRow
            key={asset.symbol}
            symbol={asset.symbol}
            name={asset.name}
            amount={asset.amount}
            percent={asset.percent}
            usdValue={asset.usdValue}
            performance={asset.performance}
          />
        ))}
      </div>
    </div>
  );
}
