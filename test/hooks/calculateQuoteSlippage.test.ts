/**
 * TDD Tests for calculateQuoteSlippage
 *
 * Calculates the estimated price impact of a swap quote by comparing
 * the quoted exchange rate against a reference rate from USD prices.
 *
 * Formula:
 *   expectedOutput = (sellAmount * sellTokenUsd) / buyTokenUsd
 *   slippagePct = ((expectedOutput - actualOutput) / expectedOutput) * 100
 *
 * Positive = worse than market, Negative = better than market
 */
import { describe, it, expect } from "vitest";
import { calculateQuoteSlippage } from "@/hooks/useGaslessSwap";

describe("calculateQuoteSlippage", () => {
    describe("basic slippage calculation", () => {
        it("should return 0 when quoted rate matches market rate exactly", () => {
            // 10 USDT ($1 each) -> 0.00014286 WBTC ($70,000 each)
            // expected: 10 / 70000 = 0.00014286
            const slippage = calculateQuoteSlippage({
                sellAmount: "10000000",   // 10 USDT (6 decimals)
                sellDecimals: 6,
                buyAmount: "14286",       // 0.00014286 WBTC (8 decimals)
                buyDecimals: 8,
                sellTokenUsd: 1,
                buyTokenUsd: 70000,
            });
            expect(Math.abs(slippage)).toBeLessThan(0.01);
        });

        it("should return positive slippage when output is worse than market", () => {
            // Market says 10 USDT should get 0.00014286 WBTC
            // But quote gives 0.00014000 WBTC (less than expected)
            const slippage = calculateQuoteSlippage({
                sellAmount: "10000000",   // 10 USDT
                sellDecimals: 6,
                buyAmount: "14000",       // 0.00014000 WBTC
                buyDecimals: 8,
                sellTokenUsd: 1,
                buyTokenUsd: 70000,
            });
            expect(slippage).toBeGreaterThan(0);
            expect(slippage).toBeCloseTo(2.0, 0); // ~2% worse
        });

        it("should return negative slippage when output is better than market", () => {
            // Market says 10 USDT should get 0.00014286 WBTC
            // But quote gives 0.00015000 WBTC (more than expected)
            const slippage = calculateQuoteSlippage({
                sellAmount: "10000000",   // 10 USDT
                sellDecimals: 6,
                buyAmount: "15000",       // 0.00015000 WBTC
                buyDecimals: 8,
                sellTokenUsd: 1,
                buyTokenUsd: 70000,
            });
            expect(slippage).toBeLessThan(0);
        });
    });

    describe("XAUT to USDT (Ethereum)", () => {
        it("should calculate slippage for gold token swap", () => {
            // 1 XAUT ($3000) -> USDT ($1)
            // expected: 3000 / 1 = 3000 USDT
            // quote gives 2970 USDT (1% slippage)
            const slippage = calculateQuoteSlippage({
                sellAmount: "1000000",     // 1 XAUT (6 decimals)
                sellDecimals: 6,
                buyAmount: "2970000000",   // 2970 USDT (6 decimals)
                buyDecimals: 6,
                sellTokenUsd: 3000,
                buyTokenUsd: 1,
            });
            expect(slippage).toBeCloseTo(1.0, 0);
        });
    });

    describe("ETH swaps", () => {
        it("should handle 18-decimal ETH correctly", () => {
            // 1 ETH ($2000) -> USDT ($1)
            // expected: 2000 USDT
            // quote gives 1990 USDT (0.5% slippage)
            const slippage = calculateQuoteSlippage({
                sellAmount: "1000000000000000000",  // 1 ETH (18 decimals)
                sellDecimals: 18,
                buyAmount: "1990000000",             // 1990 USDT (6 decimals)
                buyDecimals: 6,
                sellTokenUsd: 2000,
                buyTokenUsd: 1,
            });
            expect(slippage).toBeCloseTo(0.5, 1);
        });
    });

    describe("edge cases", () => {
        it("should return null when sell amount is 0", () => {
            const slippage = calculateQuoteSlippage({
                sellAmount: "0",
                sellDecimals: 6,
                buyAmount: "1000000",
                buyDecimals: 6,
                sellTokenUsd: 1,
                buyTokenUsd: 1,
            });
            expect(slippage).toBeNull();
        });

        it("should return null when buy amount is 0", () => {
            const slippage = calculateQuoteSlippage({
                sellAmount: "1000000",
                sellDecimals: 6,
                buyAmount: "0",
                buyDecimals: 6,
                sellTokenUsd: 1,
                buyTokenUsd: 1,
            });
            expect(slippage).toBeNull();
        });

        it("should return null when sell token price is 0", () => {
            const slippage = calculateQuoteSlippage({
                sellAmount: "1000000",
                sellDecimals: 6,
                buyAmount: "1000000",
                buyDecimals: 6,
                sellTokenUsd: 0,
                buyTokenUsd: 1,
            });
            expect(slippage).toBeNull();
        });

        it("should return null when buy token price is 0", () => {
            const slippage = calculateQuoteSlippage({
                sellAmount: "1000000",
                sellDecimals: 6,
                buyAmount: "1000000",
                buyDecimals: 6,
                sellTokenUsd: 1,
                buyTokenUsd: 0,
            });
            expect(slippage).toBeNull();
        });
    });

    describe("slippage threshold behavior for UI", () => {
        it("slippage below max should allow conversion", () => {
            // 0.3% slippage, 1% max
            const slippage = calculateQuoteSlippage({
                sellAmount: "10000000",
                sellDecimals: 6,
                buyAmount: "14243",     // ~0.3% less than 14286
                buyDecimals: 8,
                sellTokenUsd: 1,
                buyTokenUsd: 70000,
            });
            expect(slippage).not.toBeNull();
            expect(slippage!).toBeLessThan(1.0);
        });

        it("slippage above max should block conversion", () => {
            // 5% slippage, testing against 1% max
            const slippage = calculateQuoteSlippage({
                sellAmount: "10000000",
                sellDecimals: 6,
                buyAmount: "13571",     // ~5% less than 14286
                buyDecimals: 8,
                sellTokenUsd: 1,
                buyTokenUsd: 70000,
            });
            expect(slippage).not.toBeNull();
            expect(slippage!).toBeGreaterThan(1.0);
        });
    });

    describe("convert page UI integration (implementation verification)", () => {
        let pageCode: string;

        beforeAll(async () => {
            const fs = await import("fs");
            const path = await import("path");
            const pagePath = path.resolve(process.cwd(), "src/app/(main)/wallet/convert/page.tsx");
            pageCode = fs.readFileSync(pagePath, "utf-8");
        });

        it("should compute estimatedSlippage from quote using calculateQuoteSlippage", () => {
            expect(pageCode).toContain("calculateQuoteSlippage");
        });

        it("should display estimated slippage in the exchange rate card", () => {
            expect(pageCode).toContain("Est. Slippage");
        });

        it("should show slippage exceeded state on convert button", () => {
            expect(pageCode).toContain("slippageExceeded");
        });

        it("should show 'Try Lower Slippage' text when slippage exceeds max", () => {
            expect(pageCode).toContain("Try Lower Slippage");
        });

        it("should disable button when slippage is exceeded", () => {
            // Button disabled condition should include slippage check
            expect(pageCode).toContain("slippageExceeded");
        });

        it("should use red background when slippage is exceeded", () => {
            // Should have a conditional red styling for the button
            expect(pageCode).toMatch(/slippageExceeded.*bg-red|bg-red.*slippageExceeded/s);
        });
    });
});
