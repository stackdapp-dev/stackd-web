"use client";

import { useState, useCallback } from "react";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { Loading } from "@/components/ui/loading";
import TokenIcon from "@/components/common/TokenIcon";
import { formatAmount, formatCurrency, cn } from "@/lib/utils";
import { AlertTriangle, X, Settings2 } from "lucide-react";

export interface SelfRepayEstimate {
    collateralToSell: number;     // Amount of collateral needed to cover debt + fees
    debtToRepay: number;          // Total debt amount (in USD)
    remainingCollateral: number;  // Collateral returned after repay
    priceImpact: number;          // Expected slippage/price impact %
    swapProvider?: string;        // Which DEX aggregator is being used
}

interface SelfRepayConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    collateralSymbol: "WBTC" | "XAUT";
    estimate: SelfRepayEstimate | null;
    isLoading: boolean;
    isCalculating?: boolean;
    slippage: number;
    onSlippageChange: (slippage: number) => void;
}

const SLIPPAGE_PRESETS = [0.5, 1.0, 2.0];

/**
 * SelfRepayConfirmModal - Confirmation modal for self-repay (deleverage) feature
 * 
 * Shows warning about selling collateral to repay debt and displays:
 * - Amount of collateral that will be sold
 * - Debt amount being repaid
 * - Estimated remaining collateral returned to wallet
 * - Price impact / slippage warning
 * - Configurable slippage tolerance
 */
export default function SelfRepayConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    collateralSymbol,
    estimate,
    isLoading,
    isCalculating = false,
    slippage,
    onSlippageChange,
}: SelfRepayConfirmModalProps) {
    const [showSlippageSettings, setShowSlippageSettings] = useState(false);
    const [customSlippage, setCustomSlippage] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);

    const collateralName = collateralSymbol === "XAUT" ? "Tether Gold" : "Wrapped Bitcoin";

    // Determine if price impact is high (warning threshold)
    const isHighPriceImpact = estimate && estimate.priceImpact > 1.0;
    const isVeryHighPriceImpact = estimate && estimate.priceImpact > 3.0;

    const handleConfirm = useCallback(async () => {
        if (isExecuting || isLoading || isCalculating) return;

        setIsExecuting(true);
        try {
            await onConfirm();
        } finally {
            setIsExecuting(false);
        }
    }, [isExecuting, isLoading, isCalculating, onConfirm]);

    const handleSlippagePreset = useCallback((value: number) => {
        onSlippageChange(value);
        setCustomSlippage("");
    }, [onSlippageChange]);

    const handleCustomSlippageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomSlippage(value);

        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
            onSlippageChange(parsed);
        }
    }, [onSlippageChange]);

    const handleClose = useCallback(() => {
        if (!isExecuting && !isLoading) {
            onClose();
        }
    }, [isExecuting, isLoading, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-slate-900 rounded-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full p-2 bg-amber-500/20">
                            <AlertTriangle className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-semibold">Self Repay</h2>
                            <p className="text-white/50 text-sm">Close your position</p>
                        </div>
                    </div>
                    {!isExecuting && !isLoading && (
                        <button
                            onClick={handleClose}
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Warning Message */}
                <div className="border rounded-xl px-4 py-3 mb-4 bg-amber-500/10 border-amber-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-400/90">
                            Are you sure? This will sell your collateral to pay for your debt and return the remaining collateral to your wallet balance.
                        </p>
                    </div>
                </div>

                {/* Loading State */}
                {isCalculating ? (
                    <Card appearance="glassDark" padding="default" className="mb-4">
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <Loading />
                            <Text tone="muted">Calculating best swap route...</Text>
                        </div>
                    </Card>
                ) : estimate ? (
                    <>
                        {/* Transaction Details */}
                        <Card appearance="glassDark" padding="default" className="mb-4">
                            <div className="space-y-4">
                                {/* Collateral to Sell */}
                                <div>
                                    <p className="text-white/50 text-sm mb-2">Collateral to Sell</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TokenIcon symbol={collateralSymbol} width={28} height={28} />
                                            <span className="text-white font-semibold text-lg">
                                                {formatAmount(estimate.collateralToSell, 6)} {collateralSymbol}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/10" />

                                {/* Debt to Repay */}
                                <div>
                                    <p className="text-white/50 text-sm mb-2">Debt to Repay</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TokenIcon symbol="USDT" width={28} height={28} />
                                            <span className="text-white font-semibold text-lg">
                                                {formatCurrency(estimate.debtToRepay)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/10" />

                                {/* Remaining Collateral */}
                                <div>
                                    <p className="text-white/50 text-sm mb-2">Estimated Return to Wallet</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TokenIcon symbol={collateralSymbol} width={28} height={28} />
                                            <span className="text-emerald-400 font-semibold text-lg">
                                                {formatAmount(estimate.remainingCollateral, 6)} {collateralSymbol}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Price Impact Warning */}
                        {isHighPriceImpact && (
                            <div className={cn(
                                "border rounded-xl px-4 py-3 mb-4 flex items-start gap-3",
                                isVeryHighPriceImpact
                                    ? "bg-red-500/10 border-red-500/20"
                                    : "bg-orange-500/10 border-orange-500/20"
                            )}>
                                <AlertTriangle className={cn(
                                    "w-5 h-5 mt-0.5 flex-shrink-0",
                                    isVeryHighPriceImpact ? "text-red-400" : "text-orange-400"
                                )} />
                                <div>
                                    <p className={cn(
                                        "text-sm font-medium",
                                        isVeryHighPriceImpact ? "text-red-400" : "text-orange-400"
                                    )}>
                                        {isVeryHighPriceImpact ? "Very High" : "High"} Price Impact: {estimate.priceImpact.toFixed(2)}%
                                    </p>
                                    <p className={cn(
                                        "text-xs mt-1",
                                        isVeryHighPriceImpact ? "text-red-400/70" : "text-orange-400/70"
                                    )}>
                                        Consider increasing slippage tolerance or try a smaller amount.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Slippage Settings */}
                        <div className="mb-4">
                            <button
                                onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
                            >
                                <Settings2 className="w-4 h-4" />
                                <span>Slippage Tolerance: {slippage}%</span>
                            </button>

                            {showSlippageSettings && (
                                <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex gap-2 mb-3">
                                        {SLIPPAGE_PRESETS.map((preset) => (
                                            <button
                                                key={preset}
                                                onClick={() => handleSlippagePreset(preset)}
                                                className={cn(
                                                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                                                    slippage === preset && !customSlippage
                                                        ? "bg-amber-500 text-black"
                                                        : "bg-white/10 text-white/70 hover:bg-white/20"
                                                )}
                                            >
                                                {preset}%
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={customSlippage}
                                            onChange={handleCustomSlippageChange}
                                            placeholder="Custom"
                                            className={cn(
                                                "w-full px-3 py-2 rounded-lg",
                                                "bg-white/5 border border-white/10",
                                                "text-white text-sm",
                                                "focus:outline-none focus:border-amber-500/50",
                                                "placeholder:text-white/30"
                                            )}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                                            %
                                        </span>
                                    </div>
                                    {slippage > 5 && (
                                        <p className="text-orange-400 text-xs mt-2">
                                            High slippage may result in unfavorable execution.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Swap Provider Info */}
                        {estimate.swapProvider && (
                            <p className="text-white/40 text-xs text-center mb-4">
                                Swap via {estimate.swapProvider}
                            </p>
                        )}
                    </>
                ) : (
                    <Card appearance="glassDark" padding="default" className="mb-4">
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <Text tone="muted">Unable to calculate self-repay estimate</Text>
                        </div>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isExecuting || isLoading}
                        className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!estimate || isExecuting || isLoading || isCalculating}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2",
                            estimate && !isExecuting && !isLoading && !isCalculating
                                ? isVeryHighPriceImpact
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-amber-500 hover:bg-amber-600 text-black"
                                : "bg-white/10 text-white/40 cursor-not-allowed"
                        )}
                    >
                        {isExecuting || isLoading ? (
                            <>
                                <Loading />
                                <span>Processing...</span>
                            </>
                        ) : (
                            "Continue"
                        )}
                    </button>
                </div>

                {/* Processing Modal Overlay */}
                {(isExecuting || isLoading) && (
                    <Modal
                        isOpen={true}
                        onClose={() => { }}
                        title="Processing Transaction"
                        icon={<Loading />}
                        message={
                            <Text tone="muted">
                                Please confirm the transaction in your wallet and wait for it to complete.
                            </Text>
                        }
                        showCloseButton={false}
                        showActionButtons={false}
                    />
                )}
            </div>
        </div>
    );
}
