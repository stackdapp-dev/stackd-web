/**
 * TDD tests for total collateral USD calculation
 *
 * Bug fix: TOTAL COLLATERAL BALANCE should show WBTC + XAUT summed together
 *
 * The issue: The calculation was only including:
 * - WBTC: wallet balance + Compound collateral (correct)
 * - XAUT: only Fluid supplied collateral (missing wallet balance)
 *
 * Expected behavior:
 * - Total = WBTC total + XAUT total
 * - WBTC total = wallet WBTC + Compound WBTC
 * - XAUT total = wallet XAUT + Fluid XAUT
 */
import { describe, it, expect } from "vitest";
import { calculateTotalCollateralUsd, type TotalCollateralInputs } from "@/lib/calculations/totalCollateralUsd";

describe("calculateTotalCollateralUsd", () => {
    // Test data constants
    const WBTC_PRICE = 100000; // $100k per BTC
    const XAUT_PRICE = 2700;   // $2700 per oz of gold

    describe("Basic calculations", () => {
        it("should calculate total when user has both WBTC and XAUT in wallet only", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 267.52,      // 0.00267520 WBTC from wallet
                xautWalletBalance: 0.0346, // XAUT in wallet
                xautSuppliedUsd: 0,        // No XAUT in Fluid
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            const expectedXautUsd = 0.0346 * XAUT_PRICE; // ~$93.42
            const expectedTotal = 267.52 + expectedXautUsd;

            expect(result).toBeCloseTo(expectedTotal, 2);
            expect(result).toBeCloseTo(360.94, 0); // Approximate expected total
        });

        it("should calculate total when user has WBTC in wallet + XAUT in wallet", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 500,
                xautWalletBalance: 1,
                xautSuppliedUsd: 0,
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            expect(result).toBe(500 + 2700); // WBTC + 1 oz gold
        });

        it("should calculate total when user has XAUT in both wallet and Fluid", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 0,
                xautWalletBalance: 1,        // 1 oz in wallet
                xautSuppliedUsd: 5400,       // 2 oz worth in Fluid ($5400)
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            // Wallet XAUT: 1 oz * $2700 = $2700
            // Fluid XAUT: $5400 (already in USD)
            // Total: $8100
            expect(result).toBe(2700 + 5400);
        });

        it("should calculate total when user has all: WBTC (wallet+compound) + XAUT (wallet+fluid)", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 10000,         // WBTC in wallet + Compound
                xautWalletBalance: 2,        // 2 oz in wallet
                xautSuppliedUsd: 8100,       // 3 oz worth in Fluid
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            // WBTC: $10,000
            // XAUT wallet: 2 * $2700 = $5400
            // XAUT Fluid: $8100
            // Total: $23,500
            expect(result).toBe(10000 + 5400 + 8100);
        });
    });

    describe("Edge cases", () => {
        it("should return 0 when user has no assets", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 0,
                xautWalletBalance: 0,
                xautSuppliedUsd: 0,
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            expect(result).toBe(0);
        });

        it("should handle only WBTC (no XAUT)", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 50000,
                xautWalletBalance: 0,
                xautSuppliedUsd: 0,
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            expect(result).toBe(50000);
        });

        it("should handle only XAUT wallet balance (no Fluid position)", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 0,
                xautWalletBalance: 0.0346,
                xautSuppliedUsd: 0,
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            expect(result).toBeCloseTo(0.0346 * XAUT_PRICE, 2);
        });

        it("should handle only XAUT supplied to Fluid (no wallet balance)", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 0,
                xautWalletBalance: 0,
                xautSuppliedUsd: 149850, // 55.5 oz in Fluid
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            expect(result).toBe(149850);
        });

        it("should handle undefined/null values gracefully", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: undefined as unknown as number,
                xautWalletBalance: null as unknown as number,
                xautSuppliedUsd: 0,
                xautPrice: XAUT_PRICE,
            };

            const result = calculateTotalCollateralUsd(inputs);
            expect(result).toBe(0);
        });

        it("should handle zero XAUT price gracefully (no crash)", () => {
            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 1000,
                xautWalletBalance: 5,
                xautSuppliedUsd: 0,
                xautPrice: 0,
            };

            const result = calculateTotalCollateralUsd(inputs);
            // When price is 0, wallet XAUT value is 0
            expect(result).toBe(1000);
        });
    });

    describe("Real-world scenario: User's screenshot", () => {
        /**
         * From the user's screenshot:
         * - WBTC: $267.52
         * - XAUT: $93.40
         * - Expected total: $360.92
         *
         * Bug: Total was showing $267.52 (only WBTC)
         * Fix: Total should be $360.92 (WBTC + XAUT)
         */
        it("should match expected total from user screenshot", () => {
            // XAUT wallet balance that results in ~$93.40 at $2700/oz
            const xautBalance = 93.40 / 2700; // ~0.0346 oz

            const inputs: TotalCollateralInputs = {
                wbtcTotalUsd: 267.52,
                xautWalletBalance: xautBalance,
                xautSuppliedUsd: 0, // User hasn't deposited XAUT to Fluid
                xautPrice: 2700,
            };

            const result = calculateTotalCollateralUsd(inputs);
            expect(result).toBeCloseTo(360.92, 0);
        });
    });
});
