import { describe, expect, it } from "vitest";
import {
    calculateMaxWithdrawable,
    calculateCollateralBreakdown,
    canWithdrawAmount,
} from "@/lib/calculations/collateralCalculations";

describe("calculateMaxWithdrawable", () => {
    const BTC_PRICE = 95000; // $95,000 per BTC
    const MAX_LTV = 0.70; // 70% max LTV

    describe("with no loans", () => {
        it("should allow full withdrawal when no loans exist", () => {
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 0;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            expect(result).toBe(1.0);
        });

        it("should return 0 when no collateral exists", () => {
            const result = calculateMaxWithdrawable(0, 0, BTC_PRICE, MAX_LTV);
            expect(result).toBe(0);
        });
    });

    describe("with active loans", () => {
        it("should calculate correct withdrawable amount with partial loan (with 1% LTV buffer)", () => {
            // $95,000 collateral, $33,250 borrowed (35% LTV)
            // With 1% buffer: effective LTV = 0.69
            // Min collateral needed = $33,250 / 0.69 = $48,188.41
            // Available to withdraw = $95,000 - $48,188.41 = $46,811.59 = 0.4927 BTC
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 33250;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            expect(result).toBeCloseTo(0.4927, 3);
        });

        it("should return 0 when at buffered max LTV (69%)", () => {
            // $95,000 collateral, $65,550 borrowed (69% effective LTV with buffer)
            // With 1% buffer at 70% max LTV, effective limit is 69%
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 65550; // 69% of $95,000

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            expect(result).toBeCloseTo(0, 2);
        });

        it("should return 0 when over max LTV (underwater)", () => {
            // $95,000 collateral, $80,000 borrowed (84% LTV - over max)
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 80000;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            expect(result).toBe(0);
        });

        it("should handle small loan amounts correctly (with 1% LTV buffer)", () => {
            // $95,000 collateral, $1,000 borrowed
            // With 1% buffer: effective LTV = 0.69
            // Min collateral = $1,000 / 0.69 = $1,449.28
            // Available = $95,000 - $1,449.28 = $93,550.72 = 0.9847 BTC
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 1000;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            expect(result).toBeCloseTo(0.9847, 3);
        });
    });

    describe("edge cases", () => {
        it("should return 0 for negative collateral input", () => {
            const result = calculateMaxWithdrawable(-1, 0, BTC_PRICE, MAX_LTV);
            expect(result).toBe(0);
        });

        it("should handle negative borrowed amount as 0", () => {
            const result = calculateMaxWithdrawable(1.0, -1000, BTC_PRICE, MAX_LTV);
            expect(result).toBe(1.0);
        });

        it("should return 0 for zero BTC price", () => {
            const result = calculateMaxWithdrawable(1.0, 0, 0, MAX_LTV);
            expect(result).toBe(0);
        });

        it("should return 0 for negative BTC price", () => {
            const result = calculateMaxWithdrawable(1.0, 0, -95000, MAX_LTV);
            expect(result).toBe(0);
        });

        it("should handle 100% max LTV (with 1% buffer = 99% effective)", () => {
            // At 100% LTV with 1% buffer, effective LTV = 0.99
            // Min collateral = $47,500 / 0.99 = $47,979.80
            // Available = $95,000 - $47,979.80 = $47,020.20 = 0.495 BTC
            const result = calculateMaxWithdrawable(1.0, 47500, BTC_PRICE, 1.0);
            expect(result).toBeCloseTo(0.495, 2);
        });

        it("should handle 0% max LTV (no borrowing allowed)", () => {
            // At 0% LTV, can't borrow at all, so all collateral is available
            const result = calculateMaxWithdrawable(1.0, 0, BTC_PRICE, 0);
            expect(result).toBe(1.0);
        });

        it("should handle very small amounts without floating point errors", () => {
            const result = calculateMaxWithdrawable(0.00001, 0, BTC_PRICE, MAX_LTV);
            expect(result).toBe(0.00001);
        });
    });
});

describe("calculateCollateralBreakdown", () => {
    const BTC_PRICE = 95000;
    const MAX_LTV = 0.70;

    it("should combine wallet and compound balances", () => {
        const walletWbtc = 0.3;
        const compoundWbtc = 0.7;

        const result = calculateCollateralBreakdown(
            walletWbtc,
            compoundWbtc,
            0, // no loans
            BTC_PRICE,
            MAX_LTV
        );

        expect(result.totalCollateralBtc).toBe(1.0);
        expect(result.totalCollateralUsd).toBe(95000);
    });

    it("should calculate locked and available correctly with loans (with 1% LTV buffer)", () => {
        const walletWbtc = 0;
        const compoundWbtc = 1.0;
        const borrowedUsd = 33250; // 35% LTV

        const result = calculateCollateralBreakdown(
            walletWbtc,
            compoundWbtc,
            borrowedUsd,
            BTC_PRICE,
            MAX_LTV
        );

        // With 1% buffer: effective LTV = 0.69
        // Locked = min collateral needed = $33,250 / 0.69 = $48,188.41 = 0.5072 BTC
        expect(result.lockedCollateralBtc).toBeCloseTo(0.5072, 3);
        expect(result.lockedCollateralUsd).toBeCloseTo(48188, 0);

        // Available = total - locked = 1.0 - 0.5072 = 0.4928 BTC
        expect(result.availableToWithdrawBtc).toBeCloseTo(0.4928, 3);
        expect(result.availableToWithdrawUsd).toBeCloseTo(46812, 0);
    });

    it("should calculate health factor correctly", () => {
        const walletWbtc = 0;
        const compoundWbtc = 1.0;
        const borrowedUsd = 47500; // 50% LTV

        const result = calculateCollateralBreakdown(
            walletWbtc,
            compoundWbtc,
            borrowedUsd,
            BTC_PRICE,
            MAX_LTV
        );

        // Health factor = (collateralUsd * maxLTV) / borrowedUsd
        // = ($95,000 * 0.70) / $47,500 = 1.4
        expect(result.healthFactor).toBeCloseTo(1.4, 2);
    });

    it("should show health factor > 999 when no loans", () => {
        const result = calculateCollateralBreakdown(0.5, 0.5, 0, BTC_PRICE, MAX_LTV);
        expect(result.healthFactor).toBeGreaterThan(999);
    });

    it("should handle underwater positions (health < 1)", () => {
        const compoundWbtc = 1.0;
        const borrowedUsd = 80000; // 84% LTV - over max

        const result = calculateCollateralBreakdown(
            0,
            compoundWbtc,
            borrowedUsd,
            BTC_PRICE,
            MAX_LTV
        );

        // Health factor = ($95,000 * 0.70) / $80,000 = 0.83
        expect(result.healthFactor).toBeCloseTo(0.83, 2);
        expect(result.lockedCollateralBtc).toBe(1.0); // All locked
        expect(result.availableToWithdrawBtc).toBe(0);
    });
});

describe("canWithdrawAmount", () => {
    const BTC_PRICE = 95000;
    const MAX_LTV = 0.70;

    it("should allow withdrawal when amount is less than available", () => {
        const breakdown = calculateCollateralBreakdown(0, 1.0, 33250, BTC_PRICE, MAX_LTV);

        const result = canWithdrawAmount(0.3, breakdown);

        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
    });

    it("should allow withdrawal of exact available amount", () => {
        const breakdown = calculateCollateralBreakdown(0, 1.0, 33250, BTC_PRICE, MAX_LTV);

        const result = canWithdrawAmount(breakdown.availableToWithdrawBtc, breakdown);

        expect(result.allowed).toBe(true);
    });

    it("should block withdrawal when amount exceeds available", () => {
        const breakdown = calculateCollateralBreakdown(0, 1.0, 33250, BTC_PRICE, MAX_LTV);

        const result = canWithdrawAmount(0.8, breakdown);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("under-collateralize");
    });

    it("should block any withdrawal when at max LTV", () => {
        const breakdown = calculateCollateralBreakdown(0, 1.0, 66500, BTC_PRICE, MAX_LTV);

        const result = canWithdrawAmount(0.01, breakdown);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("under-collateralize");
    });

    it("should allow zero withdrawal", () => {
        const breakdown = calculateCollateralBreakdown(0, 1.0, 66500, BTC_PRICE, MAX_LTV);

        const result = canWithdrawAmount(0, breakdown);

        expect(result.allowed).toBe(true);
    });

    it("should block negative withdrawal amounts", () => {
        const breakdown = calculateCollateralBreakdown(0, 1.0, 0, BTC_PRICE, MAX_LTV);

        const result = canWithdrawAmount(-0.1, breakdown);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("Invalid");
    });
});

describe("1% LTV Buffer for Withdrawals", () => {
    const BTC_PRICE = 95000;
    const MAX_LTV = 0.70; // 70% max LTV

    describe("calculateMaxWithdrawable with buffer", () => {
        it("should use effective LTV of 0.69 (70% - 1%) for withdrawal calculations", () => {
            // $95,000 collateral, $33,250 borrowed (35% LTV)
            // With 1% buffer, effective LTV = 0.69 (not 0.70)
            // Min collateral needed = $33,250 / 0.69 = $48,188.41
            // Available to withdraw = $95,000 - $48,188.41 = $46,811.59 = 0.4927 BTC
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 33250;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            // With buffer: $33,250 / 0.69 = $48,188.41 locked
            // Available = $95,000 - $48,188.41 = $46,811.59 = 0.4927 BTC
            expect(result).toBeCloseTo(0.4927, 3);
        });

        it("should return less withdrawable amount than without buffer", () => {
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 33250;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            // Without buffer: $33,250 / 0.70 = $47,500 locked, available = 0.5 BTC
            // With buffer: $33,250 / 0.69 = $48,188.41 locked, available = 0.4927 BTC
            // So result should be less than 0.5 BTC
            expect(result).toBeLessThan(0.5);
        });

        it("should handle very low LTV (0.02) with 1% buffer correctly", () => {
            // Very low LTV edge case: 2% LTV with 1% buffer = 1% effective
            const LOW_LTV = 0.02;
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 950; // 1% of $95,000

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                LOW_LTV
            );

            // Effective LTV = 0.02 - 0.01 = 0.01
            // Min collateral = $950 / 0.01 = $95,000 (all collateral locked)
            // Available = $95,000 - $95,000 = $0
            expect(result).toBe(0);
        });

        it("should handle LTV just above buffer threshold (0.02)", () => {
            const LOW_LTV = 0.02;
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 475; // 0.5% of $95,000

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                LOW_LTV
            );

            // Effective LTV = 0.02 - 0.01 = 0.01
            // Min collateral = $475 / 0.01 = $47,500
            // Available = $95,000 - $47,500 = $47,500 = 0.5 BTC
            expect(result).toBeCloseTo(0.5, 2);
        });
    });

    describe("calculateCollateralBreakdown with buffer", () => {
        it("should calculate locked collateral using buffered LTV (0.69 instead of 0.70)", () => {
            const walletWbtc = 0;
            const compoundWbtc = 1.0;
            const borrowedUsd = 33250;

            const result = calculateCollateralBreakdown(
                walletWbtc,
                compoundWbtc,
                borrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            // With 1% buffer: locked = $33,250 / 0.69 = $48,188.41
            expect(result.lockedCollateralUsd).toBeCloseTo(48188.41, 0);
            expect(result.lockedCollateralBtc).toBeCloseTo(0.5072, 3);

            // Available = total - locked = $95,000 - $48,188.41 = $46,811.59
            expect(result.availableToWithdrawUsd).toBeCloseTo(46811.59, 0);
            expect(result.availableToWithdrawBtc).toBeCloseTo(0.4927, 3);
        });

        it("should NOT apply buffer to health factor calculation", () => {
            const walletWbtc = 0;
            const compoundWbtc = 1.0;
            const borrowedUsd = 47500; // 50% LTV

            const result = calculateCollateralBreakdown(
                walletWbtc,
                compoundWbtc,
                borrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            // Health factor should still use original maxLTV (0.70), not buffered
            // Health factor = (collateralUsd * maxLTV) / borrowedUsd
            // = ($95,000 * 0.70) / $47,500 = 1.4
            expect(result.healthFactor).toBeCloseTo(1.4, 2);
        });

        it("should show locked collateral is higher with buffer than without", () => {
            const borrowedUsd = 33250;

            const result = calculateCollateralBreakdown(
                0,
                1.0,
                borrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            // Without buffer: locked = $33,250 / 0.70 = $47,500
            // With buffer: locked = $33,250 / 0.69 = $48,188.41
            // So locked should be greater than $47,500
            expect(result.lockedCollateralUsd).toBeGreaterThan(47500);
        });

        it("should handle edge case where buffer makes position appear at limit", () => {
            // Borrowed such that with buffer, user is at the limit
            // If effective LTV = 0.69, and collateral = $95,000
            // At limit: borrowed = $95,000 * 0.69 = $65,550
            const borrowedUsd = 65550;

            const result = calculateCollateralBreakdown(
                0,
                1.0,
                borrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            // All collateral should be locked (or nearly all)
            expect(result.availableToWithdrawBtc).toBeCloseTo(0, 2);
        });
    });
});
