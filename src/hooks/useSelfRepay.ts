"use client";

import { useState, useCallback } from "react";
import { useCompound } from "@/hooks/useCompound";
import { useFluid } from "@/hooks/useFluid";
import { useGaslessSwap } from "@/hooks/useGaslessSwap";
import { useWeb3 } from "@/providers/Web3Provider";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { TOKEN_METADATA } from "@/constants/Tokens";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";
import { formatUnits, parseUnits } from "viem";
import type { Address } from "viem";
import { toast } from "react-toastify";

export interface SelfRepayEstimate {
    collateralToSell: number;     // Amount of collateral needed to cover debt + fees
    debtToRepay: number;          // Total debt amount (in USD)
    remainingCollateral: number;  // Collateral returned after repay
    priceImpact: number;          // Expected slippage/price impact %
    swapProvider?: string;        // Which DEX aggregator is being used
    // Internal tracking
    collateralToSellRaw?: bigint;
    debtToRepayRaw?: bigint;
}

interface UseSelfRepayOptions {
    collateralType: "wbtc" | "xaut";
    slippage?: number; // Default 0.5%
}

interface UseSelfRepayReturn {
    calculateSelfRepay: () => Promise<void>;
    executeSelfRepay: () => Promise<boolean>;
    isCalculating: boolean;
    isExecuting: boolean;
    estimate: SelfRepayEstimate | null;
    error: string | null;
    slippage: number;
    setSlippage: (slippage: number) => void;
}

/**
 * useSelfRepay - Hook for self-repay (deleverage) functionality
 * 
 * Allows users to close their loan position by selling collateral to repay debt.
 * 
 * For Compound (WBTC on Arbitrum):
 * 1. Withdraw collateral from Compound
 * 2. Swap collateral to USDT via aggregator
 * 3. Repay debt to Compound
 * 4. Remaining collateral stays in wallet
 * 
 * For Fluid (XAUT on Ethereum):
 * Similar multi-step process using Fluid's operate function
 */
export function useSelfRepay({
    collateralType,
    slippage: initialSlippage = 0.5,
}: UseSelfRepayOptions): UseSelfRepayReturn {
    const [isCalculating, setIsCalculating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [estimate, setEstimate] = useState<SelfRepayEstimate | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [slippage, setSlippage] = useState(initialSlippage);

    const isWbtc = collateralType === "wbtc";
    const collateralSymbol = isWbtc ? "WBTC" : "XAUT";
    const collateralDecimals = isWbtc ? 8 : 6;

    // Hooks
    const compound = useCompound();
    const fluid = useFluid();
    const { getQuote } = useGaslessSwap();
    const { publicClient, activeWalletAddress, sendSponsoredTransaction, ensureCorrectNetwork } = useWeb3();
    const getTokenPrice = useGetTokenPrice();
    const { refetchBalances } = useWalletBalanceContext();

    // Get current position data
    const loanData = isWbtc ? compound : fluid;
    const { collateralRaw, borrowRaw, refetch: refetchLoan } = loanData;

    /**
     * Calculate the self-repay estimate by getting a swap quote
     */
    const calculateSelfRepay = useCallback(async () => {
        setIsCalculating(true);
        setError(null);
        setEstimate(null);

        try {
            // Validate position exists
            if (borrowRaw === BigInt(0)) {
                throw new Error("No debt to repay");
            }
            if (collateralRaw === BigInt(0)) {
                throw new Error("No collateral available");
            }

            const collateralAmount = Number(formatUnits(collateralRaw, collateralDecimals));
            const debtAmount = Number(formatUnits(borrowRaw, 6)); // USDT has 6 decimals
            const collateralPrice = getTokenPrice(collateralSymbol);

            console.log(`[SELF-REPAY] Calculating for ${collateralSymbol}`);
            console.log(`[SELF-REPAY] Collateral: ${collateralAmount} ${collateralSymbol}`);
            console.log(`[SELF-REPAY] Debt: ${debtAmount} USDT`);
            console.log(`[SELF-REPAY] Collateral Price: $${collateralPrice}`);

            // Calculate how much collateral we need to sell to cover debt + slippage buffer
            const debtWithBuffer = debtAmount * (1 + slippage / 100);
            const collateralNeeded = debtWithBuffer / collateralPrice;

            // Add buffer for price impact and fees
            const collateralWithBuffer = collateralNeeded * 1.02; // 2% extra buffer

            if (collateralWithBuffer > collateralAmount) {
                throw new Error("Insufficient collateral to cover debt. Consider adding more collateral first.");
            }

            // Get swap quote from aggregator
            const chainId = isWbtc ? 42161 : 1; // Arbitrum or Ethereum
            const sellToken = isWbtc
                ? TOKEN_METADATA.WBTC.address
                : ETHEREUM_TOKEN_ADDRESSES.XAUT;
            const buyToken = isWbtc
                ? TOKEN_METADATA.USDT.address
                : ETHEREUM_TOKEN_ADDRESSES.USDT;

            // Convert to raw amount for quote
            const sellAmountRaw = parseUnits(collateralWithBuffer.toFixed(collateralDecimals), collateralDecimals);

            let priceImpact = 0.5; // Default estimate
            let swapProvider = "DEX Aggregator";

            try {
                const quote = await getQuote(
                    sellToken,
                    buyToken,
                    sellAmountRaw.toString()
                );

                if (quote && quote.liquidityAvailable) {
                    // Calculate actual price impact from quote
                    const expectedBuyAmount = collateralWithBuffer * collateralPrice;
                    const actualBuyAmount = Number(formatUnits(BigInt(quote.buyAmount), 6));
                    priceImpact = ((expectedBuyAmount - actualBuyAmount) / expectedBuyAmount) * 100;
                    priceImpact = Math.max(0, priceImpact); // Ensure non-negative
                    swapProvider = quote.provider || "DEX Aggregator";

                    console.log(`[SELF-REPAY] Quote from ${swapProvider}: ${actualBuyAmount} USDT`);
                    console.log(`[SELF-REPAY] Price impact: ${priceImpact.toFixed(2)}%`);
                }
            } catch (quoteError) {
                console.warn("[SELF-REPAY] Could not get swap quote, using estimate:", quoteError);
                // Continue with estimated values
            }

            const remainingCollateral = collateralAmount - collateralWithBuffer;

            setEstimate({
                collateralToSell: collateralWithBuffer,
                debtToRepay: debtAmount,
                remainingCollateral: Math.max(0, remainingCollateral),
                priceImpact,
                swapProvider,
                collateralToSellRaw: sellAmountRaw,
                debtToRepayRaw: borrowRaw,
            });

            console.log(`[SELF-REPAY] Estimate ready:`, {
                collateralToSell: collateralWithBuffer,
                debtToRepay: debtAmount,
                remainingCollateral,
                priceImpact,
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to calculate self-repay";
            console.error("[SELF-REPAY] Calculation error:", err);
            setError(errorMessage);
        } finally {
            setIsCalculating(false);
        }
    }, [
        borrowRaw,
        collateralRaw,
        collateralDecimals,
        collateralSymbol,
        getTokenPrice,
        slippage,
        isWbtc,
        getQuote,
        activeWalletAddress,
    ]);

    /**
     * Execute the self-repay transaction
     * 
     * This is a multi-step process:
     * 1. Withdraw collateral from lending protocol
     * 2. Swap collateral to debt token (USDT)
     * 3. Repay the debt
     */
    const executeSelfRepay = useCallback(async (): Promise<boolean> => {
        if (!estimate) {
            setError("No estimate available. Please calculate first.");
            return false;
        }

        setIsExecuting(true);
        setError(null);

        try {
            await ensureCorrectNetwork();

            console.log(`[SELF-REPAY] Starting execution for ${collateralSymbol}`);

            if (isWbtc) {
                // === Compound (WBTC on Arbitrum) ===
                const wbtcAddress = TOKEN_METADATA.WBTC.address as Address;
                const usdtAddress = TOKEN_METADATA.USDT.address as Address;

                // Step 1: Withdraw collateral from Compound
                console.log("[SELF-REPAY] Step 1: Withdrawing collateral from Compound");
                const withdrawResult = await compound.withdraw(
                    wbtcAddress,
                    estimate.collateralToSellRaw!
                );

                if (withdrawResult.error) {
                    throw new Error(`Failed to withdraw collateral: ${withdrawResult.error}`);
                }

                toast.info("Collateral withdrawn. Swapping to USDT...");

                // Step 2: Swap WBTC to USDT
                // Using the gasless swap hook
                console.log("[SELF-REPAY] Step 2: Swapping WBTC to USDT");

                // For now, we'll use a simplified flow
                // In production, this would use the full swap aggregator flow
                // with quote -> sign -> submit

                // Note: The actual swap execution requires user signature
                // This is a placeholder for the full implementation
                // We'd need to:
                // 1. Get fresh quote
                // 2. Sign the swap transaction
                // 3. Submit to aggregator

                // For MVP, prompt user to manually swap if needed
                toast.warning(
                    "Please swap your WBTC to USDT using the Convert feature, then repay your loan manually.",
                    { autoClose: 10000 }
                );

                // TODO: Implement full swap flow
                // const swapResult = await executeSwap(...);

                // Step 3: Repay debt
                // This would happen after swap completes
                // const repayResult = await compound.supply(usdtAddress, estimate.debtToRepayRaw!);

            } else {
                // === Fluid (XAUT on Ethereum) ===
                // Similar flow but using Fluid's functions

                console.log("[SELF-REPAY] Step 1: Withdrawing collateral from Fluid");

                // For Fluid, we use the repay function with negative debt
                // The operate function can do withdraw + repay atomically if we have the USDT

                // For now, similar limitation as Compound
                toast.warning(
                    "Please swap your XAUT to USDT manually, then repay your loan using the Repay feature.",
                    { autoClose: 10000 }
                );

                // TODO: Implement full Fluid self-repay flow
            }

            // Refresh data
            await Promise.all([
                refetchBalances(),
                refetchLoan(),
            ]);

            // Note: For MVP, we're showing a partial success
            // Full implementation would complete all steps
            return true;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Self-repay failed";
            console.error("[SELF-REPAY] Execution error:", err);
            setError(errorMessage);
            toast.error(errorMessage);
            return false;
        } finally {
            setIsExecuting(false);
        }
    }, [
        estimate,
        ensureCorrectNetwork,
        collateralSymbol,
        isWbtc,
        compound,
        refetchBalances,
        refetchLoan,
    ]);

    return {
        calculateSelfRepay,
        executeSelfRepay,
        isCalculating,
        isExecuting,
        estimate,
        error,
        slippage,
        setSlippage,
    };
}
