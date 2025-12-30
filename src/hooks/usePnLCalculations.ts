"use client";

import { useMemo } from "react";
import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useTokenPrices } from "@/providers/TokenPriceProvider";
import { useReferral } from "@/hooks/useReferral";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface AssetPnL {
  symbol: string;
  name?: string;
  amount: number;
  percent: number;
  usdValue: number;
}

interface SourcePnL {
  holdings: number;
  lending: number;
  referrals: number;
}

interface Change24h {
  amount: number;
  percent: number;
}

interface PnLCalculations {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  change24h: Change24h;
  byAsset: AssetPnL[];
  bySource: SourcePnL;
  isLoading: boolean;
}

export function usePnLCalculations(): PnLCalculations {
  const { assets, totalBalance, isLoading: walletLoading } = useWalletBalanceContext();
  const { tokenPrices } = useTokenPrices();
  const { loanCalcs } = useLoanCalculationsContext();
  const { stats, loading: referralLoading } = useReferral();
  const priceHistory = usePriceHistory();

  const isLoading = walletLoading || referralLoading || priceHistory?.isLoading;

  // Calculate 24h change based on price history
  const change24h = useMemo((): Change24h => {
    if (!assets || assets.length === 0 || !priceHistory || priceHistory.isLoading) {
      return { amount: 0, percent: 0 };
    }

    let totalValue24hAgo = 0;
    let currentTotalValue = 0;

    assets.forEach((asset) => {
      const currentPrice = tokenPrices?.[asset.symbol]?.usd ?? 0;
      const price24hAgo = priceHistory?.data?.[asset.symbol]?.price24hAgo ?? currentPrice;

      const amount = asset.amount ?? 0;
      currentTotalValue += amount * currentPrice;
      totalValue24hAgo += amount * price24hAgo;
    });

    const changeAmount = currentTotalValue - totalValue24hAgo;
    const changePercent = totalValue24hAgo > 0
      ? ((currentTotalValue - totalValue24hAgo) / totalValue24hAgo) * 100
      : 0;

    return {
      amount: changeAmount,
      percent: changePercent,
    };
  }, [assets, tokenPrices, priceHistory]);

  // Calculate PnL by asset (using 30-day price as proxy for cost basis)
  const byAsset = useMemo((): AssetPnL[] => {
    if (!assets || assets.length === 0 || !priceHistory || priceHistory.isLoading) {
      return [];
    }

    return assets.map((asset) => {
      const currentPrice = tokenPrices?.[asset.symbol]?.usd ?? 0;
      const costBasisPrice = priceHistory?.data?.[asset.symbol]?.price30dAgo ?? currentPrice;

      const amount = asset.amount ?? 0;
      const currentValue = amount * currentPrice;
      const costBasisValue = amount * costBasisPrice;

      const pnlAmount = currentValue - costBasisValue;
      const pnlPercent = costBasisValue > 0
        ? ((currentValue - costBasisValue) / costBasisValue) * 100
        : 0;

      return {
        symbol: asset.symbol,
        name: asset.name,
        amount: pnlAmount,
        percent: pnlPercent,
        usdValue: currentValue,
      };
    });
  }, [assets, tokenPrices, priceHistory]);

  // Calculate total PnL from all assets
  const totalPnL = useMemo(() => {
    return byAsset.reduce((sum, asset) => sum + asset.amount, 0);
  }, [byAsset]);

  // Calculate total PnL percentage
  const totalPnLPercent = useMemo(() => {
    const costBasis = totalBalance - totalPnL;
    if (costBasis <= 0) return 0;
    return (totalPnL / costBasis) * 100;
  }, [totalBalance, totalPnL]);

  // Calculate PnL by source
  const bySource = useMemo((): SourcePnL => {
    // Holdings PnL = PnL from wallet assets
    const holdings = byAsset.reduce((sum, asset) => sum + asset.amount, 0);

    // Lending PnL = net loan value (collateral - borrowed)
    // This represents the net value in lending positions
    // Note: In a full implementation, we'd track actual collateral appreciation
    const lending = loanCalcs?.netLoanValue ?? 0;

    // Referral earnings
    const referrals = stats?.total_earnings ?? 0;

    return {
      holdings,
      lending,
      referrals,
    };
  }, [byAsset, loanCalcs, stats]);

  return {
    totalValue: totalBalance ?? 0,
    totalPnL,
    totalPnLPercent,
    change24h,
    byAsset,
    bySource,
    isLoading: isLoading ?? false,
  };
}
