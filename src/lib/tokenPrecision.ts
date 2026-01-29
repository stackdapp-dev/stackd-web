/**
 * Token Precision Utilities
 *
 * These utilities handle pre-emptive rounding of token amounts to avoid
 * "Arithmetic overflow or underflow" errors from smart contracts.
 *
 * Key insight: WBTC (8 decimals) causes overflow when high-precision amounts
 * are passed through Compound's internal scaling operations. Pre-emptively
 * rounding to a safe precision prevents failed transactions.
 *
 * The approach:
 * - For 8-decimal tokens (WBTC): Round to 5 decimals
 * - For 6-decimal tokens (USDT, XAUT): Round to 4 decimals
 * - For 18-decimal tokens (ETH): Round to 14 decimals
 *
 * This preserves more precision than the old 3-decimal workaround while
 * still avoiding overflow errors.
 */

/**
 * Gets the safe number of decimal places for a token based on its decimals.
 *
 * The buffer is calculated to leave room for internal smart contract
 * calculations that may multiply or scale the amount.
 *
 * @param tokenDecimals - The number of decimals the token supports
 * @returns The safe number of decimal places to use
 */
export function getSafeDecimals(tokenDecimals: number): number {
    if (tokenDecimals <= 0) return 0;
    if (tokenDecimals <= 1) return 1;
    if (tokenDecimals <= 3) return 2;

    // For higher decimal tokens, use a graduated buffer
    // - 6 decimals: use 4 (buffer of 2)
    // - 8 decimals: use 5 (buffer of 3)
    // - 18 decimals: use 14 (buffer of 4)
    if (tokenDecimals <= 6) {
        return tokenDecimals - 2;
    } else if (tokenDecimals <= 10) {
        return tokenDecimals - 3;
    } else {
        return tokenDecimals - 4;
    }
}

/**
 * Rounds an amount down to the safe precision for a given token.
 *
 * Uses Math.floor to ensure we never send more than intended (which could
 * cause insufficient balance errors).
 *
 * @param amount - The amount to round
 * @param tokenDecimals - The number of decimals the token supports
 * @returns The amount rounded down to safe precision
 */
export function roundAmountForTransaction(amount: number, tokenDecimals: number): number {
    if (amount === 0) return 0;

    const safeDecimals = getSafeDecimals(tokenDecimals);
    const factor = Math.pow(10, safeDecimals);

    // Use floor for positive numbers, ceil for negative (round towards zero)
    if (amount >= 0) {
        return Math.floor(amount * factor) / factor;
    } else {
        return Math.ceil(amount * factor) / factor;
    }
}

/**
 * Determines if a token should have precision rounding applied.
 *
 * Currently, we apply rounding to all tokens as a safety measure.
 * This can be refined in the future if certain tokens are known
 * to not have overflow issues.
 *
 * @param tokenSymbol - The symbol of the token (e.g., "WBTC", "USDT")
 * @returns Whether precision rounding should be applied
 */
export function shouldApplyPrecisionRounding(tokenSymbol: string): boolean {
    // Apply rounding to all tokens as a safety measure
    // Known problematic tokens: WBTC (8 decimals with Compound scaling)
    // But we apply to all to be safe
    return true;
}

/**
 * Checks if an error message indicates arithmetic overflow/underflow.
 * Useful for detecting when the old retry mechanism needs to trigger.
 *
 * @param errorMessage - The error message to check
 * @returns Whether the error is an arithmetic overflow/underflow
 */
export function isArithmeticOverflowError(errorMessage: string): boolean {
    const lowerCaseError = errorMessage.toLowerCase();
    return (
        lowerCaseError.includes("arithmetic") &&
        (lowerCaseError.includes("overflow") || lowerCaseError.includes("underflow"))
    );
}
