/**
 * TDD Tests for validateSlippage
 *
 * Tests the slippage guard that compares fresh quote buyAmount against
 * the original quote to protect users from price movement during signing.
 */
import { describe, it, expect } from "vitest";
import { validateSlippage } from "@/hooks/useGaslessSwap";

describe("validateSlippage", () => {
    describe("within tolerance", () => {
        it("should return 0 slippage when amounts are identical", () => {
            const slippage = validateSlippage("1000000", "1000000", 1.0);
            expect(slippage).toBe(0);
        });

        it("should return positive slippage when fresh quote is slightly lower", () => {
            // 0.5% slippage: 1000000 -> 995000
            const slippage = validateSlippage("1000000", "995000", 1.0);
            expect(slippage).toBeCloseTo(0.5, 1);
        });

        it("should not throw when slippage equals max tolerance", () => {
            // Exactly 1.0% slippage: 1000000 -> 990000
            expect(() => validateSlippage("1000000", "990000", 1.0)).not.toThrow();
        });

        it("should return negative slippage (price improved) without throwing", () => {
            // Fresh quote is better than original (negative slippage)
            const slippage = validateSlippage("1000000", "1010000", 1.0);
            expect(slippage).toBeLessThan(0);
        });
    });

    describe("exceeds tolerance", () => {
        it("should throw when slippage exceeds max tolerance", () => {
            // 2% slippage with 1% max
            expect(() => validateSlippage("1000000", "980000", 1.0)).toThrow(
                /exceeds your max slippage/
            );
        });

        it("should include actual slippage percentage in error message", () => {
            expect(() => validateSlippage("1000000", "950000", 1.0)).toThrow("5.00%");
        });

        it("should include max slippage in error message", () => {
            expect(() => validateSlippage("1000000", "950000", 2.5)).toThrow("2.5%");
        });

        it("should throw for large slippage (e.g. 10%)", () => {
            expect(() => validateSlippage("1000000", "900000", 5.0)).toThrow(
                /exceeds your max slippage/
            );
        });
    });

    describe("edge cases", () => {
        it("should return 0 when original buy amount is 0", () => {
            const slippage = validateSlippage("0", "1000000", 1.0);
            expect(slippage).toBe(0);
        });

        it("should return 0 when fresh buy amount is 0", () => {
            const slippage = validateSlippage("1000000", "0", 1.0);
            expect(slippage).toBe(0);
        });

        it("should return 0 when both amounts are 0", () => {
            const slippage = validateSlippage("0", "0", 1.0);
            expect(slippage).toBe(0);
        });

        it("should handle very small amounts (dust)", () => {
            const slippage = validateSlippage("100", "99", 1.0);
            expect(slippage).toBeCloseTo(1.0, 1);
        });

        it("should handle very large amounts", () => {
            // 0.1% slippage on large numbers
            const slippage = validateSlippage("999999999999", "999000000000", 1.0);
            expect(slippage).toBeGreaterThan(0);
            expect(slippage).toBeLessThan(1.0);
        });

        it("should work with different max slippage values", () => {
            // 3% slippage with 5% max — should pass
            expect(() => validateSlippage("1000000", "970000", 5.0)).not.toThrow();

            // 3% slippage with 0.5% max — should fail
            expect(() => validateSlippage("1000000", "970000", 0.5)).toThrow();
        });
    });

    describe("implementation verification", () => {
        it("useGaslessSwap should accept maxSlippagePct parameter", async () => {
            const fs = await import("fs");
            const path = await import("path");
            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            expect(hookCode).toContain("export function useGaslessSwap(chainId: number = 42161, maxSlippagePct: number = 1.0)");
        });

        it("executeSwap should call validateSlippage", async () => {
            const fs = await import("fs");
            const path = await import("path");
            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            const executeSwapMatch = hookCode.match(/const executeSwap = useCallback\(async[^]*?}, \[/s);
            expect(executeSwapMatch).not.toBeNull();

            if (executeSwapMatch) {
                expect(executeSwapMatch[0]).toContain("validateSlippage(quote.buyAmount, freshQuote.buyAmount, maxSlippagePct)");
            }
        });

        it("convert page should pass maxSlippage to useGaslessSwap", async () => {
            const fs = await import("fs");
            const path = await import("path");
            const pagePath = path.resolve(process.cwd(), "src/app/(main)/wallet/convert/page.tsx");
            const pageCode = fs.readFileSync(pagePath, "utf-8");

            expect(pageCode).toContain("useGaslessSwap(chainId, parseFloat(maxSlippage)");
        });
    });
});
