/**
 * Unit tests for tier calculation logic
 * TDD: Write tests FIRST, then implement
 */
import { describe, it, expect } from "vitest";
import { getUserTier, getTierBenefits, TIER_THRESHOLDS, type UserTier } from "@/lib/referrals/tiers";

describe("getUserTier", () => {
    describe("Bronze Tier (Default)", () => {
        it("should return BRONZE for new user with no loan", () => {
            const tier = getUserTier({
                personalLoanBalance: 0,
                networkVolume: 0,
            });
            expect(tier).toBe("BRONZE");
        });

        it("should return BRONZE for user with small loan under $500", () => {
            const tier = getUserTier({
                personalLoanBalance: 499,
                networkVolume: 0,
            });
            expect(tier).toBe("BRONZE");
        });
    });

    describe("Silver Tier (Personal Loan > $500)", () => {
        it("should return SILVER for user with exactly $500 loan", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 0,
            });
            expect(tier).toBe("SILVER");
        });

        it("should return SILVER for user with $1000 loan but no network", () => {
            const tier = getUserTier({
                personalLoanBalance: 1000,
                networkVolume: 0,
            });
            expect(tier).toBe("SILVER");
        });

        it("should return SILVER for user with network < $5000", () => {
            const tier = getUserTier({
                personalLoanBalance: 1000,
                networkVolume: 4999,
            });
            expect(tier).toBe("SILVER");
        });
    });

    describe("Gold Tier (Network Volume > $5,000)", () => {
        it("should return GOLD for network volume exactly $5000", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 5000,
            });
            expect(tier).toBe("GOLD");
        });

        it("should return GOLD for network volume $5500", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 5500,
            });
            expect(tier).toBe("GOLD");
        });

        it("should return GOLD for network volume $9999", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 9999,
            });
            expect(tier).toBe("GOLD");
        });
    });

    describe("Platinum Tier (Network Volume > $10,000)", () => {
        it("should return PLATINUM for network volume exactly $10000", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 10000,
            });
            expect(tier).toBe("PLATINUM");
        });

        it("should return PLATINUM for network volume $25000", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 25000,
            });
            expect(tier).toBe("PLATINUM");
        });

        it("should return PLATINUM for network volume $49999", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 49999,
            });
            expect(tier).toBe("PLATINUM");
        });
    });

    describe("Black Tier (Network Volume > $50,000)", () => {
        it("should return BLACK for network volume exactly $50000", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 50000,
            });
            expect(tier).toBe("BLACK");
        });

        it("should return BLACK for network volume $100000", () => {
            const tier = getUserTier({
                personalLoanBalance: 500,
                networkVolume: 100000,
            });
            expect(tier).toBe("BLACK");
        });
    });

    describe("Edge Cases", () => {
        it("should remain BRONZE if no personal loan even with high network (Silver Gate)", () => {
            // High network but no personal loan - stays Bronze (Silver Gate)
            const tier = getUserTier({
                personalLoanBalance: 0,
                networkVolume: 50000,
            });
            expect(tier).toBe("BRONZE");
        });

        it("should handle floating point loan balances", () => {
            const tier = getUserTier({
                personalLoanBalance: 500.01,
                networkVolume: 0,
            });
            expect(tier).toBe("SILVER");
        });
    });
});

describe("TIER_THRESHOLDS", () => {
    it("should have correct threshold values", () => {
        expect(TIER_THRESHOLDS.SILVER).toBe(500);
        expect(TIER_THRESHOLDS.GOLD).toBe(5000);
        expect(TIER_THRESHOLDS.PLATINUM).toBe(10000);
        expect(TIER_THRESHOLDS.BLACK).toBe(50000);
    });
});

describe("getTierBenefits", () => {
    describe("GOLD tier benefits - APY removal regression test", () => {
        it("should NOT contain APY in GOLD tier benefits", () => {
            const benefits = getTierBenefits("GOLD");
            expect(benefits.toUpperCase()).not.toContain("APY");
        });

        it("should return 'Priority support' for GOLD tier", () => {
            const benefits = getTierBenefits("GOLD");
            expect(benefits).toBe("Priority support");
        });
    });
});
