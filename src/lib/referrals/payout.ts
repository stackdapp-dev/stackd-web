/**
 * Referral payout calculation logic
 * 
 * Payout Formula:
 * - L1: loanBalance × 0.5% / 12
 * - L2: loanBalance × 0.1% / 12
 * - L3: loanBalance × 0.1% / 12
 * - Proration: effectiveBalance = loanBalance × (daysActive / 30)
 */

import { getUserTier, canWithdrawEarnings } from "./tiers";

// Earnings rates per level (annual, divided by 12 for monthly)
export const EARNINGS_RATES = {
    L1: 0.005,  // 0.5% APY
    L2: 0.001,  // 0.1% APY
    L3: 0.001,  // 0.1% APY
} as const;

export interface RefereeData {
    userId: string;
    level: 1 | 2 | 3;
    loanBalance: number;
    daysActive: number;
}

export interface UserNetworkData {
    personalLoan: number;
    daysActive: number;
    referees: RefereeData[];
}

export type ReferralNetwork = Record<string, UserNetworkData>;

// Mock data store for testing
let mockData: ReferralNetwork = {};

export function setMockData(data: ReferralNetwork): void {
    mockData = data;
}

export function clearMockData(): void {
    mockData = {};
}

/**
 * Get user's network data (from mock for now, will be DB later)
 */
function getUserNetworkData(userId: string): UserNetworkData | null {
    return mockData[userId] ?? null;
}

/**
 * Calculate effective loan balance with proration
 */
function getEffectiveBalance(loanBalance: number, daysActive: number): number {
    return loanBalance * (daysActive / 30);
}

/**
 * Calculate monthly payout for a user based on their network
 * 
 * @param userId - The user to calculate payout for
 * @returns Monthly payout amount in USD
 */
export function calculateMonthlyPayout(userId: string): number {
    const userData = getUserNetworkData(userId);
    if (!userData || userData.referees.length === 0) {
        return 0;
    }

    let totalPayout = 0;

    for (const referee of userData.referees) {
        // Calculate effective balance with proration
        const effectiveBalance = getEffectiveBalance(
            referee.loanBalance,
            referee.daysActive
        );

        // Get rate based on level
        const rate = EARNINGS_RATES[`L${referee.level}` as keyof typeof EARNINGS_RATES];

        // Calculate monthly earnings: (balance × rate) / 12
        const monthlyEarnings = (effectiveBalance * rate) / 12;

        totalPayout += monthlyEarnings;
    }

    return totalPayout;
}

/**
 * Get total accrued earnings for a user (regardless of tier)
 * This is the total they have earned, even if locked
 */
export function getAccruedEarnings(userId: string): number {
    return calculateMonthlyPayout(userId);
}

/**
 * Get withdrawable balance for a user
 * Returns 0 if user is Bronze tier (earnings locked)
 */
export function getWithdrawableBalance(userId: string): number {
    const userData = getUserNetworkData(userId);
    if (!userData) return 0;

    // Calculate network volume
    const networkVolume = userData.referees.reduce(
        (sum, ref) => sum + ref.loanBalance,
        0
    );

    // Get user tier
    const tier = getUserTier({
        personalLoanBalance: userData.personalLoan,
        networkVolume,
    });

    // Bronze tier cannot withdraw
    if (!canWithdrawEarnings(tier)) {
        return 0;
    }

    return calculateMonthlyPayout(userId);
}

/**
 * Calculate total network volume for a user
 */
export function getNetworkVolume(userId: string): number {
    const userData = getUserNetworkData(userId);
    if (!userData) return 0;

    return userData.referees.reduce(
        (sum, ref) => sum + ref.loanBalance,
        0
    );
}
