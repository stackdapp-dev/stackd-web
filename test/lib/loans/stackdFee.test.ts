/**
 * Unit tests for Stack'd Fee Calculator
 *
 * Based on test scenarios from stackd_fee_test_scenarios.csv
 */
import { describe, it, expect } from "vitest";
import {
    STACKD_ADDITIONAL_APR,
    REFERRAL_POOL_APR,
    STACKD_REVENUE_APR,
    getTotalApr,
    calculateInterestBreakdown,
    calculateStackdFee,
    calculatePerBlockFee,
    calculateMonthlyStackdFee,
    calculateYearlyStackdFee,
    calculateReferralPoolFromFee,
    calculateStackdRevenueFromFee,
    BLOCKS_PER_DAY_ARBITRUM,
} from "@/lib/loans/stackdFee";

describe("Stack'd Fee Calculator - Constants", () => {
    it("should have correct constant values", () => {
        expect(STACKD_ADDITIONAL_APR).toBe(1.5);
        expect(REFERRAL_POOL_APR).toBe(0.7);
        expect(STACKD_REVENUE_APR).toBe(0.8);
        expect(REFERRAL_POOL_APR + STACKD_REVENUE_APR).toBe(STACKD_ADDITIONAL_APR);
    });
});

describe("Stack'd Fee Calculator - getTotalApr", () => {
    it("should add Stack'd fee to market APR", () => {
        expect(getTotalApr(3.5)).toBe(5.0);
        expect(getTotalApr(5.5)).toBe(7.0);
        expect(getTotalApr(0)).toBe(1.5);
    });

    it("should handle negative APR gracefully", () => {
        expect(getTotalApr(-1)).toBe(1.5);
    });
});

describe("Stack'd Fee Calculator - calculateInterestBreakdown", () => {
    it("SC-001: Standard 1-Year Loan $100K at 3.5%", () => {
        const result = calculateInterestBreakdown(100000, 3.5);

        expect(result.marketInterest).toBeCloseTo(3500, 2);
        expect(result.stackdFee).toBeCloseTo(1500, 2);
        expect(result.totalInterest).toBeCloseTo(5000, 2);
        expect(result.totalApr).toBeCloseTo(5.0, 2);
    });

    it("SC-002: Standard 1-Year Loan $100K at 5.5%", () => {
        const result = calculateInterestBreakdown(100000, 5.5);

        expect(result.marketInterest).toBeCloseTo(5500, 2);
        expect(result.stackdFee).toBeCloseTo(1500, 2);
        expect(result.totalInterest).toBeCloseTo(7000, 2);
        expect(result.totalApr).toBeCloseTo(7.0, 2);
    });

    it("SC-007: Small Loan (Dust) $100", () => {
        const result = calculateInterestBreakdown(100, 3.5);

        expect(result.marketInterest).toBeCloseTo(3.5, 2);
        expect(result.stackdFee).toBeCloseTo(1.5, 2);
        expect(result.totalInterest).toBeCloseTo(5.0, 2);
    });

    it("SC-008: Zero Principal", () => {
        const result = calculateInterestBreakdown(0, 3.5);

        expect(result.marketInterest).toBe(0);
        expect(result.stackdFee).toBe(0);
        expect(result.totalInterest).toBe(0);
    });
});

describe("Stack'd Fee Calculator - calculateStackdFee (prorated)", () => {
    it("SC-001: Standard 1-Year Loan $100K", () => {
        const result = calculateStackdFee(100000, 365, 3.5);

        expect(result.principal).toBe(100000);
        expect(result.durationDays).toBe(365);
        expect(result.marketApr).toBe(3.5);
        expect(result.stackdApr).toBe(1.5);
        expect(result.totalApr).toBe(5.0);
        expect(result.marketInterest).toBeCloseTo(3500, 0);
        expect(result.stackdFee).toBeCloseTo(1500, 0);
        expect(result.totalInterest).toBeCloseTo(5000, 0);
        expect(result.referralPool).toBeCloseTo(700, 0);
        expect(result.stackdRevenue).toBeCloseTo(800, 0);
    });

    it("SC-003: 6-Month Loan (Prorated) $50K", () => {
        const result = calculateStackdFee(50000, 182, 4.0);

        // 182/365 = ~0.4986 year fraction
        const yearFraction = 182 / 365;
        expect(result.marketInterest).toBeCloseTo(50000 * 0.04 * yearFraction, 0);
        expect(result.stackdFee).toBeCloseTo(50000 * 0.015 * yearFraction, 0);
        expect(result.referralPool).toBeCloseTo(50000 * 0.007 * yearFraction, 0);
    });

    it("SC-004: 3-Month Loan $25K", () => {
        const result = calculateStackdFee(25000, 91, 3.5);

        const yearFraction = 91 / 365;
        expect(result.stackdFee).toBeCloseTo(25000 * 0.015 * yearFraction, 0);
    });

    it("SC-005: 1-Day Loan (Minimum)", () => {
        const result = calculateStackdFee(10000, 1, 3.5);

        const yearFraction = 1 / 365;
        expect(result.marketInterest).toBeCloseTo(10000 * 0.035 * yearFraction, 2);
        expect(result.stackdFee).toBeCloseTo(10000 * 0.015 * yearFraction, 2);
    });

    it("SC-006: Large Loan ($1M)", () => {
        const result = calculateStackdFee(1000000, 365, 3.0);

        expect(result.marketInterest).toBeCloseTo(30000, 0);
        expect(result.stackdFee).toBeCloseTo(15000, 0);
        expect(result.referralPool).toBeCloseTo(7000, 0);
        expect(result.stackdRevenue).toBeCloseTo(8000, 0);
    });

    it("SC-009: Zero Duration", () => {
        const result = calculateStackdFee(100000, 0, 3.5);

        expect(result.marketInterest).toBe(0);
        expect(result.stackdFee).toBe(0);
        expect(result.totalInterest).toBe(0);
    });

    it("SC-011: Mid-Month Repayment (45 days)", () => {
        const result = calculateStackdFee(100000, 45, 3.5);

        const yearFraction = 45 / 365;
        expect(result.marketInterest).toBeCloseTo(100000 * 0.035 * yearFraction, 0);
        expect(result.stackdFee).toBeCloseTo(100000 * 0.015 * yearFraction, 0);
    });

    it("SC-012: Fluid Rate (Higher) 6%", () => {
        const result = calculateStackdFee(75000, 365, 6.0);

        expect(result.totalApr).toBe(7.5);
        expect(result.marketInterest).toBeCloseTo(4500, 0);
        expect(result.stackdFee).toBeCloseTo(1125, 0);
    });

    it("SC-013: Compound Rate (Low) 2.5%", () => {
        const result = calculateStackdFee(75000, 365, 2.5);

        expect(result.totalApr).toBe(4.0);
        expect(result.marketInterest).toBeCloseTo(1875, 0);
        expect(result.stackdFee).toBeCloseTo(1125, 0);
    });
});

describe("Stack'd Fee Calculator - calculatePerBlockFee", () => {
    it("SC-010: Per-Block Calculation for 1 day", () => {
        // 1 day = 7200 blocks
        const result = calculatePerBlockFee(100000, BLOCKS_PER_DAY_ARBITRUM);

        // Daily fee = $100k * 1.5% / 365 = ~$4.11
        const expectedDailyFee = (100000 * 0.015) / 365;
        expect(result).toBeCloseTo(expectedDailyFee, 1);
    });

    it("should return 0 for zero blocks", () => {
        expect(calculatePerBlockFee(100000, 0)).toBe(0);
    });

    it("should return 0 for zero principal", () => {
        expect(calculatePerBlockFee(0, 7200)).toBe(0);
    });

    it("should calculate yearly fee correctly", () => {
        const blocksPerYear = BLOCKS_PER_DAY_ARBITRUM * 365;
        const result = calculatePerBlockFee(100000, blocksPerYear);

        // Should equal yearly Stack'd fee
        expect(result).toBeCloseTo(1500, 0);
    });
});

describe("Stack'd Fee Calculator - Monthly/Yearly helpers", () => {
    it("should calculate monthly Stack'd fee", () => {
        const result = calculateMonthlyStackdFee(100000);

        // $100k * 1.5% / 12 = $125
        expect(result).toBeCloseTo(125, 0);
    });

    it("should calculate yearly Stack'd fee", () => {
        const result = calculateYearlyStackdFee(100000);

        // $100k * 1.5% = $1500
        expect(result).toBe(1500);
    });

    it("should return 0 for zero principal", () => {
        expect(calculateMonthlyStackdFee(0)).toBe(0);
        expect(calculateYearlyStackdFee(0)).toBe(0);
    });
});

describe("Stack'd Fee Calculator - Fee Distribution", () => {
    it("SC-015: Full 3-Level referral distribution", () => {
        const stackdFee = 1500; // From $100k loan

        const referralPool = calculateReferralPoolFromFee(stackdFee);
        const stackdRevenue = calculateStackdRevenueFromFee(stackdFee);

        // Referral pool = 0.7/1.5 * 1500 = 700
        expect(referralPool).toBeCloseTo(700, 0);
        // Stack'd revenue = 0.8/1.5 * 1500 = 800
        expect(stackdRevenue).toBeCloseTo(800, 0);
        // Total should equal original fee
        expect(referralPool + stackdRevenue).toBeCloseTo(stackdFee, 0);
    });

    it("should handle zero fee", () => {
        expect(calculateReferralPoolFromFee(0)).toBe(0);
        expect(calculateStackdRevenueFromFee(0)).toBe(0);
    });

    it("should handle negative fee gracefully", () => {
        expect(calculateReferralPoolFromFee(-100)).toBe(0);
        expect(calculateStackdRevenueFromFee(-100)).toBe(0);
    });
});

describe("Stack'd Fee Calculator - Edge Cases", () => {
    it("should handle very small amounts (dust)", () => {
        const result = calculateStackdFee(0.01, 365, 3.5);

        expect(result.stackdFee).toBeCloseTo(0.00015, 5);
    });

    it("should handle very large amounts", () => {
        const result = calculateStackdFee(10000000, 365, 3.5); // $10M

        expect(result.stackdFee).toBe(150000);
        expect(result.referralPool).toBeCloseTo(70000, 0);
    });

    it("should handle negative principal gracefully", () => {
        const result = calculateStackdFee(-100, 365, 3.5);

        expect(result.stackdFee).toBe(0);
        expect(result.totalInterest).toBe(0);
    });
});
