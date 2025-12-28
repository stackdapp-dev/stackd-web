/**
 * Scenario-based unit tests for referral payout calculations
 * Based on referral_payout_test_spec.md
 * 
 * Payout Formula:
 * - L1: loanBalance × 0.5% / 12
 * - L2: loanBalance × 0.1% / 12
 * - L3: loanBalance × 0.1% / 12
 * - Proration: effectiveBalance = loanBalance × (daysActive / 30)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
    calculateMonthlyPayout,
    getAccruedEarnings,
    getWithdrawableBalance,
    setMockData,
    clearMockData,
    type ReferralNetwork,
} from "@/lib/referrals/payout";
import { getUserTier } from "@/lib/referrals/tiers";

describe("Payout Calculations", () => {
    beforeEach(() => {
        clearMockData();
    });

    describe("Scenario 1: Standard 3-Level Cascade", () => {
        /**
         * Tree:
         * Alice
         * ├── Bob (L1)
         * │   ├── Dave (L2)
         * │   └── Eve (L2)
         * │       └── Grace (L3)
         * └── Carol (L1)
         *     └── Frank (L2)
         */
        beforeEach(() => {
            setMockData({
                alice: {
                    personalLoan: 2000,
                    daysActive: 30,
                    referees: [
                        { userId: "bob", level: 1, loanBalance: 5000, daysActive: 30 },
                        { userId: "carol", level: 1, loanBalance: 3000, daysActive: 30 },
                        { userId: "dave", level: 2, loanBalance: 1000, daysActive: 30 },
                        { userId: "eve", level: 2, loanBalance: 2500, daysActive: 30 },
                        { userId: "frank", level: 2, loanBalance: 4000, daysActive: 30 },
                        { userId: "grace", level: 3, loanBalance: 1500, daysActive: 30 },
                    ],
                },
                bob: {
                    personalLoan: 5000,
                    daysActive: 30,
                    referees: [
                        { userId: "dave", level: 1, loanBalance: 1000, daysActive: 30 },
                        { userId: "eve", level: 1, loanBalance: 2500, daysActive: 30 },
                        { userId: "grace", level: 2, loanBalance: 1500, daysActive: 30 },
                    ],
                },
                carol: {
                    personalLoan: 3000,
                    daysActive: 30,
                    referees: [
                        { userId: "frank", level: 1, loanBalance: 4000, daysActive: 30 },
                    ],
                },
                eve: {
                    personalLoan: 2500,
                    daysActive: 30,
                    referees: [
                        { userId: "grace", level: 1, loanBalance: 1500, daysActive: 30 },
                    ],
                },
                dave: { personalLoan: 1000, daysActive: 30, referees: [] },
                frank: { personalLoan: 4000, daysActive: 30, referees: [] },
                grace: { personalLoan: 1500, daysActive: 30, referees: [] },
            });
        });

        it("Alice should earn $4.09 from network", () => {
            // L1: (5000 + 3000) × 0.5% / 12 = $3.33
            // L2: (1000 + 2500 + 4000) × 0.1% / 12 = $0.625
            // L3: 1500 × 0.1% / 12 = $0.125
            // Total: $4.08 (rounding)
            const payout = calculateMonthlyPayout("alice");
            expect(payout).toBeCloseTo(4.09, 1);
        });

        it("Bob should earn $1.59 from network", () => {
            // L1: (1000 + 2500) × 0.5% / 12 = $1.46
            // L2: 1500 × 0.1% / 12 = $0.125
            // Total: $1.59
            const payout = calculateMonthlyPayout("bob");
            expect(payout).toBeCloseTo(1.59, 1);
        });

        it("Carol should earn $1.67 from network", () => {
            // L1: 4000 × 0.5% / 12 = $1.67
            const payout = calculateMonthlyPayout("carol");
            expect(payout).toBeCloseTo(1.67, 1);
        });

        it("Eve should earn $0.63 from network", () => {
            // L1: 1500 × 0.5% / 12 = $0.625
            const payout = calculateMonthlyPayout("eve");
            expect(payout).toBeCloseTo(0.63, 1);
        });

        it("Dave should earn $0.00 (no referees)", () => {
            const payout = calculateMonthlyPayout("dave");
            expect(payout).toBe(0);
        });
    });

    describe("Scenario 2: Inactive Loan (Zero Balance)", () => {
        /**
         * Tree: Alice → Bob → Dave ($0)
         */
        beforeEach(() => {
            setMockData({
                alice: {
                    personalLoan: 2000,
                    daysActive: 30,
                    referees: [
                        { userId: "bob", level: 1, loanBalance: 5000, daysActive: 30 },
                        { userId: "dave", level: 2, loanBalance: 0, daysActive: 30 },
                    ],
                },
                bob: {
                    personalLoan: 5000,
                    daysActive: 30,
                    referees: [
                        { userId: "dave", level: 1, loanBalance: 0, daysActive: 30 },
                    ],
                },
                dave: { personalLoan: 0, daysActive: 30, referees: [] },
            });
        });

        it("Alice should earn $2.08 (L1 only, L2 is $0)", () => {
            // L1: 5000 × 0.5% / 12 = $2.08
            // L2: 0 × 0.1% / 12 = $0
            const payout = calculateMonthlyPayout("alice");
            expect(payout).toBeCloseTo(2.08, 1);
        });

        it("Bob should earn $0.00 (Dave has no loan)", () => {
            const payout = calculateMonthlyPayout("bob");
            expect(payout).toBe(0);
        });
    });

    describe("Scenario 3: Silver Gate (No Personal Loan)", () => {
        /**
         * Tree: Alice (NO LOAN) → Bob
         */
        beforeEach(() => {
            setMockData({
                alice: {
                    personalLoan: 0,
                    daysActive: 30,
                    referees: [
                        { userId: "bob", level: 1, loanBalance: 5000, daysActive: 30 },
                    ],
                },
                bob: { personalLoan: 5000, daysActive: 30, referees: [] },
            });
        });

        it("Alice should have accrued earnings of $2.08", () => {
            const accrued = getAccruedEarnings("alice");
            expect(accrued).toBeCloseTo(2.08, 1);
        });

        it("Alice should have withdrawable balance of $0.00 (Bronze tier)", () => {
            const withdrawable = getWithdrawableBalance("alice");
            expect(withdrawable).toBe(0);
        });

        it("Alice should be Bronze tier", () => {
            const tier = getUserTier({ personalLoanBalance: 0, networkVolume: 5000 });
            expect(tier).toBe("BRONZE");
        });
    });

    describe("Scenario 4: Mid-Month Proration", () => {
        /**
         * Tree: Alice → Bob (15 days active)
         */
        beforeEach(() => {
            setMockData({
                alice: {
                    personalLoan: 2000,
                    daysActive: 30,
                    referees: [
                        { userId: "bob", level: 1, loanBalance: 6000, daysActive: 15 },
                    ],
                },
                bob: { personalLoan: 6000, daysActive: 15, referees: [] },
            });
        });

        it("Alice should earn $1.25 (Bob prorated 50%)", () => {
            // Effective balance: 6000 × (15/30) = 3000
            // L1: 3000 × 0.5% / 12 = $1.25
            const payout = calculateMonthlyPayout("alice");
            expect(payout).toBeCloseTo(1.25, 1);
        });
    });

    describe("Scenario 5: Gold Tier Threshold (≥$5,000)", () => {
        /**
         * Tree: Alice → Bob ($3,000), Carol ($2,500)
         * Network Volume: $5,500
         */
        beforeEach(() => {
            setMockData({
                alice: {
                    personalLoan: 1000,
                    daysActive: 30,
                    referees: [
                        { userId: "bob", level: 1, loanBalance: 3000, daysActive: 30 },
                        { userId: "carol", level: 1, loanBalance: 2500, daysActive: 30 },
                    ],
                },
                bob: { personalLoan: 3000, daysActive: 30, referees: [] },
                carol: { personalLoan: 2500, daysActive: 30, referees: [] },
            });
        });

        it("Alice should be Gold tier (network volume $5,500)", () => {
            const tier = getUserTier({ personalLoanBalance: 1000, networkVolume: 5500 });
            expect(tier).toBe("GOLD");
        });
    });

    describe("Scenario 6: Below Gold Threshold", () => {
        /**
         * Tree: Alice → Bob ($4,999)
         * Network Volume: $4,999 (just under Gold)
         */
        beforeEach(() => {
            setMockData({
                alice: {
                    personalLoan: 1000,
                    daysActive: 30,
                    referees: [
                        { userId: "bob", level: 1, loanBalance: 4999, daysActive: 30 },
                    ],
                },
                bob: { personalLoan: 4999, daysActive: 30, referees: [] },
            });
        });

        it("Alice should be Silver tier (network volume $4,999)", () => {
            const tier = getUserTier({ personalLoanBalance: 1000, networkVolume: 4999 });
            expect(tier).toBe("SILVER");
        });
    });
});
