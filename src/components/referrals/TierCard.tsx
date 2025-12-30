"use client";

import { Trophy, Crown, CreditCard, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/card";
import { UserTier, getTierDisplayName } from "@/lib/referrals/tiers";
import { getTierRequirements, getTierBenefitsList } from "@/lib/referrals/tierExplainer";

export interface TierCardProps {
    tier: UserTier;
    isCurrent: boolean;
    isUnlocked: boolean;
}

// Tier color styles
const tierColors: Record<UserTier, { bg: string; border: string; text: string; iconBg: string }> = {
    BRONZE: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-400",
        iconBg: "bg-orange-500/10",
    },
    SILVER: {
        bg: "bg-gray-400/10",
        border: "border-gray-400/20",
        text: "text-gray-300",
        iconBg: "bg-gray-400/10",
    },
    GOLD: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        text: "text-yellow-400",
        iconBg: "bg-yellow-500/10",
    },
    PLATINUM: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-400",
        iconBg: "bg-purple-500/10",
    },
    BLACK: {
        bg: "bg-slate-800/50",
        border: "border-slate-600/30",
        text: "text-slate-200",
        iconBg: "bg-slate-700/50",
    },
};

// Get icon component based on tier
function getTierIcon(tier: UserTier) {
    switch (tier) {
        case 'PLATINUM':
            return Crown;
        case 'BLACK':
            return CreditCard;
        default:
            return Trophy;
    }
}

// Get icon data attribute for testing
function getTierIconType(tier: UserTier): string {
    switch (tier) {
        case 'PLATINUM':
            return 'crown';
        case 'BLACK':
            return 'credit-card';
        default:
            return 'trophy';
    }
}

export function TierCard({ tier, isCurrent, isUnlocked }: TierCardProps) {
    const colors = tierColors[tier];
    const requirements = getTierRequirements(tier);
    const benefits = getTierBenefitsList(tier);
    const IconComponent = getTierIcon(tier);

    // Determine status
    const isLocked = !isCurrent && !isUnlocked;

    // Get status text
    const getStatusText = () => {
        if (isCurrent) return "Current";
        if (isUnlocked) return "Unlocked";
        return "Locked";
    };

    return (
        <Card
            appearance="glassDark"
            data-testid={`tier-card-${tier}`}
            data-current={isCurrent ? "true" : undefined}
            className={cn(
                "relative overflow-hidden transition-all duration-300",
                colors.border,
                isCurrent && "ring-2 ring-amber-500/50",
                isLocked && "opacity-50"
            )}
        >
            {/* Current badge */}
            {isCurrent && (
                <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full border border-amber-500/30">
                    Current
                </div>
            )}

            {/* Header with icon and name */}
            <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", colors.iconBg)}>
                    <IconComponent
                        className={cn("w-6 h-6", colors.text)}
                        data-testid="tier-icon"
                        data-icon={getTierIconType(tier)}
                    />
                </div>
                <div>
                    <h3 className={cn("text-lg font-medium", colors.text)}>
                        {getTierDisplayName(tier)}
                    </h3>
                    <div data-testid="tier-status" className="flex items-center gap-1 text-xs text-white/50">
                        {isLocked ? (
                            <>
                                <Lock className="w-3 h-3" data-testid="lock-icon" />
                                {getStatusText()}
                            </>
                        ) : isUnlocked && !isCurrent ? (
                            <>
                                <Check className="w-3 h-3 text-emerald-400" data-testid="check-icon" />
                                {getStatusText()}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Requirements */}
            <div className="mb-4" data-testid="tier-requirements">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Requirements</p>
                <div className="space-y-1 text-sm text-white/70">
                    {tier === 'BRONZE' ? (
                        <p>Starting tier - no requirements</p>
                    ) : tier === 'SILVER' ? (
                        <p>Personal loan of at least $500</p>
                    ) : (
                        <>
                            <p>Network volume of at least {requirements.formattedRequirement}</p>
                            <p className="text-white/40 text-xs">Requires Silver status</p>
                        </>
                    )}
                </div>
            </div>

            {/* Benefits */}
            <div data-testid="tier-benefits">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Benefits</p>
                <ul className="space-y-1.5">
                    {benefits.filter(b => !b.inherited).map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className={cn("w-4 h-4 mt-0.5 shrink-0", colors.text)} />
                            <span className="text-white/80">{benefit.name}</span>
                        </li>
                    ))}
                    {/* Show inherited benefits summary for higher tiers */}
                    {tier !== 'BRONZE' && (
                        <li className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                            <span className="text-white/50">
                                All {getTierDisplayName(getPreviousTier(tier))} benefits
                            </span>
                        </li>
                    )}
                </ul>
            </div>
        </Card>
    );
}

// Helper to get previous tier for "All X benefits" text
function getPreviousTier(tier: UserTier): UserTier {
    const tierOrder: UserTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'BLACK'];
    const index = tierOrder.indexOf(tier);
    return tierOrder[Math.max(0, index - 1)];
}
