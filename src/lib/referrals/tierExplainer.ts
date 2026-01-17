/**
 * Helper functions for the tier explainer page
 * Provides tier requirements, benefits, and advancement logic
 */

import { UserTier, TIER_THRESHOLDS, TierInput } from './tiers';

// All tiers in order from lowest to highest
const TIER_ORDER: UserTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'BLACK'];

export interface TierRequirements {
    tier: UserTier;
    description: string;
    personalLoanRequired: number;
    networkVolumeRequired: number;
    requiresSilver: boolean;
    formattedRequirement: string;
}

export interface TierBenefit {
    name: string;
    description: string;
    inherited: boolean;
}

// Tier-specific benefits (not inherited)
const TIER_SPECIFIC_BENEFITS: Record<UserTier, TierBenefit[]> = {
    BRONZE: [
        {
            name: 'Earnings locked',
            description: 'Upgrade to Silver to start earning referral rewards',
            inherited: false,
        },
        {
            name: 'Track referral network',
            description: 'View your referral tree and stats',
            inherited: false,
        },
    ],
    SILVER: [
        {
            name: 'Payouts unlocked',
            description: 'Withdraw earnings to your wallet anytime',
            inherited: false,
        },
        {
            name: 'Withdraw earnings',
            description: 'Access your referral rewards',
            inherited: false,
        },
    ],
    GOLD: [
        {
            name: '+5% APY boost',
            description: 'Enhanced yield on your holdings',
            inherited: false,
        },
    ],
    PLATINUM: [
        {
            name: 'Priority support',
            description: 'Dedicated customer service queue',
            inherited: false,
        },
    ],
    BLACK: [
        {
            name: 'Metal Visa card',
            description: 'Exclusive physical card with premium benefits',
            inherited: false,
        },
        {
            name: 'Exclusive events',
            description: 'Access to VIP events and experiences',
            inherited: false,
        },
    ],
};

/**
 * Format a number as currency string
 */
function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString()}`;
}

/**
 * Get the requirements for a specific tier
 */
export function getTierRequirements(tier: UserTier): TierRequirements {
    switch (tier) {
        case 'BRONZE':
            return {
                tier: 'BRONZE',
                description: 'Starting tier - available to all users',
                personalLoanRequired: 0,
                networkVolumeRequired: 0,
                requiresSilver: false,
                formattedRequirement: 'None',
            };
        case 'SILVER':
            return {
                tier: 'SILVER',
                description: 'Personal loan of at least $500',
                personalLoanRequired: TIER_THRESHOLDS.SILVER,
                networkVolumeRequired: 0,
                requiresSilver: false,
                formattedRequirement: formatCurrency(TIER_THRESHOLDS.SILVER),
            };
        case 'GOLD':
            return {
                tier: 'GOLD',
                description: 'Network volume of at least $5,000',
                personalLoanRequired: TIER_THRESHOLDS.SILVER,
                networkVolumeRequired: TIER_THRESHOLDS.GOLD,
                requiresSilver: true,
                formattedRequirement: formatCurrency(TIER_THRESHOLDS.GOLD),
            };
        case 'PLATINUM':
            return {
                tier: 'PLATINUM',
                description: 'Network volume of at least $10,000',
                personalLoanRequired: TIER_THRESHOLDS.SILVER,
                networkVolumeRequired: TIER_THRESHOLDS.PLATINUM,
                requiresSilver: true,
                formattedRequirement: formatCurrency(TIER_THRESHOLDS.PLATINUM),
            };
        case 'BLACK':
            return {
                tier: 'BLACK',
                description: 'Network volume of at least $50,000',
                personalLoanRequired: TIER_THRESHOLDS.SILVER,
                networkVolumeRequired: TIER_THRESHOLDS.BLACK,
                requiresSilver: true,
                formattedRequirement: formatCurrency(TIER_THRESHOLDS.BLACK),
            };
    }
}

/**
 * Get the full benefits list for a tier, including inherited benefits
 */
export function getTierBenefitsList(tier: UserTier): TierBenefit[] {
    const tierIndex = TIER_ORDER.indexOf(tier);
    const benefits: TierBenefit[] = [];

    // Add tier-specific benefits (not inherited)
    benefits.push(...TIER_SPECIFIC_BENEFITS[tier]);

    // Add inherited benefits from lower tiers
    for (let i = 0; i < tierIndex; i++) {
        const lowerTier = TIER_ORDER[i];
        const inheritedBenefits = TIER_SPECIFIC_BENEFITS[lowerTier].map((benefit) => ({
            ...benefit,
            inherited: true,
        }));
        benefits.push(...inheritedBenefits);
    }

    return benefits;
}

/**
 * Get the next tier to advance to, or null if already at max tier
 */
export function getNextTier(currentTier: UserTier): UserTier | null {
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    if (currentIndex === TIER_ORDER.length - 1) {
        return null; // Already at max tier (BLACK)
    }
    return TIER_ORDER[currentIndex + 1];
}

/**
 * Check if a user can advance to a specific tier based on their data
 */
export function canAdvanceToTier(tier: UserTier, userData: TierInput): boolean {
    const requirements = getTierRequirements(tier);

    // BRONZE is always achievable
    if (tier === 'BRONZE') {
        return true;
    }

    // Check personal loan requirement (for SILVER and as a gate for higher tiers)
    if (userData.personalLoanBalance < requirements.personalLoanRequired) {
        return false;
    }

    // Check network volume requirement (for GOLD, PLATINUM, BLACK)
    if (userData.networkVolume < requirements.networkVolumeRequired) {
        return false;
    }

    return true;
}
