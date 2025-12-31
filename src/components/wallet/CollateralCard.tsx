"use client";

import Card from "@/components/ui/card";
import MaskedValue from "@/components/ui/maskedValue";
import Text from "@/components/ui/text";
import { useCollateralBreakdown } from "@/hooks/useCollateralBreakdown";
import { formatAmount, formatCurrency, MASK_LONG, MASK_SHORT, maskString } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import TokenIcon from "../common/TokenIcon";

/**
 * CollateralCard - Unified view of BTC collateral
 * 
 * Shows:
 * - Total WBTC collateral (wallet + Compound)
 * - Locked collateral (backing loans)
 * - Available to withdraw
 * - Health indicator
 */
export default function CollateralCard() {
    const router = useRouter();
    const visibility = useVisibility();
    const { breakdown, hasCollateral, hasLockedCollateral, isLoading } = useCollateralBreakdown();

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

    // Don't show card if no collateral at all
    if (!hasCollateral && !isLoading) {
        return null;
    }

    return (
        <div className="w-full px-4">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-white text-sm font-medium uppercase tracking-wider">
                    Your Collateral
                </h2>
                {hasLockedCollateral && (
                    <div className={`flex items-center gap-1 text-xs ${getHealthColor()}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span>{getHealthLabel()}</span>
                    </div>
                )}
            </div>

            <Card>
                {/* Total Collateral Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <TokenIcon symbol="WBTC" width={40} height={40} />
                        <div>
                            <Text weight="semibold" className="text-white">Total WBTC</Text>
                            <Text tone="muted" className="text-sm">
                                {maskString(formatAmount(breakdown.totalCollateralBtc), visibility.visible, MASK_SHORT)} BTC
                            </Text>
                        </div>
                    </div>
                    <div className="text-right">
                        <MaskedValue
                            value={breakdown.totalCollateralUsd}
                            mask="long"
                            className="text-white font-semibold"
                        />
                    </div>
                </div>

                {/* Breakdown Section */}
                <div className="pt-4 space-y-3">
                    {/* Locked Collateral */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <Text className="text-white/80">Locked</Text>
                                <Text tone="muted" className="text-xs">Backing loans</Text>
                            </div>
                        </div>
                        <div className="text-right">
                            <Text weight="semibold" className="text-amber-400">
                                {maskString(formatAmount(breakdown.lockedCollateralBtc), visibility.visible, MASK_SHORT)} BTC
                            </Text>
                            <Text tone="muted" className="text-xs">
                                {maskString(formatCurrency(breakdown.lockedCollateralUsd), visibility.visible, MASK_LONG)}
                            </Text>
                        </div>
                    </div>

                    {/* Available to Withdraw */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Unlock className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <Text className="text-white/80">Available</Text>
                                <Text tone="muted" className="text-xs">Can withdraw</Text>
                            </div>
                        </div>
                        <div className="text-right">
                            <Text weight="semibold" className="text-emerald-400">
                                {maskString(formatAmount(breakdown.availableToWithdrawBtc), visibility.visible, MASK_SHORT)} BTC
                            </Text>
                            <Text tone="muted" className="text-xs">
                                {maskString(formatCurrency(breakdown.availableToWithdrawUsd), visibility.visible, MASK_LONG)}
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Warning for at-risk positions */}
                {breakdown.healthFactor < 1.2 && breakdown.healthFactor > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <Text className="text-amber-400 font-medium text-sm">Position at risk</Text>
                            <Text tone="muted" className="text-xs">
                                Your loan is close to liquidation. Consider adding more collateral or repaying some of your loan.
                            </Text>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => router.push("/wallet/deposit/WBTC")}
                    >
                        Deposit
                    </Button>
                    <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => router.push("/wallet/tx/withdraw")}
                        disabled={breakdown.availableToWithdrawBtc <= 0}
                    >
                        Withdraw
                    </Button>
                </div>
            </Card>
        </div>
    );
}
