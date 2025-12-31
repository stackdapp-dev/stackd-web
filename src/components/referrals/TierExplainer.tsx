"use client";

import { useReferral } from "@/hooks/useReferral";
import Card from "@/components/ui/card";
import { TierCard } from "./TierCard";
import { TierComparisonGrid } from "./TierComparisonGrid";
import { UserTier, getTierDisplayName } from "@/lib/referrals/tiers";
import { getNextTier } from "@/lib/referrals/tierExplainer";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

// All tiers in order
const ALL_TIERS: UserTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'BLACK'];

// Tier color styles
const tierColors: Record<UserTier, { bg: string; border: string; text: string }> = {
    BRONZE: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-400",
    },
    SILVER: {
        bg: "bg-gray-400/10",
        border: "border-gray-400/20",
        text: "text-gray-300",
    },
    GOLD: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        text: "text-yellow-400",
    },
    PLATINUM: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-400",
    },
    BLACK: {
        bg: "bg-slate-800/50",
        border: "border-slate-600/30",
        text: "text-slate-200",
    },
};

// Check if a tier is unlocked (lower than or equal to current tier)
function isTierUnlocked(tier: UserTier, currentTier: UserTier): boolean {
    const tierIndex = ALL_TIERS.indexOf(tier);
    const currentIndex = ALL_TIERS.indexOf(currentTier);
    return tierIndex <= currentIndex;
}

export function TierExplainer() {
    const { stats, loading } = useReferral();

    // Loading state
    if (loading) {
        return (
            <div data-testid="tier-explainer-skeleton" className="space-y-6">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-white/10 rounded skeleton-shimmer" />
                    <div className="h-4 w-72 bg-white/10 rounded skeleton-shimmer" />
                </div>

                {/* Current tier skeleton */}
                <div className="rounded-2xl border border-white/10 p-6 bg-white/5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/10 skeleton-shimmer" />
                            <div className="space-y-2">
                                <div className="h-6 w-32 bg-white/10 rounded skeleton-shimmer" />
                                <div className="h-4 w-24 bg-white/10 rounded skeleton-shimmer" />
                            </div>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded skeleton-shimmer" />
                    </div>
                </div>

                {/* Tier cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/10 skeleton-shimmer" />
                                    <div className="h-6 w-24 bg-white/10 rounded skeleton-shimmer" />
                                </div>
                                <div className="h-4 w-full bg-white/10 rounded skeleton-shimmer" />
                                <div className="h-4 w-3/4 bg-white/10 rounded skeleton-shimmer" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-white/60">Unable to load tier information. Please try again later.</p>
            </div>
        );
    }

    const currentTier = stats.tier as UserTier;
    const nextTier = getNextTier(currentTier);
    const colors = tierColors[currentTier];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-white text-2xl font-medium mb-2">Tier Benefits</h1>
                <p className="text-white/60">Unlock rewards as you grow your network</p>
            </div>

            {/* Current Tier Section */}
            <Card appearance="glassDark" className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", colors.bg)}>
                        <Trophy className={cn("w-7 h-7", colors.text)} />
                    </div>
                    <div data-testid="current-tier-display">
                        <p className="text-white/40 text-sm">Current Tier</p>
                        <h2 className={cn("text-2xl font-medium", colors.text)}>
                            {getTierDisplayName(currentTier)}
                        </h2>
                    </div>
                </div>

                {/* Progress to next tier */}
                <div data-testid="tier-progress" className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60">
                            {nextTier ? `Progress to ${getTierDisplayName(nextTier)}` : 'Tier Progress'}
                        </span>
                        <span className="text-amber-400">{stats.next_tier_remaining}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                            data-testid="progress-bar"
                            className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stats.next_tier_progress}%` }}
                        />
                    </div>
                </div>
            </Card>

            {/* All Tier Cards */}
            <div>
                <h2 className="text-white text-lg font-medium mb-4">All Tiers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ALL_TIERS.map((tier) => (
                        <TierCard
                            key={tier}
                            tier={tier}
                            isCurrent={tier === currentTier}
                            isUnlocked={isTierUnlocked(tier, currentTier)}
                            hideTitle={tier === currentTier}
                            genericRequirementText
                        />
                    ))}
                </div>
            </div>

            {/* Tier Comparison Grid */}
            <div>
                <h2 className="text-white text-lg font-medium mb-4">Compare Tiers</h2>
                <TierComparisonGrid currentTier={currentTier} abbreviatedHeaders />
            </div>
        </div>
    );
}
