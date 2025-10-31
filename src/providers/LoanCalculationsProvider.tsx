"use client";

import { useCompound } from "@/hooks/useCompound";
import { useLoanCalculations } from "@/hooks/useLoanCalculations";
import { createContext, ReactNode, useContext, useState } from "react";

type Asset = {
  symbol: string;
  amount: number;
  usdValue: number;
  decimals: number;
};

interface LoanCalculations {
  wbtc: number;
  usdt: number[];
  borrowable: number[];
  ltvRange: number[];
  maxLtv: number;
  borrowCapacity: number;
  liquidationRatio: number;
  liquidationPoint: number;
  borrowApr: number;
  ltv: number;
  borrowableAmount: number;
  liquidationPrice: number;
  netLoanValue: number;
  suppliedAssets: Asset[];
  borrowedAssets: Asset[];
  hasBorrowed: boolean;
}

interface LoanCalculationsContextType {
  loanCalcs: LoanCalculations;
  setPreviewAmount: (amount: number) => void;
  refetchLoanData: () => Promise<void>;
}

const LoanCalculationsContext = createContext<LoanCalculationsContextType | undefined>(undefined);

export function LoanCalculationsProvider({ children }: { children: ReactNode }) {
  const [previewAmount, setPreviewAmount] = useState(0);
  const { suppliedAssets, borrowedAssets, refetch: refetchLoanData } = useCompound();
  const loanCalcs = useLoanCalculations(suppliedAssets, borrowedAssets, previewAmount);

  return (
    <LoanCalculationsContext.Provider value={{ loanCalcs, setPreviewAmount, refetchLoanData }}>
      {children}
    </LoanCalculationsContext.Provider>
  );
}

export function useLoanCalculationsContext() {
  const context = useContext(LoanCalculationsContext);
  if (!context) throw new Error("useLoanCalculationsContext must be used within LoanCalculationsProvider");
  return context;
}