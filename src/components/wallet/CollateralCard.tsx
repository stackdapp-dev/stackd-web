"use client";

import { useState, useMemo } from "react";
import Card from "@/components/ui/card";
import Text from "@/components/ui/text";
import { useCollateralBreakdown } from "@/hooks/useCollateralBreakdown";
import { useFluid } from "@/hooks/useFluid";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { formatAmount, formatCurrency, MASK_LONG, MASK_SHORT, maskString } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import { Lock, Unlock, AlertTriangle, ChevronDown } from "lucide-react";
import TokenIcon from "../common/TokenIcon";

interface AssetItem {
    symbol: string;
    name?: string;
    amount?: number;
    usdValue: number;
}

interface CollateralCardProps {
    /** Other assets to show above WBTC (USDT, ETH, etc.) */
    otherAssets?: AssetItem[];
    isLoading?: boolean;
}

// Token display names
const tokenNames: Record<string, string> = {
    WBTC: "Bitcoin (Wrapped)",
    BTC: "Bitcoin",
    USDT: "USDT",
    ETH: "Ethereum",
    XAUT: "Tether Gold",
};

/**
 * CollateralCard - Unified view of all assets including BTC collateral
 *
 * Shows:
 * - Other assets (USDT, ETH, etc.) as regular rows
 * - WBTC with collapsible Locked/Available breakdown
 * - Health indicator for collateral
 */
export default function CollateralCard({ otherAssets = [], isLoading = false }: CollateralCardProps) {
    const visibility = useVisibility();
    const { breakdown, hasLockedCollateral } = useCollateralBreakdown();
    const fluid = useFluid();
    const getTokenPrice = useGetTokenPrice();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isXautExpanded, setIsXautExpanded] = useState(false);

    // XAUT price for calculations
    const xautPrice = getTokenPrice("XAUT");

    // Calculate XAUT collateral breakdown
    const xautBreakdown = useMemo(() => {
        const xautCollateral = fluid.suppliedAssets.find(a => a.symbol === "XAUT");
        const totalXaut = xautCollateral?.amount || 0;
        const totalXautUsd = xautCollateral?.usdValue || 0;

        // Calculate locked XAUT based on borrowed amount and max LTV
        const borrowedUsd = fluid.borrowedAssets.reduce((sum, a) => sum + a.usdValue, 0);
        const lockedXautUsd = borrowedUsd > 0 && fluid.maxLtv > 0
            ? borrowedUsd / (fluid.maxLtv / 100)
            : 0;
        const lockedXaut = xautPrice > 0 ? lockedXautUsd / xautPrice : 0;

        // Available to withdraw = total - locked
        const availableXaut = Math.max(0, totalXaut - lockedXaut);
        const availableXautUsd = availableXaut * xautPrice;

        return {
            totalXaut,
            totalXautUsd,
            lockedXaut,
            lockedXautUsd,
            availableXaut,
            availableXautUsd,
            hasLocked: lockedXaut > 0,
        };
    }, [fluid.suppliedAssets, fluid.borrowedAssets, fluid.maxLtv, xautPrice]);

    // Calculate health indicator color
    const getHealthColor = () => {
        if (breakdown.healthFactor >= 2) return "text-emerald-400";
        if (breakdown.healthFactor >= 1.5) return "text-green-400";
        if (breakdown.healthFactor >= 1.2) return "text-yellow-400";
        if (breakdown.healthFactor >= 1) return "text-orange-400";
        return "text-red-400";
    };

    const getHealthLabel = () => {
        if (breakdown.healthFactor >= 2) return "Healthy";
        if (breakdown.healthFactor >= 1.5) return "Good";
        if (breakdown.healthFactor >= 1.2) return "Moderate";
        if (breakdown.healthFactor >= 1) return "At Risk";
        return "Danger";
    };

    // Note: We always show the card because WBTC is filtered out from otherAssets
    // in the parent component and must be displayed here. Even with 0 balance,
    // WBTC should be visible to users as it's the primary collateral asset.

    // Show skeleton loading state
    if (isLoading) {
        return (
            <div className="w-full px-4">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white text-sm font-medium uppercase tracking-wider">
                        Assets
                    </h2>
                </div>

                <div data-testid="collateral-loading-skeleton" className="flex flex-col gap-2">
                    {/* Skeleton Asset Rows */}
                    {[1, 2, 3].map((i) => (
                        <Card key={i} appearance="glassDark" padding="compact">
                            <div className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white/10 skeleton-shimmer" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-white/10 rounded skeleton-shimmer" />
                                        <div className="h-3 w-20 bg-white/10 rounded skeleton-shimmer" />
                                    </div>
                                </div>
                                <div className="h-4 w-20 bg-white/10 rounded skeleton-shimmer" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-4">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-white text-sm font-medium uppercase tracking-wider">
                    Assets
                </h2>
                {hasLockedCollateral && (
                    <div className={`flex items-center gap-1 text-xs ${getHealthColor()}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span>{getHealthLabel()}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                {/* Other Assets (USDT, ETH, etc.) */}
                {otherAssets.map((asset) => (
                    <Card key={asset.symbol} appearance="glassDark" padding="compact">
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3">
                                <TokenIcon symbol={asset.symbol} width={36} height={36} />
                                <div>
                                    <span className="text-white font-semibold">
                                        {tokenNames[asset.symbol] || asset.name || asset.symbol}
                                    </span>
                                    <p className="text-white/50 text-xs">
                                        {maskString(formatAmount(asset.amount || 0, 4), visibility.visible, MASK_SHORT)} {asset.symbol}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-white font-medium">
                                    {maskString(formatCurrency(asset.usdValue), visibility.visible, MASK_SHORT)}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}

                {/* WBTC Collateral Card - Always shown since WBTC is filtered from otherAssets */}
                <Card appearance="glassDark" padding="compact">
                    {/* WBTC Header Row - Clickable when has locked collateral */}
                    <button
                        type="button"
                        onClick={() => hasLockedCollateral && setIsExpanded(!isExpanded)}
                        className={`flex items-center justify-between w-full py-1 ${hasLockedCollateral ? 'cursor-pointer' : 'cursor-default'}`}
                        disabled={!hasLockedCollateral}
                    >
                        <div className="flex items-center gap-3">
                            <TokenIcon symbol="WBTC" width={36} height={36} />
                            <div className="flex flex-col text-left">
                                <span className="text-white font-semibold">Bitcoin (Wrapped)</span>
                                <span className="text-white/50 text-xs">
                                    {maskString(formatAmount(breakdown.totalCollateralBtc, 4), visibility.visible, MASK_SHORT)}
                                </span>
                                <span className="text-white/50 text-xs">WBTC</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                                {maskString(formatCurrency(breakdown.totalCollateralUsd), visibility.visible, MASK_LONG)}
                            </span>
                            {hasLockedCollateral && (
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                    <ChevronDown
                                        className={`w-4 h-4 text-white/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Collapsible Locked/Available Breakdown */}
                    {hasLockedCollateral && (
                        <div
                            className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="mt-3 ml-5 pl-5 border-l border-white/10 space-y-2 pb-1">
                                {/* Locked Collateral */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                            <Lock className="w-3 h-3 text-amber-400" />
                                        </div>
                                        <div>
                                            <Text className="text-white text-xs">Locked</Text>
                                            <span className="text-white/40 text-[10px]">Backing loans</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Text weight="semibold" className="text-amber-400 text-xs">
                                            {maskString(formatAmount(breakdown.lockedCollateralBtc, 4), visibility.visible, MASK_SHORT)} BTC
                                        </Text>
                                        <span className="text-white/40 text-[10px]">
                                            {maskString(formatCurrency(breakdown.lockedCollateralUsd), visibility.visible, MASK_LONG)}
                                        </span>
                                    </div>
                                </div>

                                {/* Available to Withdraw */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <Unlock className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <div>
                                            <Text className="text-white text-xs">Available</Text>
                                            <span className="text-white/40 text-[10px]">Can withdraw</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Text weight="semibold" className="text-emerald-400 text-xs">
                                            {maskString(formatAmount(breakdown.availableToWithdrawBtc, 4), visibility.visible, MASK_SHORT)} BTC
                                        </Text>
                                        <span className="text-white/40 text-[10px]">
                                            {maskString(formatCurrency(breakdown.availableToWithdrawUsd), visibility.visible, MASK_LONG)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Warning for at-risk positions */}
                            {breakdown.healthFactor < 1.2 && breakdown.healthFactor > 0 && (
                                <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <Text className="text-amber-400 font-medium text-xs">Position at risk</Text>
                                        <span className="text-white/40 text-[10px]">
                                            Consider adding collateral or repaying your loan.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* XAUT Collateral Card - Show when user has XAUT collateral */}
                {xautBreakdown.totalXaut > 0 && (
                    <Card appearance="glassDark" padding="compact">
                        {/* XAUT Header Row - Clickable when has locked collateral */}
                        <button
                            type="button"
                            onClick={() => xautBreakdown.hasLocked && setIsXautExpanded(!isXautExpanded)}
                            className={`flex items-center justify-between w-full py-1 ${xautBreakdown.hasLocked ? 'cursor-pointer' : 'cursor-default'}`}
                            disabled={!xautBreakdown.hasLocked}
                        >
                            <div className="flex items-center gap-3">
                                <TokenIcon symbol="XAUT" width={36} height={36} />
                                <div className="flex flex-col text-left">
                                    <span className="text-white font-semibold">Tether Gold</span>
                                    <span className="text-white/50 text-xs">
                                        {maskString(formatAmount(xautBreakdown.totalXaut, 4), visibility.visible, MASK_SHORT)}
                                    </span>
                                    <span className="text-white/50 text-xs">XAUT</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium">
                                    {maskString(formatCurrency(xautBreakdown.totalXautUsd), visibility.visible, MASK_LONG)}
                                </span>
                                {xautBreakdown.hasLocked && (
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                        <ChevronDown
                                            className={`w-4 h-4 text-white/50 transition-transform duration-200 ${isXautExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                )}
                            </div>
                        </button>

                        {/* Collapsible Locked/Available Breakdown */}
                        {xautBreakdown.hasLocked && (
                            <div
                                className={`overflow-hidden transition-all duration-200 ease-in-out ${isXautExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="mt-3 ml-5 pl-5 border-l border-white/10 space-y-2 pb-1">
                                    {/* Locked Collateral */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                <Lock className="w-3 h-3 text-amber-400" />
                                            </div>
                                            <div>
                                                <Text className="text-white text-xs">Locked</Text>
                                                <span className="text-white/40 text-[10px]">Backing loans</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Text weight="semibold" className="text-amber-400 text-xs">
                                                {maskString(formatAmount(xautBreakdown.lockedXaut, 4), visibility.visible, MASK_SHORT)} XAUT
                                            </Text>
                                            <span className="text-white/40 text-[10px]">
                                                {maskString(formatCurrency(xautBreakdown.lockedXautUsd), visibility.visible, MASK_LONG)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Available to Withdraw */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Unlock className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <div>
                                                <Text className="text-white text-xs">Available</Text>
                                                <span className="text-white/40 text-[10px]">Can withdraw</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Text weight="semibold" className="text-emerald-400 text-xs">
                                                {maskString(formatAmount(xautBreakdown.availableXaut, 4), visibility.visible, MASK_SHORT)} XAUT
                                            </Text>
                                            <span className="text-white/40 text-[10px]">
                                                {maskString(formatCurrency(xautBreakdown.availableXautUsd), visibility.visible, MASK_LONG)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
