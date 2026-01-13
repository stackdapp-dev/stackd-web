"use client";

import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { Balance } from "@/components/wallet";
import ActionButtons from "@/components/wallet/ActionButtons";
import ActiveLoans from "@/components/wallet/ActiveLoans";
import CollateralCard from "@/components/wallet/CollateralCard";
import { useCollateralBreakdown } from "@/hooks/useCollateralBreakdown";
import { prefetchTransactionHistory } from "@/hooks/useTransactionHistory";
import { useVisibility } from "@/providers/visibility";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

const Wallet = () => {
  const { assets, isLoading } = useWalletBalanceContext();
  const { breakdown } = useCollateralBreakdown();
  const visibility = useVisibility();
  const { activeWalletAddress } = useWeb3();
  const queryClient = useQueryClient();

  // Prefetch transaction history data for the history page
  // This runs during idle time so navigation to /history feels instant
  useEffect(() => {
    if (!activeWalletAddress) return;

    // Use requestIdleCallback for non-blocking prefetch
    const idleCallback = window.requestIdleCallback?.(() => {
      prefetchTransactionHistory(queryClient, activeWalletAddress);
    }) ?? setTimeout(() => {
      prefetchTransactionHistory(queryClient, activeWalletAddress);
    }, 1000);

    return () => {
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(idleCallback as number);
      } else {
        clearTimeout(idleCallback as number);
      }
    };
  }, [activeWalletAddress, queryClient]);

  // Filter out WBTC from assets list - it's shown separately in CollateralCard with breakdown
  const nonCollateralAssets = useMemo(() => {
    return assets.filter(asset => asset.symbol !== "WBTC");
  }, [assets]);

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-6 pb-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      {/* Hero Balance - Total BTC deposited in lending positions */}
      <Balance
        amount={breakdown.totalCollateralUsd}
        visible={visibility.visible}
        onToggleVisibility={visibility.toggle}
      />

      {/* Action Buttons */}
      <ActionButtons />

      {/* Unified Assets Section - Other assets + WBTC with collateral breakdown */}
      <CollateralCard otherAssets={nonCollateralAssets} isLoading={isLoading} />

      {/* Active Loans */}
      <ActiveLoans />
    </div>
  );
};

export default Wallet;
