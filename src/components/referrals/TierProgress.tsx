"use client";

import { TIER_THRESHOLDS, UserTier } from "@/lib/referrals/tiers";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export interface TierProgressProps {
    currentTier: UserTier;
    personalLoanBalance: number;
    networkVolume: number;
    totalReferrals: number;
}

// Tier colors
const tierStyles: Record<UserTier, { bg: string; border: string; text: string; icon: string }> = {
    BRONZE: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-400",
        icon: "text-orange-400",
    },
    SILVER: {
        bg: "bg-gray-400/10",
        border: "border-gray-400/20",
        text: "text-gray-300",
        icon: "text-gray-300",
    },
    GOLD: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        text: "text-yellow-400",
        icon: "text-yellow-400",
    },
    PLATINUM: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-400",
        icon: "text-purple-400",
    },
    BLACK: {
        bg: "bg-zinc-800/50",
        border: "border-zinc-700/50",
        text: "text-zinc-200",
        icon: "text-zinc-200",
    },
};

/**
 * Calculate loan progress percentage towards Silver tier ($500 threshold)
 */
export function calculateLoanProgress(loanBalance: number, threshold: number = TIER_THRESHOLDS.SILVER): number {
    if (loanBalance <= 0) return 0;
    return Math.min((loanBalance / threshold) * 100, 100);
}

/**
 * Calculate network volume progress percentage towards Gold tier ($5000 threshold)
 */
export function calculateNetworkProgress(networkVolume: number, threshold: number = TIER_THRESHOLDS.GOLD): number {
    if (networkVolume <= 0) return 0;
    return Math.min((networkVolume / threshold) * 100, 100);
}

/**
 * Get the next tier and its requirements based on current tier
 */
function getNextTierInfo(currentTier: UserTier) {
    switch (currentTier) {
        case "BRONZE":
            return {
                nextTier: "Silver",
                loanThreshold: TIER_THRESHOLDS.SILVER,
                networkThreshold: null, // Not needed for Silver
            };
        case "SILVER":
            return {
                nextTier: "Gold",
                loanThreshold: TIER_THRESHOLDS.SILVER, // Must maintain Silver
                networkThreshold: TIER_THRESHOLDS.GOLD,
            };
        case "GOLD":
            return {
                nextTier: "Platinum",
                loanThreshold: TIER_THRESHOLDS.SILVER,
                networkThreshold: TIER_THRESHOLDS.PLATINUM,
            };
        case "PLATINUM":
            return {
                nextTier: "Black",
                loanThreshold: TIER_THRESHOLDS.SILVER,
                networkThreshold: TIER_THRESHOLDS.BLACK,
            };
        case "BLACK":
            return {
                nextTier: null, // Max tier
                loanThreshold: TIER_THRESHOLDS.SILVER,
                networkThreshold: TIER_THRESHOLDS.BLACK,
            };
    }
}

export function TierProgress({
    currentTier,
    personalLoanBalance,
    networkVolume,
}: TierProgressProps) {
    const tierStyle = tierStyles[currentTier];
    const nextTierInfo = getNextTierInfo(currentTier);

    // Calculate progress percentages
    const loanProgress = calculateLoanProgress(personalLoanBalance, TIER_THRESHOLDS.SILVER);
    const networkProgress = calculateNetworkProgress(
        networkVolume,
        nextTierInfo.networkThreshold || TIER_THRESHOLDS.GOLD
    );

    // Determine which threshold to show for loan (always Silver requirement)
    const loanThreshold = TIER_THRESHOLDS.SILVER;

    // Determine network threshold based on current tier
    const networkThreshold = nextTierInfo.networkThreshold || TIER_THRESHOLDS.GOLD;

    // Format currency
    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
            {/* Tier Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", tierStyle.bg)}>
                        <Trophy className={cn("w-5 h-5", tierStyle.icon)} />
                    </div>
                    <div>
                        <p className={cn("font-medium", tierStyle.text)}>{currentTier} Status</p>
                        <p className="text-white/40 text-xs">
                            {currentTier === "BRONZE" ? "Unlock payouts at Silver" : "Global payouts unlocked"}
                        </p>
                    </div>
                </div>
                <span className={cn("text-xs px-2.5 py-1 rounded-full border", tierStyle.bg, tierStyle.border, tierStyle.text)}>
                    Active
                </span>
            </div>

            {/* Progress Section */}
            {nextTierInfo.nextTier && (
                <div className="space-y-4">
                    <p className="text-white/60 text-xs">Progress to {nextTierInfo.nextTier}</p>

                    {/* Loan Size Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">Loan Size</span>
                            <span className="text-[#ffa02d]">
                                {formatCurrency(personalLoanBalance)} / {formatCurrency(loanThreshold)}
                            </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2">
                            <div
                                data-testid="loan-progress-bar"
                                className="bg-gradient-to-r from-[#ffa02d] to-[#ff8c00] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${loanProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Network Volume Progress (for Silver+ tiers progressing to Gold+) */}
                    {(currentTier !== "BRONZE" || networkThreshold) && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-white/60">Network Volume</span>
                                <span className="text-[#ffa02d]">
                                    {formatCurrency(networkVolume)} / {formatCurrency(networkThreshold)}
                                </span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div
                                    data-testid="network-progress-bar"
                                    className="bg-gradient-to-r from-[#ffa02d] to-[#ff8c00] h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${networkProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Explanation text */}
                    <p className="text-white/40 text-xs italic">
                        {currentTier === "BRONZE"
                            ? "* Loan size of $500 required for Silver"
                            : "* Both criteria required for next tier"}
                    </p>
                </div>
            )}

            {/* Max Tier Message */}
            {!nextTierInfo.nextTier && (
                <div className="text-center py-4">
                    <p className="text-white/60 text-sm">You&apos;ve reached the highest tier!</p>
                </div>
            )}
        </div>
    );
}
