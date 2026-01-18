/**
 * Rewards Simulator calculation logic
 * 
 * Simulates potential earnings from referral network based on:
 * - Number of direct referrals (L1)
 * - Average referrals per friend (determines L2 count)
 * - Average USDT loan position per referral
 * - Time period (0-12 months)
 * - User tier (affects earning rates)
 * 
 * Note: These are SIMULATED projections using simplified rates.
 * Actual earnings may vary based on:
 * - When referrals join
 * - Actual loan balances
 * - Proration for partial months
 * - User tier (Bronze users don't earn - enforced at payout time)
 */

import { UserTier } from './tiers';

/**
 * Annual earning rates (APY) - converted to monthly for calculation
 * These rates match the payout.ts implementation:
 * 
 * - L1 (Direct): 0.5% APY → 0.5% / 12 = 0.04167% per month
 * - L2 (Friend's referrals): 0.1% APY → 0.1% / 12 = 0.00833% per month
 */
export const SIMULATOR_RATES = {
    L1: 0.005 / 12,  // 0.5% APY / 12 = monthly rate for L1 referrals
    L2: 0.001 / 12,  // 0.1% APY / 12 = monthly rate for L2 referrals
} as const;

/**
 * Tier-based rate multipliers
 * Higher tiers earn more from their network
 */
export const TIER_MULTIPLIERS: Record<UserTier, number> = {
    BRONZE: 0,      // Bronze users don't earn
    SILVER: 1,      // Base rate
    GOLD: 1,        // Same as Silver (future: could add bonus)
    PLATINUM: 1,    // Same as Silver (future: could add bonus)
    BLACK: 1,       // Same as Silver (future: could add bonus)
} as const;

export interface SimulatorInput {
    directReferrals: number;       // L1 count
    avgReferralsPerFriend: number; // How many each L1 brings (L2 multiplier)
    avgLoanPosition: number;       // USDT per referral
    timePeriodMonths: number;      // 0-12 slider value
    tier?: UserTier;               // User tier (defaults to SILVER for backwards compatibility)
}

export interface SimulatorOutput {
    totalNetwork: number;          // L1 + L2 count
    perMonth: number;              // Monthly earnings (USDT)
    estimatedEarnings: number;     // Total over time period (USDT)
    l1Earnings: number;            // L1 breakdown over time period
    l2Earnings: number;            // L2 breakdown over time period
}

/**
 * Calculate simulated rewards based on referral network inputs
 * 
 * Formula:
 * - L1 count = directReferrals
 * - L2 count = directReferrals × avgReferralsPerFriend
 * - L1 monthly = L1 count × avgLoanPosition × L1 rate
 * - L2 monthly = L2 count × avgLoanPosition × L2 rate
 * - Total monthly = L1 monthly + L2 monthly
 * - Estimated = Total monthly × timePeriodMonths
 */
export function calculateRewardsSimulation(input: SimulatorInput): SimulatorOutput {
    const {
        directReferrals,
        avgReferralsPerFriend,
        avgLoanPosition,
        timePeriodMonths,
        tier = 'SILVER', // Default to SILVER if not provided
    } = input;

    // Get tier multiplier
    const tierMultiplier = TIER_MULTIPLIERS[tier];

    // Calculate network counts
    const l1Count = directReferrals;
    const l2Count = directReferrals * avgReferralsPerFriend;
    const totalNetwork = l1Count + l2Count;

    // Handle zero cases (including Bronze tier which earns nothing)
    if (totalNetwork === 0 || avgLoanPosition === 0 || timePeriodMonths === 0 || tierMultiplier === 0) {
        return {
            totalNetwork,
            perMonth: 0,
            estimatedEarnings: 0,
            l1Earnings: 0,
            l2Earnings: 0,
        };
    }

    // Calculate monthly earnings with tier multiplier
    const l1Monthly = l1Count * avgLoanPosition * SIMULATOR_RATES.L1 * tierMultiplier;
    const l2Monthly = l2Count * avgLoanPosition * SIMULATOR_RATES.L2 * tierMultiplier;
    const perMonth = l1Monthly + l2Monthly;

    // Calculate total over time period
    const l1Earnings = l1Monthly * timePeriodMonths;
    const l2Earnings = l2Monthly * timePeriodMonths;
    const estimatedEarnings = l1Earnings + l2Earnings;

    return {
        totalNetwork,
        perMonth,
        estimatedEarnings,
        l1Earnings,
        l2Earnings,
    };
}

/**
 * Format currency for display
 */
export function formatSimulatorCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
