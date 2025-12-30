"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/card";
import { UserTier, getTierDisplayName, TIER_THRESHOLDS } from "@/lib/referrals/tiers";

export interface TierComparisonGridProps {
    currentTier: UserTier;
}

// All tiers in order
const ALL_TIERS: UserTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'BLACK'];

// Tier color styles for column headers
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

// Benefit definitions with tier availability
interface BenefitRow {
    id: string;
    label: string;
    availableFrom: UserTier;
}

const BENEFIT_ROWS: BenefitRow[] = [
    { id: 'earnings', label: 'Base Earnings', availableFrom: 'BRONZE' },
    { id: 'payouts', label: 'Payouts Unlocked', availableFrom: 'SILVER' },
    { id: 'apy', label: '+5% APY Boost', availableFrom: 'GOLD' },
    { id: 'support', label: 'Priority Support', availableFrom: 'PLATINUM' },
    { id: 'visa', label: 'Metal Visa Card', availableFrom: 'BLACK' },
];

// Check if a tier has a specific benefit
function tierHasBenefit(tier: UserTier, benefit: BenefitRow): boolean {
    const tierIndex = ALL_TIERS.indexOf(tier);
    const benefitTierIndex = ALL_TIERS.indexOf(benefit.availableFrom);
    return tierIndex >= benefitTierIndex;
}

// Get requirement text for a tier
function getTierRequirement(tier: UserTier): string {
    switch (tier) {
        case 'BRONZE':
            return 'Starting tier';
        case 'SILVER':
            return `$${TIER_THRESHOLDS.SILVER.toLocaleString()} loan`;
        case 'GOLD':
            return `$${TIER_THRESHOLDS.GOLD.toLocaleString()} volume`;
        case 'PLATINUM':
            return `$${TIER_THRESHOLDS.PLATINUM.toLocaleString()} volume`;
        case 'BLACK':
            return `$${TIER_THRESHOLDS.BLACK.toLocaleString()} volume`;
    }
}

export function TierComparisonGrid({ currentTier }: TierComparisonGridProps) {
    return (
        <Card
            appearance="glassDark"
            padding="none"
            data-testid="tier-comparison-container"
            className="overflow-x-auto"
        >
            <table role="table" className="w-full min-w-[600px]">
                <thead>
                    <tr>
                        <th className="text-left p-4 text-white/40 text-xs uppercase tracking-wider font-normal">
                            Feature
                        </th>
                        {ALL_TIERS.map((tier) => {
                            const colors = tierColors[tier];
                            const isCurrent = tier === currentTier;
                            return (
                                <th
                                    key={tier}
                                    data-testid={`tier-column-header-${tier}`}
                                    data-tier={tier}
                                    data-current={isCurrent ? "true" : undefined}
                                    className={cn(
                                        "p-4 text-center font-medium min-w-[100px]",
                                        colors.text,
                                        isCurrent && colors.bg,
                                        isCurrent && "border-b-2 border-amber-500"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <span>{getTierDisplayName(tier)}</span>
                                        {isCurrent && (
                                            <span className="text-xs text-amber-400 font-normal">
                                                Your Tier
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {/* Requirements Row */}
                    <tr data-testid="requirements-row" className="border-t border-white/5">
                        <td className="p-4 text-white/60 text-sm">Requirements</td>
                        {ALL_TIERS.map((tier) => {
                            const isCurrent = tier === currentTier;
                            const colors = tierColors[tier];
                            return (
                                <td
                                    key={tier}
                                    data-testid={`requirement-${tier}`}
                                    className={cn(
                                        "p-4 text-center text-sm text-white/70",
                                        isCurrent && colors.bg
                                    )}
                                >
                                    {getTierRequirement(tier)}
                                </td>
                            );
                        })}
                    </tr>

                    {/* Benefit Rows */}
                    {BENEFIT_ROWS.map((benefit) => (
                        <tr
                            key={benefit.id}
                            data-testid={`benefit-row-${benefit.id}`}
                            className="border-t border-white/5"
                        >
                            <td className="p-4 text-white/60 text-sm">{benefit.label}</td>
                            {ALL_TIERS.map((tier) => {
                                const hasBenefit = tierHasBenefit(tier, benefit);
                                const isCurrent = tier === currentTier;
                                const colors = tierColors[tier];
                                return (
                                    <td
                                        key={tier}
                                        data-testid={`benefit-cell-${tier}`}
                                        data-has-benefit={hasBenefit ? "true" : "false"}
                                        className={cn(
                                            "p-4 text-center",
                                            isCurrent && colors.bg
                                        )}
                                    >
                                        {hasBenefit ? (
                                            <Check
                                                data-testid="benefit-check"
                                                className="w-5 h-5 text-emerald-400 mx-auto"
                                            />
                                        ) : (
                                            <X
                                                data-testid="benefit-unavailable"
                                                className="w-5 h-5 text-white/20 mx-auto"
                                            />
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}
