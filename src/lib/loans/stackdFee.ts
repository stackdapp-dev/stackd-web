/**
 * Stack'd Fee Calculator
 *
 * Stack'd charges a 1.5% additional APR on top of the underlying lending market rate.
 * This fee is calculated and charged during loan repayment events.
 *
 * Fee Distribution:
 * - Total Stack'd Fee: 1.5% APR
 * - Referral Rewards Pool: 0.7% APR (L1: 0.5%, L2: 0.1%, L3: 0.1%)
 * - Stack'd Revenue: 0.8% APR
 */

// Constants
export const STACKD_ADDITIONAL_APR = 1.5; // 1.5% APR on top of market rate
export const REFERRAL_POOL_APR = 0.7; // 0.7% goes to referral rewards
export const STACKD_REVENUE_APR = 0.8; // 0.8% Stack'd revenue

// Blockchain constants (approximate)
export const BLOCKS_PER_DAY_ARBITRUM = 7200; // ~12 second blocks
export const BLOCKS_PER_YEAR = BLOCKS_PER_DAY_ARBITRUM * 365;
export const DAYS_PER_YEAR = 365;

export interface StackdFeeBreakdown {
    principal: number;
    durationDays: number;
    marketApr: number;
    stackdApr: number;
    totalApr: number;
    marketInterest: number;
    stackdFee: number;
    totalInterest: number;
    referralPool: number;
    stackdRevenue: number;
}

export interface InterestBreakdown {
    marketInterest: number;
    stackdFee: number;
    totalInterest: number;
    totalApr: number;
}

/**
 * Calculate the total APR including Stack'd fee
 * @param marketApr - The underlying lending market APR (e.g., 3.5 for 3.5%)
 * @returns Total APR (market + Stack'd fee)
 */
export function getTotalApr(marketApr: number): number {
    if (marketApr < 0) return STACKD_ADDITIONAL_APR;
    return marketApr + STACKD_ADDITIONAL_APR;
}

/**
 * Calculate interest breakdown for a given principal and APR
 * @param principal - Loan amount in USD
 * @param marketApr - Market APR as percentage (e.g., 3.5 for 3.5%)
 * @returns Interest breakdown with market, Stack'd fee, and total
 */
export function calculateInterestBreakdown(
    principal: number,
    marketApr: number
): InterestBreakdown {
    if (principal <= 0 || marketApr < 0) {
        return {
            marketInterest: 0,
            stackdFee: 0,
            totalInterest: 0,
            totalApr: STACKD_ADDITIONAL_APR,
        };
    }

    const marketInterest = principal * (marketApr / 100);
    const stackdFee = principal * (STACKD_ADDITIONAL_APR / 100);

    return {
        marketInterest,
        stackdFee,
        totalInterest: marketInterest + stackdFee,
        totalApr: marketApr + STACKD_ADDITIONAL_APR,
    };
}

/**
 * Calculate Stack'd fee for a given principal and time period
 * @param principal - Loan amount in USD
 * @param durationDays - Loan duration in days
 * @param marketApr - Market APR as percentage (e.g., 3.5 for 3.5%)
 * @returns Complete fee breakdown
 */
export function calculateStackdFee(
    principal: number,
    durationDays: number,
    marketApr: number
): StackdFeeBreakdown {
    if (principal <= 0 || durationDays <= 0) {
        return {
            principal,
            durationDays,
            marketApr,
            stackdApr: STACKD_ADDITIONAL_APR,
            totalApr: marketApr + STACKD_ADDITIONAL_APR,
            marketInterest: 0,
            stackdFee: 0,
            totalInterest: 0,
            referralPool: 0,
            stackdRevenue: 0,
        };
    }

    const yearFraction = durationDays / DAYS_PER_YEAR;

    // Calculate prorated interest
    const marketInterest = principal * (marketApr / 100) * yearFraction;
    const stackdFee = principal * (STACKD_ADDITIONAL_APR / 100) * yearFraction;
    const totalInterest = marketInterest + stackdFee;

    // Calculate fee distribution
    const referralPool = principal * (REFERRAL_POOL_APR / 100) * yearFraction;
    const stackdRevenue = principal * (STACKD_REVENUE_APR / 100) * yearFraction;

    return {
        principal,
        durationDays,
        marketApr,
        stackdApr: STACKD_ADDITIONAL_APR,
        totalApr: marketApr + STACKD_ADDITIONAL_APR,
        marketInterest,
        stackdFee,
        totalInterest,
        referralPool,
        stackdRevenue,
    };
}

/**
 * Calculate per-block fee accrual
 * @param principal - Loan amount in USD
 * @param blocksElapsed - Number of blocks since loan start
 * @returns Stack'd fee accrued for the given number of blocks
 */
export function calculatePerBlockFee(
    principal: number,
    blocksElapsed: number
): number {
    if (principal <= 0 || blocksElapsed <= 0) return 0;

    // APR per block = APR / blocks per year
    const aprPerBlock = STACKD_ADDITIONAL_APR / 100 / BLOCKS_PER_YEAR;

    return principal * aprPerBlock * blocksElapsed;
}

/**
 * Calculate monthly Stack'd fee (for UI display)
 * @param principal - Loan amount in USD
 * @returns Monthly Stack'd fee
 */
export function calculateMonthlyStackdFee(principal: number): number {
    if (principal <= 0) return 0;
    return (principal * (STACKD_ADDITIONAL_APR / 100)) / 12;
}

/**
 * Calculate yearly Stack'd fee (for UI display)
 * @param principal - Loan amount in USD
 * @returns Yearly Stack'd fee
 */
export function calculateYearlyStackdFee(principal: number): number {
    if (principal <= 0) return 0;
    return principal * (STACKD_ADDITIONAL_APR / 100);
}

/**
 * Calculate referral pool allocation from Stack'd fee
 * @param stackdFee - The Stack'd fee amount
 * @returns Amount allocated to referral rewards
 */
export function calculateReferralPoolFromFee(stackdFee: number): number {
    if (stackdFee <= 0) return 0;
    // Referral pool is 0.7% out of 1.5% = 46.67% of the fee
    return stackdFee * (REFERRAL_POOL_APR / STACKD_ADDITIONAL_APR);
}

/**
 * Calculate Stack'd revenue from fee (after referral payouts)
 * @param stackdFee - The Stack'd fee amount
 * @returns Amount retained by Stack'd as revenue
 */
export function calculateStackdRevenueFromFee(stackdFee: number): number {
    if (stackdFee <= 0) return 0;
    // Stack'd revenue is 0.8% out of 1.5% = 53.33% of the fee
    return stackdFee * (STACKD_REVENUE_APR / STACKD_ADDITIONAL_APR);
}
