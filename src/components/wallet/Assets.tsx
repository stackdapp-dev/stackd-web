"use client";

import Card from "@/components/ui/card";
import { SkeletonRow } from "@/components/ui/skeleton";
import { formatAmount, formatCurrency, MASK_SHORT, maskString } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import React from "react";
import TokenIcon from "../common/TokenIcon";

interface AssetItem {
  id?: string;
  symbol: string;
  name?: string;
  amount?: number;
  icon?: React.ReactNode;
  usdValue: number;
  change24h?: number; // percentage change
}

interface AssetsProps {
  items: AssetItem[];
  isLoading?: boolean;
}

// Token display names - WBTC shows as "Bitcoin (Wrapped)"
const tokenNames: Record<string, string> = {
  WBTC: "Bitcoin (Wrapped)",
  BTC: "Bitcoin",
  USDT: "USD Tether",
  USDC: "USD Coin",
  ETH: "Ethereum",
};

// Token icon background colors
const tokenColors: Record<string, string> = {
  WBTC: "bg-amber-600/30",
  BTC: "bg-orange-500/20",
  USDT: "bg-teal-500/20",
  USDC: "bg-blue-500/20",
  ETH: "bg-purple-500/20",
};

// Token icon letter for fallback
const tokenLetters: Record<string, string> = {
  WBTC: "W",
  USDT: "U",
};

export default function Assets({ items, isLoading = false }: AssetsProps) {
  const visibility = useVisibility();

  return (
    <div className="w-full px-4">
      {/* Section Header */}
      <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
        Assets
      </h2>

      <div className="flex flex-col gap-3">
        {/* Show skeleton loading rows */}
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </>
        ) : (
          items.map((it) => {
            const change = it.change24h ?? 0;
            const isPositive = change >= 0;
            const changeColor = isPositive ? "text-green-400" : "text-red-400";
            const sign = isPositive ? "+" : "";

            return (
              <Card
                key={it.id ?? it.symbol}
                appearance="glassDark"
                padding="default"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Icon + Name + Amount */}
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={it.symbol} width={48} height={48} />
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">
                        {tokenNames[it.symbol] || it.name || it.symbol}
                      </span>
                      <span className="text-white/50 text-sm">{it.symbol}</span>
                      <span className="text-white/50 text-sm">
                        {maskString(formatAmount(it.amount || 0), visibility.visible, MASK_SHORT)}
                      </span>
                    </div>
                  </div>

                  {/* Right: USD Value + Change */}
                  <div className="text-right">
                    <span className="text-white font-semibold">
                      {maskString(formatCurrency(it.usdValue), visibility.visible, MASK_SHORT)}
                    </span>
                    {change !== 0 && (
                      <p className={`text-sm ${changeColor}`}>
                        {sign}{change.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
