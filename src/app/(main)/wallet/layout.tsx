"use client";

import { useWalletBalance } from "@/hooks/useWalletBalance";
import { WalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { LoanCalculationsProvider } from "@/providers/LoanCalculationsProvider";
import { MultiLoanProvider } from "@/providers/MultiLoanProvider";
import { useTokenPrices } from "@/providers/TokenPriceProvider";
import VisibilityProvider from "@/providers/visibility";
import { useMemo } from "react";

function WalletBalanceProvider({ children }: { children: React.ReactNode }) {
  const { tokenPrices } = useTokenPrices();
  const walletBalanceData = useWalletBalance(tokenPrices);

  const wbtcBalance = useMemo(() => {
    return walletBalanceData.assets.find((a) => a.symbol === "WBTC")?.amount || 0;
  }, [walletBalanceData.assets]);

  const usdtBalance = useMemo(() => {
    return walletBalanceData.assets.find((a) => a.symbol === "USDT")?.amount || 0;
  }, [walletBalanceData.assets]);

  const contextValue = useMemo(() => ({
    ...walletBalanceData,
    wbtcBalance,
    usdtBalance,
  }), [walletBalanceData, wbtcBalance, usdtBalance]);

  return (
    <WalletBalanceContext.Provider value={contextValue}>
      {children}
    </WalletBalanceContext.Provider>
  );
}

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VisibilityProvider>
      <WalletBalanceProvider>
        <LoanCalculationsProvider>
          <MultiLoanProvider>{children}</MultiLoanProvider>
        </LoanCalculationsProvider>
      </WalletBalanceProvider>
    </VisibilityProvider>
  );
}