"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useCompound } from "@/hooks/useCompound";
import { useFluid } from "@/hooks/useFluid";
import { LoanPosition, CollateralType } from "@/types/loans";

interface MultiLoanContextValue {
  allPositions: LoanPosition[];
  hasActiveLoans: boolean;
  getPositionByCollateral: (type: CollateralType) => LoanPosition | undefined;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const MultiLoanContext = createContext<MultiLoanContextValue | undefined>(undefined);

export function MultiLoanProvider({ children }: { children: React.ReactNode }) {
  const compound = useCompound();
  const fluid = useFluid();

  const allPositions = useMemo(() => {
    const positions: LoanPosition[] = [];

    // Add Compound/WBTC position if has borrowed
    const wbtcBorrowed = compound.borrowedAssets.find(a => a.symbol === "USDT");
    if (wbtcBorrowed && wbtcBorrowed.amount > 0) {
      const wbtcCollateral = compound.suppliedAssets.find(a => a.symbol === "WBTC");
      positions.push({
        id: "compound-wbtc",
        protocol: "compound",
        chain: "arbitrum",
        collateralToken: "WBTC",
        borrowToken: "USDT",
        collateralAmount: wbtcCollateral?.amount || 0,
        collateralUsd: wbtcCollateral?.usdValue || 0,
        borrowAmount: wbtcBorrowed.amount,
        borrowUsd: wbtcBorrowed.usdValue,
        ltv: compound.maxLtv > 0 ? ((wbtcBorrowed.usdValue / (wbtcCollateral?.usdValue || 1)) * 100) : 0,
        apr: compound.borrowApr,
        maxLtv: compound.maxLtv,
        liquidationRatio: compound.liquidationRatio,
      });
    }

    // Add Fluid/XAUT position if has borrowed
    const xautBorrowed = fluid.borrowedAssets.find(a => a.symbol === "USDC");
    if (xautBorrowed && xautBorrowed.amount > 0) {
      const xautCollateral = fluid.suppliedAssets.find(a => a.symbol === "XAUT");
      positions.push({
        id: "fluid-xaut",
        protocol: "fluid",
        chain: "ethereum",
        collateralToken: "XAUT",
        borrowToken: "USDC",
        collateralAmount: xautCollateral?.amount || 0,
        collateralUsd: xautCollateral?.usdValue || 0,
        borrowAmount: xautBorrowed.amount,
        borrowUsd: xautBorrowed.usdValue,
        ltv: fluid.maxLtv > 0 ? ((xautBorrowed.usdValue / (xautCollateral?.usdValue || 1)) * 100) : 0,
        apr: fluid.borrowApr,
        maxLtv: fluid.maxLtv,
        liquidationRatio: fluid.liquidationRatio,
      });
    }

    return positions;
  }, [compound, fluid]);

  const hasActiveLoans = allPositions.length > 0;

  const getPositionByCollateral = (type: CollateralType) => {
    return allPositions.find(p => p.collateralToken === type);
  };

  const refetch = async () => {
    await Promise.all([compound.refetch(), fluid.refetch()]);
  };

  return (
    <MultiLoanContext.Provider value={{
      allPositions,
      hasActiveLoans,
      getPositionByCollateral,
      isLoading: compound.isLoading || fluid.isLoading,
      refetch,
    }}>
      {children}
    </MultiLoanContext.Provider>
  );
}

export function useMultiLoan() {
  const ctx = useContext(MultiLoanContext);
  if (!ctx) {
    throw new Error("useMultiLoan must be used within a MultiLoanProvider");
  }
  return ctx;
}
