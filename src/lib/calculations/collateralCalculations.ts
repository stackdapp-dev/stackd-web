/**
 * Collateral Calculations
 * 
 * Pure functions for calculating collateral breakdown and withdrawal limits.
 * Used to determine how much BTC can be safely withdrawn without under-collateralizing loans.
 */

export interface CollateralBreakdown {
    /** Total WBTC collateral (wallet + Compound) */
    totalCollateralBtc: number;
    /** Total collateral in USD */
    totalCollateralUsd: number;
    /** WBTC locked backing active loans (cannot withdraw) */
    lockedCollateralBtc: number;
    /** Locked collateral in USD */
    lockedCollateralUsd: number;
    /** WBTC available to withdraw without under-collateralizing */
    availableToWithdrawBtc: number;
    /** Available to withdraw in USD */
    availableToWithdrawUsd: number;
    /** Health factor: >1 is safe, <1 is at liquidation risk */
    healthFactor: number;
}

/**
 * Calculate the maximum amount of BTC that can be withdrawn without under-collateralizing.
 * 
 * Formula:
 *   minCollateralRequired = totalBorrowedUsd / maxLtv
 *   maxWithdrawableUsd = totalCollateralUsd - minCollateralRequired
 *   maxWithdrawableBtc = maxWithdrawableUsd / btcPrice
 * 
 * @param totalCollateralBtc - Total BTC available as collateral
 * @param totalBorrowedUsd - Total USD value of borrowed assets
 * @param btcPrice - Current BTC price in USD
 * @param maxLtv - Maximum loan-to-value ratio (e.g., 0.70 for 70%)
 * @returns Maximum BTC that can be withdrawn
 */
export function calculateMaxWithdrawable(
    totalCollateralBtc: number,
    totalBorrowedUsd: number,
    btcPrice: number,
    maxLtv: number
): number {
    // Handle edge cases
    if (totalCollateralBtc <= 0 || btcPrice <= 0) {
        return 0;
    }

    // Treat negative borrowed as 0 (no debt)
    const effectiveBorrowed = Math.max(0, totalBorrowedUsd);

    // If no debt, all collateral is available
    if (effectiveBorrowed === 0) {
        return totalCollateralBtc;
    }

    // If max LTV is 0 or less, can't borrow so all collateral is available (edge case)
    if (maxLtv <= 0) {
        return totalCollateralBtc;
    }

    const totalCollateralUsd = totalCollateralBtc * btcPrice;

    // Calculate minimum collateral required to maintain max LTV
    // Formula: minCollateral = borrowed / maxLtv
    const minCollateralRequiredUsd = effectiveBorrowed / maxLtv;

    // Calculate max withdrawable
    const maxWithdrawableUsd = totalCollateralUsd - minCollateralRequiredUsd;

    // If underwater (need more collateral than we have), can't withdraw anything
    if (maxWithdrawableUsd <= 0) {
        return 0;
    }

    // Convert back to BTC
    const maxWithdrawableBtc = maxWithdrawableUsd / btcPrice;

    // Return with precision handling
    return Math.max(0, maxWithdrawableBtc);
}

/**
 * Calculate a full breakdown of collateral state.
 * 
 * @param walletWbtcBalance - WBTC in user's wallet (not yet deposited)
 * @param compoundWbtcBalance - WBTC supplied to Compound protocol
 * @param totalBorrowedUsd - Total USD value of borrowed assets
 * @param btcPrice - Current BTC price in USD
 * @param maxLtv - Maximum loan-to-value ratio (e.g., 0.70 for 70%)
 * @returns Complete collateral breakdown
 */
export function calculateCollateralBreakdown(
    walletWbtcBalance: number,
    compoundWbtcBalance: number,
    totalBorrowedUsd: number,
    btcPrice: number,
    maxLtv: number
): CollateralBreakdown {
    // Handle edge cases
    const safeWallet = Math.max(0, walletWbtcBalance);
    const safeCompound = Math.max(0, compoundWbtcBalance);
    const safeBorrowed = Math.max(0, totalBorrowedUsd);
    const safePrice = Math.max(0, btcPrice);
    const safeLtv = Math.max(0, Math.min(1, maxLtv));

    // Calculate totals
    const totalCollateralBtc = safeWallet + safeCompound;
    const totalCollateralUsd = totalCollateralBtc * safePrice;

    // Calculate locked collateral (minimum required to back loans)
    let lockedCollateralUsd = 0;
    if (safeBorrowed > 0 && safeLtv > 0) {
        lockedCollateralUsd = safeBorrowed / safeLtv;
    }

    // Cap locked at total collateral
    lockedCollateralUsd = Math.min(lockedCollateralUsd, totalCollateralUsd);
    const lockedCollateralBtc = safePrice > 0 ? lockedCollateralUsd / safePrice : 0;

    // Calculate available
    const availableToWithdrawUsd = Math.max(0, totalCollateralUsd - lockedCollateralUsd);
    const availableToWithdrawBtc = safePrice > 0 ? availableToWithdrawUsd / safePrice : 0;

    // Calculate health factor
    // Health = (collateral * maxLTV) / borrowed
    // If no borrowed, health is infinite (represented as large number)
    let healthFactor: number;
    if (safeBorrowed === 0) {
        healthFactor = totalCollateralBtc > 0 ? 1000 : 0; // Infinite health if collateral exists
    } else {
        healthFactor = (totalCollateralUsd * safeLtv) / safeBorrowed;
    }

    return {
        totalCollateralBtc,
        totalCollateralUsd,
        lockedCollateralBtc,
        lockedCollateralUsd,
        availableToWithdrawBtc,
        availableToWithdrawUsd,
        healthFactor,
    };
}

/**
 * Check if a specific withdrawal amount is allowed.
 * 
 * @param withdrawAmountBtc - Amount of BTC to withdraw
 * @param breakdown - Current collateral breakdown
 * @returns Object indicating if withdrawal is allowed and reason if not
 */
export function canWithdrawAmount(
    withdrawAmountBtc: number,
    breakdown: CollateralBreakdown
): { allowed: boolean; reason?: string } {
    // Validate input
    if (withdrawAmountBtc < 0) {
        return {
            allowed: false,
            reason: "Invalid withdrawal amount: cannot be negative",
        };
    }

    // Zero withdrawal is always allowed
    if (withdrawAmountBtc === 0) {
        return { allowed: true };
    }

    // Check if withdrawal would exceed available
    // Use small epsilon for floating point comparison
    const epsilon = 0.00000001;
    if (withdrawAmountBtc > breakdown.availableToWithdrawBtc + epsilon) {
        return {
            allowed: false,
            reason: `Withdrawal would under-collateralize your loan. Maximum withdrawable: ${breakdown.availableToWithdrawBtc.toFixed(8)} BTC`,
        };
    }

    return { allowed: true };
}
