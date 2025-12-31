"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { Balance } from "@/components/wallet";
import ActionButtons from "@/components/wallet/ActionButtons";
import ActiveLoans from "@/components/wallet/ActiveLoans";
import Assets from "@/components/wallet/Assets";
import CollateralCard from "@/components/wallet/CollateralCard";
import { PnLCarousel } from "@/components/wallet/PnLCarousel";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useVisibility } from "@/providers/visibility";
import { useMemo } from "react";

const Wallet = () => {
  const { assets, totalBalance, isLoading } = useWalletBalanceContext();
  const { loanCalcs } = useLoanCalculationsContext();
  const { netLoanValue } = loanCalcs;
  const visibility = useVisibility();

  // Filter out WBTC from assets list - it's now shown in CollateralCard
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

      {/* PnL Breakdown Carousel */}
      <PnLCarousel />

      {/* Action Buttons */}
      <ActionButtons />

      {/* Collateral Section - Shows unified BTC collateral view */}
      <CollateralCard />

      {/* Other Assets (USDT, USDC, etc. - not WBTC) */}
      <Assets items={nonCollateralAssets} isLoading={isLoading} />

      {/* Active Loans */}
      <ActiveLoans />
    </div>
  );
};

export default Wallet;

