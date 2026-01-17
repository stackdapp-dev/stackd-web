/**
 * Unit tests for Rewards Simulator calculation logic
 * TDD: Write tests FIRST, then implement
 */
import { describe, it, expect } from "vitest";
import {
    calculateRewardsSimulation,
    SimulatorInput,
    SIMULATOR_RATES
} from "@/lib/referrals/rewardsSimulator";

describe("SIMULATOR_RATES", () => {
    it("should have correct L1 rate (0.5% monthly)", () => {
        expect(SIMULATOR_RATES.L1).toBe(0.005);
    });

    it("should have correct L2 rate (0.25% monthly)", () => {
        expect(SIMULATOR_RATES.L2).toBe(0.0025);
    });
});

describe("calculateRewardsSimulation", () => {
    describe("Scenario 1: Bronze Tier Setup (1 L1 + 1 L2 at $500)", () => {
        // Note: Simulator shows POTENTIAL earnings - Bronze users see what they COULD earn
        // The actual earning restriction is enforced at payout time
        const input: SimulatorInput = {
            directReferrals: 1,
            avgReferralsPerFriend: 1,
            avgLoanPosition: 500,
            timePeriodMonths: 12,
        };

        it("should calculate correct total over 12 months", () => {
            const result = calculateRewardsSimulation(input);
            // L1: 1 * 500 * 0.005 * 12 = $30
            // L2: 1 * 500 * 0.0025 * 12 = $15
            // Total: $45
            expect(result.estimatedEarnings).toBeCloseTo(45.00, 2);
        });

        it("should calculate correct L1 earnings", () => {
            const result = calculateRewardsSimulation(input);
            // L1: 1 * 500 * 0.005 * 12 = $30
            expect(result.l1Earnings).toBeCloseTo(30.00, 2);
        });

        it("should calculate correct L2 earnings", () => {
            const result = calculateRewardsSimulation(input);
            // L2: 1 * 500 * 0.0025 * 12 = $15
            expect(result.l2Earnings).toBeCloseTo(15.00, 2);
        });

        it("should calculate correct monthly earnings", () => {
            const result = calculateRewardsSimulation(input);
            // Monthly: $45 / 12 = $3.75
            expect(result.perMonth).toBeCloseTo(3.75, 2);
        });

        it("should calculate correct total network (2)", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.totalNetwork).toBe(2);
        });
    });

    describe("Scenario 2: Silver Tier Setup (1 L1 + 1 L2 at $1000)", () => {
        const input: SimulatorInput = {
            directReferrals: 1,
            avgReferralsPerFriend: 1,
            avgLoanPosition: 1000,
            timePeriodMonths: 12,
        };

        it("should calculate correct total over 12 months", () => {
            const result = calculateRewardsSimulation(input);
            // L1: 1 * 1000 * 0.005 * 12 = $60
            // L2: 1 * 1000 * 0.0025 * 12 = $30
            // Total: $90
            expect(result.estimatedEarnings).toBeCloseTo(90.00, 2);
        });

        it("should calculate correct L1 earnings", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.l1Earnings).toBeCloseTo(60.00, 2);
        });

        it("should calculate correct L2 earnings", () => {
            const result = calculateRewardsSimulation(input);
            expect(result.l2Earnings).toBeCloseTo(30.00, 2);
        });

        it("should calculate correct monthly earnings", () => {
            const result = calculateRewardsSimulation(input);
            // Monthly: $90 / 12 = $7.50
            expect(result.perMonth).toBeCloseTo(7.50, 2);
        });
    });

    describe("Scenario 3: Larger network (5 L1, 3 avg per friend, $3000 loan)", () => {
        const input: SimulatorInput = {
            directReferrals: 5,
            avgReferralsPerFriend: 3,
            avgLoanPosition: 3000,
            timePeriodMonths: 12,
        };

        it("should calculate correct total network", () => {
            const result = calculateRewardsSimulation(input);
            // 5 L1 + (5 * 3) L2 = 5 + 15 = 20
            expect(result.totalNetwork).toBe(20);
        });

        it("should calculate correct earnings", () => {
            const result = calculateRewardsSimulation(input);
            // L1: 5 * 3000 * 0.005 * 12 = $900
            // L2: 15 * 3000 * 0.0025 * 12 = $1350
            // Total: $2250
            expect(result.l1Earnings).toBeCloseTo(900.00, 0);
            expect(result.l2Earnings).toBeCloseTo(1350.00, 0);
            expect(result.estimatedEarnings).toBeCloseTo(2250.00, 0);
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
            // L1: 10 * 5000 * 0.005 * 6 = $1500
            // L2: 50 * 5000 * 0.0025 * 6 = $3750
            // Total: $5250
            expect(result.l1Earnings).toBeCloseTo(1500.00, 0);
            expect(result.l2Earnings).toBeCloseTo(3750.00, 0);
            expect(result.estimatedEarnings).toBeCloseTo(5250.00, 0);
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
            // L1: 5 * 1000 * 0.005 * 12 = $300
            expect(result.l1Earnings).toBeCloseTo(300.00, 2);
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
