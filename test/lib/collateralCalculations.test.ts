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
        it("should calculate correct withdrawable amount with partial loan", () => {
            // $95,000 collateral, $33,250 borrowed (35% LTV)
            // At 70% max LTV, min collateral needed = $33,250 / 0.70 = $47,500
            // Available to withdraw = $95,000 - $47,500 = $47,500 = 0.5 BTC
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 33250;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            expect(result).toBeCloseTo(0.5, 2);
        });

        it("should return 0 when at max LTV", () => {
            // $95,000 collateral, $66,500 borrowed (70% LTV - exactly at max)
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 66500;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            expect(result).toBe(0);
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

        it("should handle small loan amounts correctly", () => {
            // $95,000 collateral, $1,000 borrowed
            // Min collateral = $1,000 / 0.70 = $1,428.57
            // Available = $95,000 - $1,428.57 = $93,571.43 = 0.9849 BTC
            const totalCollateralBtc = 1.0;
            const totalBorrowedUsd = 1000;

            const result = calculateMaxWithdrawable(
                totalCollateralBtc,
                totalBorrowedUsd,
                BTC_PRICE,
                MAX_LTV
            );

            expect(result).toBeCloseTo(0.9849, 3);
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

        it("should handle 100% max LTV", () => {
            // At 100% LTV, min collateral = borrowed amount
            const result = calculateMaxWithdrawable(1.0, 47500, BTC_PRICE, 1.0);
            // $95,000 - $47,500 = $47,500 = 0.5 BTC
            expect(result).toBeCloseTo(0.5, 2);
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

    it("should calculate locked and available correctly with loans", () => {
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

        // Locked = min collateral needed = $33,250 / 0.70 = $47,500 = 0.5 BTC
        expect(result.lockedCollateralBtc).toBeCloseTo(0.5, 2);
        expect(result.lockedCollateralUsd).toBeCloseTo(47500, 0);

        // Available = total - locked = 1.0 - 0.5 = 0.5 BTC
        expect(result.availableToWithdrawBtc).toBeCloseTo(0.5, 2);
        expect(result.availableToWithdrawUsd).toBeCloseTo(47500, 0);
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
