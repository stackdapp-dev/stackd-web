"use client";

import Card from "@/components/ui/card";
import MaskedValue from "@/components/ui/maskedValue";
import { formatAmount, MASK_SHORT, maskString } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import { useRouter } from "next/navigation";
import React from "react";
import TokenIcon from "../common/TokenIcon";
import { Button } from "../ui/button";

interface AssetItem {
  id?: string;
  symbol: string;
  name?: string;
  amount?: number;
  icon?: React.ReactNode;
  usdValue: number;
  actionLabel?: string;
  onAction?: (id?: string) => void;
}

interface AssetsProps {
  items: AssetItem[];
}

// Token names mapping
const tokenNames: Record<string, string> = {
  WBTC: "Wrapped Bitcoin",
  BTC: "Bitcoin",
  USDT: "Tether USD",
  USDC: "USD Coin",
  ETH: "Ethereum",
};

// Token background colors
const tokenColors: Record<string, string> = {
  WBTC: "bg-orange-500/20",
  BTC: "bg-orange-500/20",
  USDT: "bg-teal-500/20",
  USDC: "bg-blue-500/20",
  ETH: "bg-purple-500/20",
};

export default function Assets({ items }: AssetsProps) {
  const visibility = useVisibility();
  const router = useRouter();

  return (
    <div className="w-full px-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-sm font-medium uppercase tracking-wider">Assets</h2>
        <span className="text-white/40 text-xs uppercase tracking-wider">USD Value</span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((it) => (
          <Card
            key={it.id ?? it.symbol}
            appearance="glassDark"
            padding="compact"
          >
            <div className="flex items-center justify-between">
              {/* Left: Icon + Info */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${tokenColors[it.symbol] || "bg-white/10"} flex items-center justify-center`}>
                  <TokenIcon symbol={it.symbol} width={24} height={24} />
                </div>
                <div>
                  <span className="text-white font-medium">{it.symbol}</span>
                  <p className="text-white/40 text-xs">{tokenNames[it.symbol] || it.name || it.symbol}</p>
                </div>
              </div>

              {/* Right: Value + Deposit Button */}
              <div className="flex items-center gap-3">
                <MaskedValue
                  value={it.usdValue || 0}
                  mask="long"
                  className="text-white/60 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/wallet/deposit/${encodeURIComponent(it.symbol)}`)}
                  className="rounded-full px-4"
                >
                  Deposit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


