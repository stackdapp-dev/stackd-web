"use client";

import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { Balance } from "@/components/wallet";
import ActionButtons from "@/components/wallet/ActionButtons";
import ActiveLoans from "@/components/wallet/ActiveLoans";
import CollateralCard from "@/components/wallet/CollateralCard";
import NewLoanModal from "@/components/wallet/NewLoanModal";
import { useCollateralBreakdown } from "@/hooks/useCollateralBreakdown";
import { useFluid } from "@/hooks/useFluid";
import { prefetchTransactionHistory } from "@/hooks/useTransactionHistory";
import { useVisibility } from "@/providers/visibility";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function WalletContent() {
  const { assets, isLoading } = useWalletBalanceContext();
  const { breakdown, isLoading: collateralLoading } = useCollateralBreakdown();
  const fluid = useFluid();
  const visibility = useVisibility();
  const { activeWalletAddress } = useWeb3();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  // Auto-open New Loan modal when navigating from rewards simulator
  useEffect(() => {
    if (searchParams.get("openLoan") === "true") {
      setLoanModalOpen(true);
      // Clean up URL param without navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("openLoan");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router]);

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

  // Filter out WBTC and XAUT from assets list - they're shown separately in CollateralCard with breakdown
  const nonCollateralAssets = useMemo(() => {
    return assets.filter(asset => asset.symbol !== "WBTC" && asset.symbol !== "XAUT");
  }, [assets]);

  // Calculate total collateral USD from all sources (WBTC from Compound + XAUT from Fluid)
  const totalCollateralUsd = useMemo(() => {
    const wbtcCollateralUsd = breakdown.totalCollateralUsd || 0;
    const xautCollateralUsd = fluid.suppliedAssets.find(a => a.symbol === "XAUT")?.usdValue || 0;
    return wbtcCollateralUsd + xautCollateralUsd;
  }, [breakdown.totalCollateralUsd, fluid.suppliedAssets]);

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-6 pb-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      {/* Hero Balance - Total collateral deposited in lending positions (WBTC + XAUT) */}
      <Balance
        amount={totalCollateralUsd}
        visible={visibility.visible}
        onToggleVisibility={visibility.toggle}
        walletAddress={activeWalletAddress || ""}
        isLoading={isLoading || collateralLoading || fluid.isLoading}
      />


      {/* Action Buttons */}
      <ActionButtons />

      {/* Unified Assets Section - Other assets + WBTC with collateral breakdown */}
      <CollateralCard otherAssets={nonCollateralAssets} isLoading={isLoading} />

      {/* Active Loans */}
      <ActiveLoans />

      {/* New Loan Modal - auto-opens when navigating from rewards simulator */}
      <NewLoanModal
        isOpen={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
      />
    </div>
  );
}

// Wrap with Suspense for useSearchParams SSR compatibility
export default function Wallet() {
  return (
    <Suspense fallback={<div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-6 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
    </div>}>
      <WalletContent />
    </Suspense>
  );
}
