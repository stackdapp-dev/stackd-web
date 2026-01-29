/**
 * Unit tests for token precision utility functions
 * TDD: Write tests FIRST, then implement
 *
 * These utilities handle pre-emptive rounding of token amounts to avoid
 * "Arithmetic overflow or underflow" errors from smart contracts.
 *
 * Key insight: WBTC (8 decimals) causes overflow when high-precision amounts
 * are passed through Compound's internal scaling operations. Pre-emptively
 * rounding to a safe precision prevents failed transactions.
 */

import { describe, it, expect } from "vitest";
import {
    getSafeDecimals,
    roundAmountForTransaction,
    shouldApplyPrecisionRounding,
} from "@/lib/tokenPrecision";

describe("Token Precision Utilities", () => {
    describe("getSafeDecimals", () => {
        it("should return 5 decimals for WBTC (8 decimal token)", () => {
            // WBTC has 8 decimals, we want to leave buffer for internal calculations
            // 8 - 3 = 5 safe decimals
            expect(getSafeDecimals(8)).toBe(5);
        });

        it("should return 4 decimals for USDT (6 decimal token)", () => {
            // USDT has 6 decimals
            // 6 - 2 = 4 safe decimals
            expect(getSafeDecimals(6)).toBe(4);
        });

        it("should return 14 decimals for ETH (18 decimal token)", () => {
            // ETH has 18 decimals
            // 18 - 4 = 14 safe decimals (more aggressive for high decimal tokens)
            expect(getSafeDecimals(18)).toBe(14);
        });

        it("should return minimum 2 decimals for very low decimal tokens", () => {
            // Tokens with 2 or fewer decimals
            expect(getSafeDecimals(2)).toBe(2);
            expect(getSafeDecimals(1)).toBe(1);
            expect(getSafeDecimals(0)).toBe(0);
        });

        it("should handle edge case of 3 decimal token", () => {
            // 3 decimal token should have at least 2 safe decimals
            expect(getSafeDecimals(3)).toBe(2);
        });
    });

    describe("roundAmountForTransaction", () => {
        describe("WBTC (8 decimals)", () => {
            it("should round 0.12345678 WBTC to 5 decimals", () => {
                // 0.12345678 rounded down to 5 decimals = 0.12345
                expect(roundAmountForTransaction(0.12345678, 8)).toBe(0.12345);
            });

            it("should round 0.123456789 WBTC to 5 decimals", () => {
                // Extra digit should be truncated
                expect(roundAmountForTransaction(0.123456789, 8)).toBe(0.12345);
            });

            it("should not change amounts already at safe precision", () => {
                expect(roundAmountForTransaction(0.12345, 8)).toBe(0.12345);
                expect(roundAmountForTransaction(1.5, 8)).toBe(1.5);
                expect(roundAmountForTransaction(10, 8)).toBe(10);
            });

            it("should handle very small amounts", () => {
                // 0.00001234 rounded to 5 decimals = 0.00001
                expect(roundAmountForTransaction(0.00001234, 8)).toBe(0.00001);
            });

            it("should return 0 for amounts smaller than safe precision", () => {
                // 0.000001 has 6 decimals, but we only allow 5
                expect(roundAmountForTransaction(0.000001, 8)).toBe(0);
            });

            it("should handle whole numbers", () => {
                expect(roundAmountForTransaction(1, 8)).toBe(1);
                expect(roundAmountForTransaction(100, 8)).toBe(100);
            });
        });

        describe("USDT (6 decimals)", () => {
            it("should round 123.456789 USDT to 4 decimals", () => {
                expect(roundAmountForTransaction(123.456789, 6)).toBe(123.4567);
            });

            it("should handle typical USDT amounts", () => {
                expect(roundAmountForTransaction(100.50, 6)).toBe(100.5);
                expect(roundAmountForTransaction(1000.1234, 6)).toBe(1000.1234);
            });
        });

        describe("XAUT (6 decimals)", () => {
            it("should round 0.123456 XAUT to 4 decimals", () => {
                expect(roundAmountForTransaction(0.123456, 6)).toBe(0.1234);
            });
        });

        describe("Edge cases", () => {
            it("should handle 0", () => {
                expect(roundAmountForTransaction(0, 8)).toBe(0);
                expect(roundAmountForTransaction(0, 6)).toBe(0);
            });

            it("should handle negative numbers (should never happen but be safe)", () => {
                // Negative amounts should remain negative and be rounded
                expect(roundAmountForTransaction(-0.12345678, 8)).toBe(-0.12345);
            });

            it("should handle very large amounts", () => {
                expect(roundAmountForTransaction(1000000.12345678, 8)).toBe(1000000.12345);
            });
        });
    });

    describe("shouldApplyPrecisionRounding", () => {
        it("should return true for WBTC", () => {
            expect(shouldApplyPrecisionRounding("WBTC")).toBe(true);
        });

        it("should return true for XAUT", () => {
            // XAUT could also benefit from precision rounding
            expect(shouldApplyPrecisionRounding("XAUT")).toBe(true);
        });

        it("should return true for USDT", () => {
            expect(shouldApplyPrecisionRounding("USDT")).toBe(true);
        });

        it("should return true by default for unknown tokens", () => {
            // Better to be safe and round unknown tokens
            expect(shouldApplyPrecisionRounding("UNKNOWN")).toBe(true);
        });
    });

    describe("Integration: Pre-emptive rounding prevents overflow", () => {
        /**
         * These tests verify that the rounding approach prevents the specific
         * overflow issue seen with WBTC withdrawals.
         *
         * The original bug: 0.12345678 WBTC caused overflow
         * The workaround: Rounding to 3 decimals (0.123) worked but lost precision
         * The fix: Round to 5 decimals (0.12345) - preserves more precision while avoiding overflow
         */

        it("should round problematic WBTC amounts to safe precision", () => {
            const problematicAmount = 0.12345678;
            const tokenDecimals = 8;

            const safeAmount = roundAmountForTransaction(problematicAmount, tokenDecimals);

            // Should be rounded to 5 decimals
            expect(safeAmount).toBe(0.12345);

            // Verify the precision loss is minimal compared to 3 decimals
            const precisionLoss = problematicAmount - safeAmount;
            expect(precisionLoss).toBeCloseTo(0.00000678, 8);

            // Old workaround lost more precision
            const oldWorkaroundAmount = 0.123;
            const oldPrecisionLoss = problematicAmount - oldWorkaroundAmount;
            expect(oldPrecisionLoss).toBeCloseTo(0.00045678, 8);

            // New approach loses less precision
            expect(precisionLoss).toBeLessThan(oldPrecisionLoss);
        });

        it("should handle edge case amounts that previously caused overflow", () => {
            // Test various amounts that could cause overflow
            const testCases = [
                { input: 0.99999999, expected: 0.99999, decimals: 8 },
                { input: 0.00123456, expected: 0.00123, decimals: 8 },
                { input: 1.23456789, expected: 1.23456, decimals: 8 },
            ];

            for (const { input, expected, decimals } of testCases) {
                expect(roundAmountForTransaction(input, decimals)).toBe(expected);
            }
        });

        it("should preserve more precision than the old 3-decimal workaround", () => {
            const testAmount = 0.12345678;
            const newSafeAmount = roundAmountForTransaction(testAmount, 8);
            const oldWorkaroundAmount = Math.floor(testAmount * 1000) / 1000; // Old: 3 decimals

            // New method preserves more precision
            expect(newSafeAmount).toBe(0.12345); // 5 decimals
            expect(oldWorkaroundAmount).toBe(0.123); // 3 decimals

            // Verify precision comparison
            expect(newSafeAmount).toBeGreaterThan(oldWorkaroundAmount);
        });
    });
});
