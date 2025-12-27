/**
 * Tier calculation logic for referral rewards
 * 
 * Tiers are based on:
 * - Personal loan balance (for Silver)
 * - Network volume (for Gold, Platinum, Black)
 */

export type UserTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'BLACK';

export const TIER_THRESHOLDS = {
    SILVER: 500,      // Personal loan >= $500
    GOLD: 5000,       // Network volume >= $5,000
    PLATINUM: 10000,  // Network volume >= $10,000
    BLACK: 50000,     // Network volume >= $50,000
} as const;

export interface TierInput {
    personalLoanBalance: number;
    networkVolume: number;
}

/**
 * Calculate user tier based on personal loan and network volume
 * 
 * Tier priority (with Silver Gate):
 * 1. Must have personal loan >= $500 to unlock network tiers
 * 2. BLACK: Network volume >= $50,000 (requires Silver)
 * 3. PLATINUM: Network volume >= $10,000 (requires Silver)
 * 4. GOLD: Network volume >= $5,000 (requires Silver)
 * 5. SILVER: Personal loan >= $500
 * 6. BRONZE: Default
 */
export function getUserTier(input: TierInput): UserTier {
    const { personalLoanBalance, networkVolume } = input;

    // Must have Silver status (personal loan >= $500) to unlock network tiers
    const hasSilverStatus = personalLoanBalance >= TIER_THRESHOLDS.SILVER;

    if (hasSilverStatus) {
        // Check network volume tiers (highest to lowest)
        if (networkVolume >= TIER_THRESHOLDS.BLACK) {
            return 'BLACK';
        }
        if (networkVolume >= TIER_THRESHOLDS.PLATINUM) {
            return 'PLATINUM';
        }
        if (networkVolume >= TIER_THRESHOLDS.GOLD) {
            return 'GOLD';
        }
        // Has Silver but not enough network for Gold+
        return 'SILVER';
    }

    // Default to Bronze (no personal loan or under threshold)
    return 'BRONZE';
}

/**
 * Get tier display name (for UI)
 */
export function getTierDisplayName(tier: UserTier): string {
    return tier.charAt(0) + tier.slice(1).toLowerCase();
}

/**
 * Check if user can withdraw earnings (Silver+ required)
 */
export function canWithdrawEarnings(tier: UserTier): boolean {
    return tier !== 'BRONZE';
}

/**
 * Get tier benefits description
 */
export function getTierBenefits(tier: UserTier): string {
    switch (tier) {
        case 'BRONZE':
            return 'Base earnings (0.5%/0.1%/0.1%)';
        case 'SILVER':
            return 'Payouts unlocked';
        case 'GOLD':
            return '+5% APY boost';
        case 'PLATINUM':
            return 'Priority support';
        case 'BLACK':
            return 'Metal Visa card';
    }
}
