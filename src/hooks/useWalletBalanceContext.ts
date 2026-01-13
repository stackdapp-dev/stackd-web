"use client";

import { createContext, useContext } from "react";

export interface WalletBalanceContextType {
    assets: any[];
    totalBalance: number;
    isLoading: boolean;
    error: string | null;
    refetchBalances: () => Promise<void>;
    wbtcBalance: number;
    usdtBalance: number;
}

export const WalletBalanceContext = createContext<WalletBalanceContextType | undefined>(undefined);

export function useWalletBalanceContext() {
    const context = useContext(WalletBalanceContext);
    if (!context) throw new Error("useWalletBalanceContext must be used within WalletBalanceProvider");
    return context;
}
