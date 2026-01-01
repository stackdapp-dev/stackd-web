/**
 * Unit tests for tier explainer helper functions
 * TDD: Write tests FIRST, then implement
 *
 * Tests helper functions for the tier explainer page:
 * - getTierRequirements: Returns requirement details for a tier
 * - getTierBenefitsList: Returns full benefits list for a tier
 * - getNextTier: Returns the next tier to advance to
 * - canAdvanceToTier: Checks if user meets requirements
 */
import { describe, it, expect } from "vitest";
import {
    getTierRequirements,
    getTierBenefitsList,
    getNextTier,
    canAdvanceToTier,
    type TierRequirements,
    type TierBenefit,
} from "@/lib/referrals/tierExplainer";
import type { UserTier } from "@/lib/referrals/tiers";

describe("Tier Explainer Helper Functions", () => {
    describe("getTierRequirements", () => {
        it("should return correct requirements for BRONZE tier", () => {
            const requirements = getTierRequirements("BRONZE");

            expect(requirements).toMatchObject({
                tier: "BRONZE",
                description: expect.stringMatching(/starting tier/i),
                personalLoanRequired: 0,
                networkVolumeRequired: 0,
                requiresSilver: false,
            });
        });

        it("should return correct requirements for SILVER tier", () => {
            const requirements = getTierRequirements("SILVER");

            expect(requirements).toMatchObject({
                tier: "SILVER",
                description: expect.stringMatching(/personal loan/i),
                personalLoanRequired: 500,
                networkVolumeRequired: 0,
                requiresSilver: false,
            });
        });

        it("should return correct requirements for GOLD tier", () => {
            const requirements = getTierRequirements("GOLD");

            expect(requirements).toMatchObject({
                tier: "GOLD",
                description: expect.stringMatching(/network volume/i),
                personalLoanRequired: 500,
                networkVolumeRequired: 5000,
                requiresSilver: true,
            });
        });

        it("should return correct requirements for PLATINUM tier", () => {
            const requirements = getTierRequirements("PLATINUM");

            expect(requirements).toMatchObject({
                tier: "PLATINUM",
                description: expect.stringMatching(/network volume/i),
                personalLoanRequired: 500,
                networkVolumeRequired: 10000,
                requiresSilver: true,
            });
        });

        it("should return correct requirements for BLACK tier", () => {
            const requirements = getTierRequirements("BLACK");

            expect(requirements).toMatchObject({
                tier: "BLACK",
                description: expect.stringMatching(/network volume/i),
                personalLoanRequired: 500,
                networkVolumeRequired: 50000,
                requiresSilver: true,
            });
        });

        it("should include formatted requirement string", () => {
            const requirements = getTierRequirements("GOLD");

            expect(requirements.formattedRequirement).toMatch(/\$5,000/);
        });
    });

    describe("getTierBenefitsList", () => {
        it("should return correct benefits list for BRONZE tier", () => {
            const benefits = getTierBenefitsList("BRONZE");

            expect(benefits).toContainEqual(
                expect.objectContaining({
                    name: expect.stringMatching(/base earnings/i),
                })
            );
            expect(benefits).toContainEqual(
                expect.objectContaining({
                    name: expect.stringMatching(/track referral network/i),
                })
            );
        });

        it("should return correct benefits list for SILVER tier", () => {
            const benefits = getTierBenefitsList("SILVER");

            expect(benefits).toContainEqual(
                expect.objectContaining({
                    name: expect.stringMatching(/payouts unlocked/i),
                })
            );
            expect(benefits).toContainEqual(
                expect.objectContaining({
                    name: expect.stringMatching(/withdraw earnings/i),
                })
            );
        });

        it("should return correct benefits list for GOLD tier", () => {
            const benefits = getTierBenefitsList("GOLD");

            expect(benefits).toContainEqual(
                expect.objectContaining({
                    name: expect.stringMatching(/\+5% APY boost/i),
                })
            );
        });

        it("should return correct benefits list for PLATINUM tier", () => {
            const benefits = getTierBenefitsList("PLATINUM");

            expect(benefits).toContainEqual(
                expect.objectContaining({
                    name: expect.stringMatching(/priority support/i),
                })
            );
        });

        it("should return correct benefits list for BLACK tier", () => {
            const benefits = getTierBenefitsList("BLACK");

            expect(benefits).toContainEqual(
                expect.objectContaining({
                    name: expect.stringMatching(/metal visa/i),
                })
            );
            expect(benefits).toContainEqual(
                expect.objectContaining({
                    name: expect.stringMatching(/exclusive events/i),
                })
            );
        });

        it("should include inherited benefits for higher tiers", () => {
            const goldBenefits = getTierBenefitsList("GOLD");

            // Gold should include Silver benefits
            const inheritedBenefits = goldBenefits.filter((b) => b.inherited);
            expect(inheritedBenefits.length).toBeGreaterThan(0);
        });

        it("should mark tier-specific benefits as not inherited", () => {
            const goldBenefits = getTierBenefitsList("GOLD");

            const apyBoost = goldBenefits.find((b) => /apy boost/i.test(b.name));
            expect(apyBoost?.inherited).toBe(false);
        });

        it("should include benefit descriptions", () => {
            const silverBenefits = getTierBenefitsList("SILVER");

            const payoutBenefit = silverBenefits.find((b) => /payouts unlocked/i.test(b.name));
            expect(payoutBenefit?.description).toBeDefined();
            expect(payoutBenefit?.description).toMatch(/withdraw|earnings/i);
        });
    });

    describe("getNextTier", () => {
        it("should return SILVER as next tier for BRONZE", () => {
            const nextTier = getNextTier("BRONZE");
            expect(nextTier).toBe("SILVER");
        });

        it("should return GOLD as next tier for SILVER", () => {
            const nextTier = getNextTier("SILVER");
            expect(nextTier).toBe("GOLD");
        });

        it("should return PLATINUM as next tier for GOLD", () => {
            const nextTier = getNextTier("GOLD");
            expect(nextTier).toBe("PLATINUM");
        });

        it("should return BLACK as next tier for PLATINUM", () => {
            const nextTier = getNextTier("PLATINUM");
            expect(nextTier).toBe("BLACK");
        });

        it("should return null for BLACK (max tier)", () => {
            const nextTier = getNextTier("BLACK");
            expect(nextTier).toBeNull();
        });
    });

    describe("canAdvanceToTier", () => {
        describe("Advancing to SILVER", () => {
            it("should return true if personal loan >= $500", () => {
                const canAdvance = canAdvanceToTier("SILVER", {
                    personalLoanBalance: 500,
                    networkVolume: 0,
                });
                expect(canAdvance).toBe(true);
            });

            it("should return false if personal loan < $500", () => {
                const canAdvance = canAdvanceToTier("SILVER", {
                    personalLoanBalance: 499,
                    networkVolume: 0,
                });
                expect(canAdvance).toBe(false);
            });

            it("should return true if personal loan > $500", () => {
                const canAdvance = canAdvanceToTier("SILVER", {
                    personalLoanBalance: 1000,
                    networkVolume: 0,
                });
                expect(canAdvance).toBe(true);
            });
        });

        describe("Advancing to GOLD", () => {
            it("should return true if has Silver AND network volume >= $5,000", () => {
                const canAdvance = canAdvanceToTier("GOLD", {
                    personalLoanBalance: 500,
                    networkVolume: 5000,
                });
                expect(canAdvance).toBe(true);
            });

            it("should return false if no Silver (personal loan < $500)", () => {
                const canAdvance = canAdvanceToTier("GOLD", {
                    personalLoanBalance: 0,
                    networkVolume: 10000,
                });
                expect(canAdvance).toBe(false);
            });

            it("should return false if network volume < $5,000", () => {
                const canAdvance = canAdvanceToTier("GOLD", {
                    personalLoanBalance: 500,
                    networkVolume: 4999,
                });
                expect(canAdvance).toBe(false);
            });
        });

        describe("Advancing to PLATINUM", () => {
            it("should return true if has Silver AND network volume >= $10,000", () => {
                const canAdvance = canAdvanceToTier("PLATINUM", {
                    personalLoanBalance: 500,
                    networkVolume: 10000,
                });
                expect(canAdvance).toBe(true);
            });

            it("should return false if no Silver", () => {
                const canAdvance = canAdvanceToTier("PLATINUM", {
                    personalLoanBalance: 0,
                    networkVolume: 50000,
                });
                expect(canAdvance).toBe(false);
            });

            it("should return false if network volume < $10,000", () => {
                const canAdvance = canAdvanceToTier("PLATINUM", {
                    personalLoanBalance: 500,
                    networkVolume: 9999,
                });
                expect(canAdvance).toBe(false);
            });
        });

        describe("Advancing to BLACK", () => {
            it("should return true if has Silver AND network volume >= $50,000", () => {
                const canAdvance = canAdvanceToTier("BLACK", {
                    personalLoanBalance: 500,
                    networkVolume: 50000,
                });
                expect(canAdvance).toBe(true);
            });

            it("should return false if no Silver", () => {
                const canAdvance = canAdvanceToTier("BLACK", {
                    personalLoanBalance: 0,
                    networkVolume: 100000,
                });
                expect(canAdvance).toBe(false);
            });

            it("should return false if network volume < $50,000", () => {
                const canAdvance = canAdvanceToTier("BLACK", {
                    personalLoanBalance: 500,
                    networkVolume: 49999,
                });
                expect(canAdvance).toBe(false);
            });
        });

        describe("Advancing to BRONZE", () => {
            it("should always return true for BRONZE (default tier)", () => {
                const canAdvance = canAdvanceToTier("BRONZE", {
                    personalLoanBalance: 0,
                    networkVolume: 0,
                });
                expect(canAdvance).toBe(true);
            });
        });

        describe("Edge Cases", () => {
            it("should handle exact threshold values", () => {
                // Exact Silver threshold
                expect(
                    canAdvanceToTier("SILVER", {
                        personalLoanBalance: 500,
                        networkVolume: 0,
                    })
                ).toBe(true);

                // Exact Gold threshold
                expect(
                    canAdvanceToTier("GOLD", {
                        personalLoanBalance: 500,
                        networkVolume: 5000,
                    })
                ).toBe(true);
            });

            it("should handle floating point values", () => {
                const canAdvance = canAdvanceToTier("SILVER", {
                    personalLoanBalance: 500.01,
                    networkVolume: 0,
                });
                expect(canAdvance).toBe(true);
            });

            it("should handle very large values", () => {
                const canAdvance = canAdvanceToTier("BLACK", {
                    personalLoanBalance: 10000,
                    networkVolume: 1000000,
                });
                expect(canAdvance).toBe(true);
            });
        });
    });
});
