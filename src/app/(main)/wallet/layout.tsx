"use client";

import { useWalletBalance } from "@/hooks/useWalletBalance";
import { LoanCalculationsProvider } from "@/providers/LoanCalculationsProvider";
import { useTokenPrices } from "@/providers/TokenPriceProvider";
import VisibilityProvider from "@/providers/visibility";
import { createContext, useContext, useMemo } from "react";

interface WalletBalanceContextType {
  assets: any[];
  totalBalance: number;
  isLoading: boolean;
  error: string | null;
  refetchBalances: () => Promise<void>;
  wbtcBalance: number;
  usdtBalance: number;
}

const WalletBalanceContext = createContext<WalletBalanceContextType | undefined>(undefined);

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

export function useWalletBalanceContext() {
  const context = useContext(WalletBalanceContext);
  if (!context) throw new Error("useWalletBalanceContext must be used within WalletBalanceProvider");
  return context;
}

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VisibilityProvider>
      <WalletBalanceProvider>
        <LoanCalculationsProvider>{children}</LoanCalculationsProvider>
      </WalletBalanceProvider>
    </VisibilityProvider>
  );
}