/**
 * Total Collateral USD Calculation
 *
 * Calculates the total collateral value across all assets and protocols.
 * This includes:
 * - WBTC: wallet balance + Compound collateral
 * - XAUT: wallet balance + Fluid collateral
 *
 * Bug fix: Previously only Fluid-supplied XAUT was counted, missing wallet XAUT.
 */

export interface TotalCollateralInputs {
    /** Total WBTC value in USD (from useCollateralBreakdown - already includes wallet + Compound) */
    wbtcTotalUsd: number;
    /** XAUT balance in wallet (not yet deposited to Fluid) */
    xautWalletBalance: number;
    /** XAUT supplied to Fluid in USD (from useFluid.suppliedAssets) */
    xautSuppliedUsd: number;
    /** Current XAUT price in USD (for converting wallet balance to USD) */
    xautPrice: number;
}

/**
 * Calculate total collateral USD value across all assets and protocols.
 *
 * Formula:
 *   Total = WBTC total + XAUT wallet value + XAUT Fluid value
 *
 * @param inputs - The collateral values from various sources
 * @returns Total collateral value in USD
 */
export function calculateTotalCollateralUsd(inputs: TotalCollateralInputs): number {
    // Handle undefined/null values gracefully
    const wbtcTotal = inputs.wbtcTotalUsd || 0;
    const xautWallet = inputs.xautWalletBalance || 0;
    const xautSupplied = inputs.xautSuppliedUsd || 0;
    const xautPrice = inputs.xautPrice || 0;

    // Calculate XAUT wallet value in USD
    const xautWalletUsd = xautWallet * xautPrice;

    // Total = WBTC + XAUT wallet + XAUT Fluid
    return wbtcTotal + xautWalletUsd + xautSupplied;
}
