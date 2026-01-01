"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { Balance } from "@/components/wallet";
import ActionButtons from "@/components/wallet/ActionButtons";
import ActiveLoans from "@/components/wallet/ActiveLoans";
import CollateralCard from "@/components/wallet/CollateralCard";
import { prefetchTransactionHistory } from "@/hooks/useTransactionHistory";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useVisibility } from "@/providers/visibility";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

const Wallet = () => {
  const { assets, totalBalance, isLoading } = useWalletBalanceContext();
  const { loanCalcs } = useLoanCalculationsContext();
  const { netLoanValue } = loanCalcs;
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
    <div className="flex flex-col gap-6 pb-8">
      {/* Hero Balance */}
      <Balance
        amount={totalBalance + netLoanValue}
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
