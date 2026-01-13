"use client";

import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useMemo } from "react";
import {
    calculateCollateralBreakdown,
    canWithdrawAmount,
    type CollateralBreakdown,
} from "@/lib/calculations/collateralCalculations";

interface UseCollateralBreakdownResult {
    /** Full collateral breakdown */
    breakdown: CollateralBreakdown;
    /** Loading state */
    isLoading: boolean;
    /** Check if a specific withdrawal amount is allowed */
    canWithdraw: (amountBtc: number) => { allowed: boolean; reason?: string };
    /** Whether user has any collateral */
    hasCollateral: boolean;
    /** Whether any collateral is locked (has loans) */
    hasLockedCollateral: boolean;
}

/**
 * Hook that provides unified collateral breakdown combining wallet + Compound balances.
 * 
 * This hook aggregates:
 * - WBTC in wallet (not yet deposited)
 * - WBTC supplied to Compound protocol
 * 
 * And calculates:
 * - Total collateral
 * - Locked collateral (backing loans)
 * - Available to withdraw
 * - Health factor
 */
export function useCollateralBreakdown(): UseCollateralBreakdownResult {
    const { wbtcBalance, isLoading: walletLoading } = useWalletBalanceContext();
    const { loanCalcs } = useLoanCalculationsContext();
    const getTokenPrice = useGetTokenPrice();

    const btcPrice = getTokenPrice("WBTC");

    // Get collateral in Compound (suppliedAssets)
    const compoundWbtcBalance = useMemo(() => {
        const wbtcAsset = loanCalcs.suppliedAssets.find(a => a.symbol === "WBTC");
        return wbtcAsset?.amount ?? 0;
    }, [loanCalcs.suppliedAssets]);

    // Get total borrowed USD
    const totalBorrowedUsd = useMemo(() => {
        return loanCalcs.borrowedAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
    }, [loanCalcs.borrowedAssets]);

    // Calculate breakdown
    const breakdown = useMemo(() => {
        return calculateCollateralBreakdown(
            wbtcBalance,           // Wallet balance (available for deposit)
            compoundWbtcBalance,   // Already in Compound as collateral
            totalBorrowedUsd,
            btcPrice,
            loanCalcs.maxLtv / 100  // Convert from percentage to decimal
        );
    }, [wbtcBalance, compoundWbtcBalance, totalBorrowedUsd, btcPrice, loanCalcs.maxLtv]);

    // Helper function to check withdrawal
    const canWithdraw = useMemo(() => {
        return (amountBtc: number) => canWithdrawAmount(amountBtc, breakdown);
    }, [breakdown]);

    const hasCollateral = breakdown.totalCollateralBtc > 0;
    const hasLockedCollateral = breakdown.lockedCollateralBtc > 0;

    return {
        breakdown,
        isLoading: walletLoading,
        canWithdraw,
        hasCollateral,
        hasLockedCollateral,
    };
}
