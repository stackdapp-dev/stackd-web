/**
 * Unit tests for Rewards Simulator calculation logic
 * 
 * Rates are ANNUAL rates divided by 12 for monthly calculation:
 * - L1: 0.5% APY / 12 = 0.0004167 per month
 * - L2: 0.1% APY / 12 = 0.0000833 per month
 * 
 * Example calculation for Scenario 2:
 * - 1 L1 + 1 L2 at $1,000, 12 months
 * - L1 monthly: 1 * 1000 * (0.005/12) = $0.417
 * - L2 monthly: 1 * 1000 * (0.001/12) = $0.083
 * - Total monthly: $0.50
 * - Total 12 months: $6.00
 */
import { describe, it, expect } from "vitest";
import {
    calculateRewardsSimulation,
    SimulatorInput,
    SIMULATOR_RATES
} from "@/lib/referrals/rewardsSimulator";

describe("SIMULATOR_RATES", () => {
    it("should have correct L1 rate (0.5% APY / 12)", () => {
        expect(SIMULATOR_RATES.L1).toBeCloseTo(0.005 / 12, 8);
    });

    it("should have correct L2 rate (0.1% APY / 12)", () => {
        expect(SIMULATOR_RATES.L2).toBeCloseTo(0.001 / 12, 8);
    });
});

describe("calculateRewardsSimulation", () => {
    describe("Scenario 1: Bronze Tier Setup (1 L1 + 1 L2 at $500)", () => {
        // From implementation_plan.md Scenario 1:
        // With these rates, $500 loan = $3.00 per year for 1 L1 + 1 L2
        const input: SimulatorInput = {
            directReferrals: 1,
            avgReferralsPerFriend: 1,
            avgLoanPosition: 500,
            timePeriodMonths: 12,
        };

        it("should calculate correct total over 12 months", () => {
            const result = calculateRewardsSimulation(input);
            // L1: 1 * 500 * (0.005/12) * 12 = $2.50
            // L2: 1 * 500 * (0.001/12) * 12 = $0.50
            // Total: $3.00
            expect(result.estimatedEarnings).toBeCloseTo(3.00, 2);
        });

        it("should calculate correct L1 earnings", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.l1Earnings).toBeCloseTo(2.50, 2);
        });

        it("should calculate correct L2 earnings", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.l2Earnings).toBeCloseTo(0.50, 2);
        });

        it("should calculate correct monthly earnings", () => {
            const result = calculateRewardsSimulation(input);
            // Monthly: $3.00 / 12 = $0.25
            expect(result.perMonth).toBeCloseTo(0.25, 2);
        });

        it("should calculate correct total network (2)", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.totalNetwork).toBe(2);
        });
    });

    describe("Scenario 2: Silver Tier Setup (1 L1 + 1 L2 at $1000) - from implementation_plan.md", () => {
        // From implementation_plan.md Scenario 2:
        // L1: 1 * $1,000 * (0.5%/12) = $0.417/month, $5.00/year
        // L2: 1 * $1,000 * (0.1%/12) = $0.083/month, $1.00/year
        // Total: $0.50/month, $6.00/year
        const input: SimulatorInput = {
            directReferrals: 1,
            avgReferralsPerFriend: 1,
            avgLoanPosition: 1000,
            timePeriodMonths: 12,
        };

        it("should calculate $6.00 total over 12 months", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.estimatedEarnings).toBeCloseTo(6.00, 2);
        });

        it("should calculate $5.00 L1 earnings", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.l1Earnings).toBeCloseTo(5.00, 2);
        });

        it("should calculate $1.00 L2 earnings", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.l2Earnings).toBeCloseTo(1.00, 2);
        });

        it("should calculate $0.50 monthly earnings", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.perMonth).toBeCloseTo(0.50, 2);
        });

        it("should calculate $3.00 for 6 months", () => {
            const result = calculateRewardsSimulation({ ...input, timePeriodMonths: 6 });
            expect(result.estimatedEarnings).toBeCloseTo(3.00, 2);
        });
    });

    describe("Scenario 3: Gold Tier Mixed Network - from implementation_plan.md", () => {
        // From implementation_plan.md Scenario 3:
        // L1: 1 * $3,000 * (0.5%/12) = $1.25/month, $15.00/year
        // L2: 1 * $1,500 * (0.1%/12) = $0.125/month, $1.50/year  
        // L3: 1 * $500 * (0.1%/12) = $0.042/month, $0.50/year
        // Note: Simulator only handles L1/L2 with uniform avg loan, so we test core logic

        it("should calculate correctly for L1 at $3000", () => {
            const result = calculateRewardsSimulation({
                directReferrals: 1,
                avgReferralsPerFriend: 0,
                avgLoanPosition: 3000,
                timePeriodMonths: 12,
            });
            // L1 only: 1 * 3000 * (0.005/12) * 12 = $15.00
            expect(result.l1Earnings).toBeCloseTo(15.00, 2);
        });
    });

    describe("Large network example (10 L1, 5 avg per friend, $5000 loan, 6 months)", () => {
        const input: SimulatorInput = {
            directReferrals: 10,
            avgReferralsPerFriend: 5,
            avgLoanPosition: 5000,
            timePeriodMonths: 6,
        };

        it("should calculate 60 total network", () => {
            const result = calculateRewardsSimulation(input);
            // 10 L1 + (10 * 5) L2 = 10 + 50 = 60
            expect(result.totalNetwork).toBe(60);
        });

        it("should calculate correct earnings breakdown", () => {
            const result = calculateRewardsSimulation(input);
            // L1: 10 * 5000 * (0.005/12) * 6 = $125.00
            // L2: 50 * 5000 * (0.001/12) * 6 = $125.00
            // Total: $250.00
            expect(result.l1Earnings).toBeCloseTo(125.00, 0);
            expect(result.l2Earnings).toBeCloseTo(125.00, 0);
            expect(result.estimatedEarnings).toBeCloseTo(250.00, 0);
        });
    });

    describe("Edge cases", () => {
        it("should return 0 for 0 referrals", () => {
            const result = calculateRewardsSimulation({
                directReferrals: 0,
                avgReferralsPerFriend: 0,
                avgLoanPosition: 5000,
                timePeriodMonths: 12,
            });
            expect(result.estimatedEarnings).toBe(0);
            expect(result.totalNetwork).toBe(0);
            expect(result.perMonth).toBe(0);
        });

        it("should return 0 for 0 months", () => {
            const result = calculateRewardsSimulation({
                directReferrals: 10,
                avgReferralsPerFriend: 5,
                avgLoanPosition: 5000,
                timePeriodMonths: 0,
            });
            expect(result.estimatedEarnings).toBe(0);
        });

        it("should return 0 for 0 loan position", () => {
            const result = calculateRewardsSimulation({
                directReferrals: 10,
                avgReferralsPerFriend: 5,
                avgLoanPosition: 0,
                timePeriodMonths: 12,
            });
            expect(result.estimatedEarnings).toBe(0);
        });

        it("should handle only L1 referrals (no L2)", () => {
            const result = calculateRewardsSimulation({
                directReferrals: 5,
                avgReferralsPerFriend: 0,
                avgLoanPosition: 1000,
                timePeriodMonths: 12,
            });
            expect(result.totalNetwork).toBe(5);
            expect(result.l2Earnings).toBe(0);
            // L1: 5 * 1000 * (0.005/12) * 12 = $25.00
            expect(result.l1Earnings).toBeCloseTo(25.00, 2);
        });

        it("should return 0 for Bronze tier", () => {
            const result = calculateRewardsSimulation({
                directReferrals: 10,
                avgReferralsPerFriend: 5,
                avgLoanPosition: 5000,
                timePeriodMonths: 12,
                tier: 'BRONZE',
            });
            expect(result.estimatedEarnings).toBe(0);
            expect(result.perMonth).toBe(0);
            expect(result.totalNetwork).toBe(60); // Network still counted
        });
    });

    describe("Monthly progression", () => {
        it("should scale linearly with time period", () => {
            const baseInput: SimulatorInput = {
                directReferrals: 1,
                avgReferralsPerFriend: 1,
                avgLoanPosition: 1000,
                timePeriodMonths: 1,
            };

            const result1 = calculateRewardsSimulation({ ...baseInput, timePeriodMonths: 1 });
            const result6 = calculateRewardsSimulation({ ...baseInput, timePeriodMonths: 6 });
            const result12 = calculateRewardsSimulation({ ...baseInput, timePeriodMonths: 12 });

            // Earnings should scale linearly
            expect(result12.estimatedEarnings).toBeCloseTo(result6.estimatedEarnings * 2, 2);
            expect(result6.estimatedEarnings).toBeCloseTo(result1.estimatedEarnings * 6, 2);
        });

        it("should keep perMonth constant regardless of time period", () => {
            const baseInput: SimulatorInput = {
                directReferrals: 5,
                avgReferralsPerFriend: 3,
                avgLoanPosition: 2000,
                timePeriodMonths: 1,
            };

            const result1 = calculateRewardsSimulation({ ...baseInput, timePeriodMonths: 1 });
            const result6 = calculateRewardsSimulation({ ...baseInput, timePeriodMonths: 6 });
            const result12 = calculateRewardsSimulation({ ...baseInput, timePeriodMonths: 12 });

            expect(result1.perMonth).toBeCloseTo(result6.perMonth, 2);
            expect(result6.perMonth).toBeCloseTo(result12.perMonth, 2);
        });
    });
});
