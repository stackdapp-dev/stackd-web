"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { Loading } from "@/components/ui/loading";
import TokenIcon from "@/components/common/TokenIcon";
import SimulatorGauge from "@/components/wallet/SimulatorGauge";
import SimulatorResults from "@/components/wallet/SimulatorResults";
import { simulateLoan, type SimulationResult } from "@/lib/loans/loanSimulator";
import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useCompound } from "@/hooks/useCompound";
import { useFluid } from "@/hooks/useFluid";
import { useXautBalance } from "@/hooks/useXautBalance";
import { getTokenMetadata } from "@/constants/Tokens";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";
import { formatAmount, formatCurrency, cn } from "@/lib/utils";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { parseUnits } from "viem";
import type { Address } from "viem";
import { toast } from "react-toastify";

export type CollateralType = "WBTC" | "XAUT";

interface NewLoanSimulatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    collateralType: CollateralType;
    maxCollateral: number; // Idle wallet balance
    onComplete?: () => void;
}

/**
 * NewLoanSimulatorModal - Modal for creating new loan positions
 * 
 * Combines collateral deposit + borrow into a single transaction:
 * - WBTC: Uses Compound Bulker for single-tx supply + borrow
 * - XAUT: Uses Fluid's operate function for atomic supply + borrow
 */
export default function NewLoanSimulatorModal({
    isOpen,
    onClose,
    collateralType,
    maxCollateral,
    onComplete,
}: NewLoanSimulatorModalProps) {
    const { refetchBalances, wbtcBalance } = useWalletBalanceContext();
    const { xautBalance } = useXautBalance();
    const getPrice = useGetTokenPrice();
    const compound = useCompound();
    const fluid = useFluid();

    // Determine which protocol to use
    const isXaut = collateralType === "XAUT";
    const collateralSymbol = collateralType;
    const collateralName = isXaut ? "Tether Gold" : "Wrapped Bitcoin";
    const collateralDecimals = isXaut ? 6 : 8;

    // Get actual wallet balance for the collateral type
    const actualMaxCollateral = isXaut ? xautBalance : wbtcBalance;

    // Protocol-specific data
    const maxLtv = isXaut ? fluid.maxLtv : compound.maxLtv;
    const liquidationRatio = isXaut ? fluid.liquidationRatio : compound.liquidationRatio;
    const borrowApr = isXaut ? fluid.borrowApr : compound.borrowApr;

    // Modal and processing state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    // Input state
    const [collateralInput, setCollateralInput] = useState("");
    const [borrowInput, setBorrowInput] = useState("0");

    // Parse inputs for calculations
    const parsedCollateral = parseFloat(collateralInput) || 0;
    const parsedBorrow = parseFloat(borrowInput) || 0;

    // Get collateral price
    const collateralPrice = getPrice(collateralSymbol);

    // Calculate max borrow based on collateral and LTV
    const maxBorrow = useMemo(() => {
        const collateralUsd = parsedCollateral * collateralPrice;
        return collateralUsd * (maxLtv / 100) * 0.99; // 1% buffer
    }, [parsedCollateral, collateralPrice, maxLtv]);

    // Calculate simulation results
    const simulatedResult = useMemo((): SimulationResult => {
        return simulateLoan({
            collateralWbtc: parsedCollateral,
            borrowedUsd: parsedBorrow,
            btcPrice: collateralPrice,
            maxLtv,
            liquidationRatio,
            borrowApr,
        });
    }, [parsedCollateral, parsedBorrow, collateralPrice, maxLtv, liquidationRatio, borrowApr]);

    // Empty starting state (no existing position)
    const currentResult = useMemo((): SimulationResult => {
        return simulateLoan({
            collateralWbtc: 0,
            borrowedUsd: 0,
            btcPrice: collateralPrice,
            maxLtv,
            liquidationRatio,
            borrowApr,
        });
    }, [collateralPrice, maxLtv, liquidationRatio, borrowApr]);

    // Check if form is valid
    const isValid = parsedCollateral > 0 && parsedBorrow > 0 && parsedBorrow <= maxBorrow;

    // Check allowance for collateral token
    useEffect(() => {
        const checkAllowance = async () => {
            if (parsedCollateral <= 0) {
                setNeedsApproval(false);
                return;
            }

            try {
                const amountBigInt = parseUnits(String(parsedCollateral), collateralDecimals);

                if (isXaut) {
                    // Check XAUT allowance for Fluid vault
                    const currentAllowance = await fluid.allowance(ETHEREUM_TOKEN_ADDRESSES.XAUT as Address);
                    setNeedsApproval(currentAllowance !== null && currentAllowance < amountBigInt);
                } else {
                    // For Compound/Bulker, check WBTC allowance for Bulker
                    // The Bulker uses supplyFrom which needs token approval to Bulker
                    const tokenMeta = getTokenMetadata("WBTC");
                    if (tokenMeta && compound.allowance) {
                        // Note: Bulker calls supplyFrom, so user needs to approve Bulker for WBTC
                        const { BULKER_ADDRESS } = await import("@/lib/web3/bulker");
                        const currentAllowance = await compound.allowance(tokenMeta.address as Address, BULKER_ADDRESS as Address);
                        setNeedsApproval(currentAllowance !== null && currentAllowance < amountBigInt);
                    }
                }
            } catch (err) {
                console.error("Error checking allowance:", err);
                setNeedsApproval(false);
            }
        };

        void checkAllowance();
    }, [parsedCollateral, collateralDecimals, isXaut, fluid.allowance, compound.allowance]);

    // Handle collateral input change
    const handleCollateralChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCollateralInput(e.target.value);
        // Reset borrow when collateral changes significantly
        if (parseFloat(e.target.value) === 0) {
            setBorrowInput("0");
        }
    }, []);

    // Handle max collateral button
    const handleSetMaxCollateral = useCallback(() => {
        setCollateralInput(String(actualMaxCollateral * 0.99)); // 1% buffer for gas
    }, [actualMaxCollateral]);

    // Handle borrow slider change
    const handleBorrowChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setBorrowInput(e.target.value);
    }, []);

    // Handle max borrow button
    const handleSetMaxBorrow = useCallback(() => {
        setBorrowInput(String(maxBorrow));
    }, [maxBorrow]);

    // Show confirmation modal
    const handleContinue = useCallback(() => {
        setShowConfirmModal(true);
    }, []);

    // Handle approval
    const handleApprove = useCallback(async () => {
        if (isApproving) return;

        setIsApproving(true);
        try {
            console.log("[NEW LOAN] Starting approval for", collateralSymbol);
            const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

            if (isXaut) {
                // Approve XAUT for Fluid vault
                const result = await fluid.approve(ETHEREUM_TOKEN_ADDRESSES.XAUT as Address, maxAmount);
                if (result.error) {
                    toast.error(`Approval failed: ${result.error}`);
                    throw new Error(result.error);
                }
            } else {
                // Approve WBTC for Bulker
                const tokenMeta = getTokenMetadata("WBTC");
                if (!tokenMeta) throw new Error("WBTC metadata not found");
                const { BULKER_ADDRESS } = await import("@/lib/web3/bulker");
                const result = await compound.approve(tokenMeta.address as Address, maxAmount, BULKER_ADDRESS as Address);
                if (result.error) {
                    toast.error(`Approval failed: ${result.error}`);
                    throw new Error(result.error);
                }
            }

            console.log("[NEW LOAN] Approval successful");
            toast.success("Token approved! Click 'Create Loan' to continue.");
            setNeedsApproval(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            console.error("[NEW LOAN] Approval failed:", err);
            toast.error(`Approval failed: ${errorMessage}`);
        } finally {
            setIsApproving(false);
        }
    }, [isApproving, isXaut, fluid, compound, collateralSymbol]);

    // Execute transaction
    const handleConfirm = useCallback(async () => {
        if (isProcessing || !isValid) return;

        setIsProcessing(true);
        try {
            console.log("[NEW LOAN] Starting transaction for", collateralSymbol);
            const collateralAmount = parseUnits(String(parsedCollateral), collateralDecimals);
            const borrowAmount = parseUnits(String(parsedBorrow), 6); // USDT has 6 decimals

            let result;
            if (isXaut) {
                // Use Fluid's supplyAndBorrow
                result = await fluid.supplyAndBorrow(collateralAmount, borrowAmount);
            } else {
                // Use Compound's supplyAndBorrow (via Bulker)
                result = await compound.supplyAndBorrow(collateralAmount, borrowAmount);
            }

            if (result?.error) {
                toast.error(`Transaction failed: ${result.error}`);
                throw new Error(result.error);
            }

            console.log("[NEW LOAN] Transaction successful");
            toast.success("Loan created successfully!");

            // Refetch all data
            await Promise.all([
                refetchBalances(),
                isXaut ? fluid.refetch() : compound.refetch(),
            ]);

            setShowConfirmModal(false);
            onComplete?.();
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            console.error("[NEW LOAN] Transaction failed:", err);
            toast.error(`Transaction failed: ${errorMessage}`);
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, isValid, parsedCollateral, parsedBorrow, collateralDecimals, isXaut, fluid, compound, refetchBalances, onComplete, onClose, collateralSymbol]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCollateralInput("");
            setBorrowInput("0");
            setShowConfirmModal(false);
            setIsProcessing(false);
            setNeedsApproval(false);
            setIsApproving(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <TokenIcon symbol={collateralSymbol} width={32} height={32} />
                        <div>
                            <h2 className="text-white text-xl font-semibold">New Loan Position</h2>
                            <p className="text-white/50 text-sm">{collateralName} Collateral</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* LTV Gauge */}
                <Card appearance="glassDark" padding="default" className="mb-4">
                    <SimulatorGauge
                        currentLtv={currentResult.ltv}
                        simulatedLtv={simulatedResult.ltv}
                        maxLtv={maxLtv}
                        liquidationRatio={liquidationRatio}
                    />

                    {/* Collateral Input */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <TokenIcon symbol={collateralSymbol} width={24} height={24} />
                                <span className="text-white/70 text-sm">Collateral Amount ({collateralSymbol})</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleSetMaxCollateral}
                                className="text-amber-500 text-xs hover:text-amber-400 transition-colors"
                            >
                                Max: {formatAmount(actualMaxCollateral, 6)} {collateralSymbol}
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={collateralInput}
                                onChange={handleCollateralChange}
                                className={cn(
                                    "w-full px-4 py-3 rounded-lg",
                                    "bg-white/5 border border-white/10",
                                    "text-white font-semibold text-right pr-20",
                                    "focus:outline-none focus:border-purple-500/50",
                                    "placeholder:text-white/30"
                                )}
                                placeholder="0"
                                data-testid="collateral-input"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                                {collateralSymbol}
                            </span>
                        </div>
                        <p className="text-white/40 text-xs mt-1 text-right">
                            ≈ {formatCurrency(parsedCollateral * collateralPrice)}
                        </p>
                    </div>

                    {/* Borrow Amount Slider */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <TokenIcon symbol="USDT" width={24} height={24} />
                                <span className="text-white/70 text-sm">Borrow Amount (USDT)</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleSetMaxBorrow}
                                disabled={maxBorrow <= 0}
                                className="text-amber-500 text-xs hover:text-amber-400 transition-colors disabled:opacity-50"
                            >
                                Max: {formatCurrency(maxBorrow, 0, "$", false)}
                            </button>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center mb-3">
                            <span className="text-white font-semibold text-2xl">
                                {formatCurrency(parsedBorrow, 0, "$", false)}
                            </span>
                        </div>
                        <div className="px-1">
                            <input
                                type="range"
                                min="0"
                                max={maxBorrow || 1}
                                step={maxBorrow / 100 || 1}
                                value={parsedBorrow}
                                onChange={handleBorrowChange}
                                disabled={maxBorrow <= 0}
                                className={cn(
                                    "w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10",
                                    "[&::-webkit-slider-thumb]:appearance-none",
                                    "[&::-webkit-slider-thumb]:w-5",
                                    "[&::-webkit-slider-thumb]:h-5",
                                    "[&::-webkit-slider-thumb]:rounded-full",
                                    "[&::-webkit-slider-thumb]:bg-amber-500",
                                    "[&::-webkit-slider-thumb]:shadow-lg",
                                    "[&::-webkit-slider-thumb]:border-2",
                                    "[&::-webkit-slider-thumb]:border-white/20",
                                    "[&::-moz-range-thumb]:w-5",
                                    "[&::-moz-range-thumb]:h-5",
                                    "[&::-moz-range-thumb]:rounded-full",
                                    "[&::-moz-range-thumb]:bg-amber-500",
                                    "[&::-moz-range-thumb]:border-2",
                                    "[&::-moz-range-thumb]:border-white/20",
                                    "disabled:opacity-50"
                                )}
                                style={{
                                    background: maxBorrow > 0
                                        ? `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${(parsedBorrow / maxBorrow) * 100}%, rgba(255,255,255,0.1) ${(parsedBorrow / maxBorrow) * 100}%, rgba(255,255,255,0.1) 100%)`
                                        : "rgba(255,255,255,0.1)"
                                }}
                                data-testid="borrow-slider"
                            />
                            <div className="flex justify-between text-white/40 text-xs mt-2">
                                <span>$0</span>
                                <span>{formatCurrency(maxBorrow, 0, "$", false)}</span>
                            </div>
                        </div>
                        {maxBorrow <= 0 && parsedCollateral === 0 && (
                            <p className="text-white/40 text-xs mt-2 text-center">
                                Enter collateral amount to enable borrowing
                            </p>
                        )}
                    </div>
                </Card>

                {/* Loan Statistics */}
                <div className="mb-4">
                    <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
                        Loan Preview
                    </h3>
                    <SimulatorResults
                        currentResult={currentResult}
                        simulatedResult={simulatedResult}
                        borrowApr={borrowApr}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!isValid}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-xl font-semibold transition-colors",
                            isValid
                                ? "bg-amber-500 hover:bg-amber-600 text-black"
                                : "bg-white/10 text-white/40 cursor-not-allowed"
                        )}
                        data-testid="continue-button"
                    >
                        Continue
                    </button>
                </div>

                {/* Confirmation Modal */}
                <Modal
                    isOpen={showConfirmModal}
                    onClose={() => !isProcessing && !isApproving && setShowConfirmModal(false)}
                    title={isProcessing || isApproving ? "Processing" : "Confirm New Loan"}
                    icon={
                        isProcessing || isApproving ? (
                            <Loading />
                        ) : (
                            <div className="rounded-full p-4 bg-amber-500/20">
                                <TokenIcon symbol={collateralSymbol} width={40} height={40} />
                            </div>
                        )
                    }
                    message={
                        isProcessing ? (
                            <Text tone="muted">
                                Please confirm the transaction in your wallet.
                            </Text>
                        ) : isApproving ? (
                            <Text tone="muted">
                                Please approve token spending in your wallet.
                            </Text>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* Summary */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-white/50 text-sm mb-2">You will deposit</p>
                                    <div className="flex items-center gap-2">
                                        <TokenIcon symbol={collateralSymbol} width={24} height={24} />
                                        <p className="text-2xl font-bold text-white">
                                            {formatAmount(parsedCollateral, 6)} {collateralSymbol}
                                        </p>
                                    </div>
                                    <p className="text-white/40 text-sm mt-1">
                                        ≈ {formatCurrency(parsedCollateral * collateralPrice)}
                                    </p>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-white/50 text-sm mb-2">And borrow</p>
                                    <div className="flex items-center gap-2">
                                        <TokenIcon symbol="USDT" width={24} height={24} />
                                        <p className="text-2xl font-bold text-white">
                                            {formatCurrency(parsedBorrow, 2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-white/50">LTV</span>
                                        <span className="text-white font-medium">{simulatedResult.ltv.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/50">APR</span>
                                        <span className="text-white font-medium">{borrowApr.toFixed(2)}%</span>
                                    </div>
                                </div>

                                {/* Warning */}
                                <div className="border rounded-lg px-3 py-2 flex items-start gap-2 bg-amber-500/10 border-amber-500/20">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-400/80">
                                        This will create a new loan position. You will need to repay the borrowed amount plus interest.
                                    </p>
                                </div>
                            </div>
                        )
                    }
                    primaryButtonText={
                        isProcessing
                            ? "Processing..."
                            : isApproving
                                ? "Approving..."
                                : needsApproval
                                    ? "Approve & Create Loan"
                                    : "Create Loan"
                    }
                    primaryButtonAction={needsApproval ? handleApprove : handleConfirm}
                    secondaryButtonText="Cancel"
                    secondaryButtonAction={() => setShowConfirmModal(false)}
                    showCloseButton={!isProcessing && !isApproving}
                    showActionButtons={!isProcessing && !isApproving}
                />
            </div>
        </div>
    );
}
